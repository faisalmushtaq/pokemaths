// =============================================================================
// POKÉMATHS | CLOUD SYNCHRONISATION
// =============================================================================
// One Google account owns up to five profiles stored in Firestore. The game
// remains fully playable offline, and Firebase code is requested only when an
// account or synchronisation action needs it.
// =============================================================================

import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { firebaseReady, getFirebaseAuth, getFirebaseDb } from './firebase';
import { mergeSaves, type SaveData } from './pokedex';
import {
  snapshotLocal,
  replaceLocal,
  MAX_PROFILES,
  type Profile,
} from './profiles';

interface CloudDoc {
  profiles: Profile[];
  saves: Record<string, SaveData>;
  updatedAt: number;
}

async function firestoreServices() {
  const [db, firestore] = await Promise.all([getFirebaseDb(), import('firebase/firestore/lite')]);
  return { db, ...firestore };
}

/**
 * Merge the account's cloud state with local storage and write the result to
 * both. Every profile and save is retained through the existing union rule.
 */
export async function pullAndMerge(uid: string): Promise<void> {
  const local = snapshotLocal();
  let cloud: CloudDoc = { profiles: [], saves: {}, updatedAt: 0 };
  let services: Awaited<ReturnType<typeof firestoreServices>>;
  try {
    services = await firestoreServices();
    const snap = await services.getDoc(services.doc(services.db, 'saves', uid));
    if (snap.exists()) cloud = snap.data() as CloudDoc;
  } catch {
    return;
  }

  const byId = new Map<string, Profile>();
  for (const profile of cloud.profiles ?? []) byId.set(profile.id, profile);
  for (const profile of local.profiles) if (!byId.has(profile.id)) byId.set(profile.id, profile);
  const profiles = Array.from(byId.values()).slice(0, MAX_PROFILES);

  const saves: Record<string, SaveData> = {};
  for (const profile of profiles) {
    const cloudSave = cloud.saves?.[profile.id];
    const localSave = local.saves[profile.id];
    saves[profile.id] = cloudSave && localSave ? mergeSaves(cloudSave, localSave) : (cloudSave ?? localSave ?? { version: 1, caught: {}, wonBattles: [] });
  }

  const activeId = local.activeId ?? profiles[0]?.id ?? null;
  replaceLocal(profiles, saves, activeId);
  try {
    await services.setDoc(services.doc(services.db, 'saves', uid), { profiles, saves, updatedAt: Date.now() });
  } catch {
    // Local progress already contains the merged result.
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

/** Push the whole account after local changes, avoiding a write per interaction. */
export function pushAllDebounced(uid: string): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    const local = snapshotLocal();
    firestoreServices()
      .then((services) => services.setDoc(services.doc(services.db, 'saves', uid), {
        profiles: local.profiles,
        saves: local.saves,
        updatedAt: Date.now(),
      }))
      .catch(() => {
        // The next synchronisation attempt will retry the write.
      });
  }, 1500);
}

export async function signInGoogle(): Promise<void> {
  const [{ auth, googleProvider }, authModule] = await Promise.all([getFirebaseAuth(), import('firebase/auth')]);
  try {
    await authModule.signInWithPopup(auth, googleProvider);
  } catch {
    await authModule.signInWithRedirect(auth, googleProvider);
  }
}

export async function signOutCloud(): Promise<void> {
  const [{ auth }, authModule] = await Promise.all([getFirebaseAuth(), import('firebase/auth')]);
  await authModule.signOut(auth);
}

/** Current signed-in user. `ready` becomes true once account state resolves. */
export function useAuthUser(): { user: User | null; ready: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!firebaseReady());

  useEffect(() => {
    if (!firebaseReady()) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;

    Promise.all([getFirebaseAuth(), import('firebase/auth')])
      .then(([{ auth }, authModule]) => {
        if (!active) return;
        authModule.getRedirectResult(auth).catch(() => {});
        unsubscribe = authModule.onAuthStateChanged(auth, (nextUser) => {
          if (!active) return;
          setUser(nextUser);
          setReady(true);
        });
      })
      .catch(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  return { user, ready };
}

export { firebaseReady };
