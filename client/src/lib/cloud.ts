// =============================================================================
// POKÉMATHS — CLOUD SYNC (Google account)
// =============================================================================
// One Google account owns up to 5 profiles, stored at Firestore saves/{uid}.
// Signing in merges local ⇄ cloud (conflict-free union of profiles + saves),
// then keeps them in sync. The app works fully offline without an account.
//
// NOTE: cloud sync is currently ungated — the premium (one-time payment) gate
// will wrap this once Stripe is wired.
// =============================================================================

import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseReady, getFirebase, googleProvider } from './firebase';
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

function cloudRef(uid: string) {
  const { db } = getFirebase();
  return doc(db, 'saves', uid);
}

/**
 * Merge the account's cloud state with local storage and write the result to
 * both. Union rule: keep every profile (cloud first, adopt local up to 5) and
 * merge each profile's save so nothing is ever lost.
 */
export async function pullAndMerge(uid: string): Promise<void> {
  const local = snapshotLocal();
  let cloud: CloudDoc = { profiles: [], saves: {}, updatedAt: 0 };
  try {
    const snap = await getDoc(cloudRef(uid));
    if (snap.exists()) cloud = snap.data() as CloudDoc;
  } catch {
    return; // offline / permission — stay local
  }

  const byId = new Map<string, Profile>();
  for (const p of cloud.profiles ?? []) byId.set(p.id, p);
  for (const p of local.profiles) if (!byId.has(p.id)) byId.set(p.id, p); // adopt local
  const profiles = Array.from(byId.values()).slice(0, MAX_PROFILES);

  const saves: Record<string, SaveData> = {};
  for (const p of profiles) {
    const c = cloud.saves?.[p.id];
    const l = local.saves[p.id];
    saves[p.id] = c && l ? mergeSaves(c, l) : (c ?? l ?? { version: 1, caught: {}, wonBattles: [] });
  }

  const activeId = local.activeId ?? profiles[0]?.id ?? null;
  replaceLocal(profiles, saves, activeId);
  try {
    await setDoc(cloudRef(uid), { profiles, saves, updatedAt: Date.now() });
  } catch {
    /* write may fail if not permitted — local already updated */
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

/** Push the whole account (profiles + saves) to the cloud, debounced. */
export function pushAllDebounced(uid: string): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    const local = snapshotLocal();
    setDoc(cloudRef(uid), {
      profiles: local.profiles,
      saves: local.saves,
      updatedAt: Date.now(),
    }).catch(() => {
      /* offline — will re-push on next change */
    });
  }, 1500);
}

export async function signInGoogle(): Promise<void> {
  const { auth } = getFirebase();
  try {
    await signInWithPopup(auth, googleProvider);
  } catch {
    // Popups are unreliable in installed PWAs / iOS Safari — fall back to redirect.
    await signInWithRedirect(auth, googleProvider);
  }
}

export async function signOutCloud(): Promise<void> {
  const { auth } = getFirebase();
  await signOut(auth);
}

/** Current signed-in user (or null). `ready` flips true once auth is resolved. */
export function useAuthUser(): { user: User | null; ready: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!firebaseReady());
  useEffect(() => {
    if (!firebaseReady()) return;
    const { auth } = getFirebase();
    // Complete any pending redirect sign-in, then listen for state.
    getRedirectResult(auth).catch(() => {});
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
  }, []);
  return { user, ready };
}

export { firebaseReady };
