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
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
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

function profileKey(profile: Profile): string {
  return `${profile.name.trim().toLocaleLowerCase()}::${profile.avatarDex}`;
}

/**
 * Merge the account's cloud state with local storage and write the result to
 * both. Union rule: keep every profile (cloud first, adopt local up to 5) and
 * merge each profile's save so nothing is ever lost.
 */
export async function pullAndMerge(uid: string): Promise<boolean> {
  const local = snapshotLocal();
  let cloud: CloudDoc = { profiles: [], saves: {}, updatedAt: 0 };
  try {
    const snap = await getDoc(cloudRef(uid));
    if (snap.exists()) cloud = snap.data() as CloudDoc;
  } catch {
    return false; // offline / permission — stay local
  }
  syncMarker = { uid, updatedAt: cloud.updatedAt ?? 0 };

  // Profile IDs are generated locally, so the same trainer created on two
  // devices can have different IDs. Match exact IDs first, then reconcile an
  // otherwise-unmatched trainer by name + avatar before treating it as new.
  const localById = new Map(local.profiles.map((profile) => [profile.id, profile]));
  const usedLocalIds = new Set<string>();
  const localIdForCanonical = new Map<string, string>();
  const profiles: Profile[] = [];
  for (const cloudProfile of cloud.profiles ?? []) {
    const exact = localById.get(cloudProfile.id);
    const match = exact ?? local.profiles.find((profile) => !usedLocalIds.has(profile.id) && profileKey(profile) === profileKey(cloudProfile));
    if (match) {
      usedLocalIds.add(match.id);
      localIdForCanonical.set(cloudProfile.id, match.id);
    }
    profiles.push(cloudProfile);
  }
  for (const localProfile of local.profiles) {
    if (!usedLocalIds.has(localProfile.id) && !profiles.some((profile) => profile.id === localProfile.id)) profiles.push(localProfile);
  }
  profiles.splice(MAX_PROFILES);

  const saves: Record<string, SaveData> = {};
  for (const p of profiles) {
    const c = cloud.saves?.[p.id];
    const l = local.saves[localIdForCanonical.get(p.id) ?? p.id];
    saves[p.id] = c && l ? mergeSaves(c, l) : (c ?? l ?? { version: 1, caught: {}, wonBattles: [] });
  }

  const activeId = profiles.find((profile) => profile.id === local.activeId)?.id
    ?? profiles.find((profile) => localIdForCanonical.get(profile.id) === local.activeId)?.id
    ?? profiles[0]?.id
    ?? null;
  replaceLocal(profiles, saves, activeId);
  try {
    const updatedAt = Date.now();
    await setDoc(cloudRef(uid), { profiles, saves, updatedAt });
    syncMarker = { uid, updatedAt };
  } catch {
    /* write may fail if not permitted — local already updated */
  }
  return true;
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let syncMarker: { uid: string; updatedAt: number } | null = null;

/** Listen for changes made by another device and merge them into local state. */
export function subscribeToCloud(uid: string, onMerged: () => void): () => void {
  return onSnapshot(cloudRef(uid), async (snap) => {
    if (!snap.exists()) return;
    const cloud = snap.data() as CloudDoc;
    if (syncMarker?.uid === uid && (cloud.updatedAt ?? 0) <= syncMarker.updatedAt) return;
    if (await pullAndMerge(uid)) onMerged();
  });
}

/** Push the whole account (profiles + saves) to the cloud, debounced. */
export function pushAllDebounced(uid: string): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    const local = snapshotLocal();
    const updatedAt = Date.now();
    setDoc(cloudRef(uid), {
      profiles: local.profiles,
      saves: local.saves,
      updatedAt,
    }).catch(() => {
      /* offline — will re-push on next change */
    });
    syncMarker = { uid, updatedAt };
  }, 1500);
}

export async function signInGoogle(): Promise<void> {
  const { auth } = getFirebase();
  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  try {
    await signInWithPopup(auth, googleProvider);
  } catch {
    // iOS standalone apps cannot preserve Firebase's cross-origin redirect
    // state in sessionStorage. Keep the popup result in the app instead.
    if (isStandalone) throw new Error('Google sign-in was cancelled or blocked. Open this app in Safari to sign in.');
    // Ordinary Safari can use the redirect fallback when popups are blocked.
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
