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
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  linkWithCredential,
  updatePassword,
  EmailAuthProvider,
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

/**
 * Firebase auth errors carry a `code` (e.g. `auth/popup-blocked`) and often a
 * message holding the detail that matters (e.g. "missing initial state"), so
 * keep both. A sign-in that fails should say why on screen.
 */
function describeAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  const message = error instanceof Error ? error.message : '';
  if (code && message && !message.includes(code)) return `${code}: ${message}`;
  return message || code || 'UNKNOWN ERROR';
}

/**
 * True when running as an installed Home Screen app rather than a browser tab.
 * Such an app gets its own storage, separate from the browser's, and the Google
 * handoff runs through pokemaths-e031e.firebaseapp.com, a different site from
 * GitHub Pages. The popup and the redirect both lose their state across that
 * gap, so Google sign-in cannot be relied on there. Email + password sign-in is
 * plain HTTPS requests with no popup or redirect, so it works in every context.
 */
export function isStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

/** Plain-English, on-screen message for a Firebase auth error. */
export function friendlyAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'EMAIL OR PASSWORD NOT RECOGNISED. GOOGLE USERS: SIGN IN ON THE WEBSITE AND SET AN APP PASSWORD FIRST.';
    case 'auth/invalid-email':
      return 'THAT EMAIL ADDRESS LOOKS WRONG.';
    case 'auth/missing-password':
      return 'ENTER YOUR PASSWORD.';
    case 'auth/weak-password':
      return 'PASSWORD NEEDS AT LEAST 6 CHARACTERS.';
    case 'auth/email-already-in-use':
      return 'THAT EMAIL ALREADY HAS AN ACCOUNT. SIGN IN INSTEAD. IF IT USES GOOGLE, SET AN APP PASSWORD ON THE WEBSITE.';
    case 'auth/credential-already-in-use':
      return 'THAT EMAIL IS ALREADY LINKED TO A DIFFERENT ACCOUNT.';
    case 'auth/requires-recent-login':
      return 'FOR SECURITY, SIGN OUT, SIGN IN WITH GOOGLE AGAIN, THEN SET THE PASSWORD.';
    case 'auth/too-many-requests':
      return 'TOO MANY ATTEMPTS. WAIT A FEW MINUTES AND TRY AGAIN.';
    case 'auth/network-request-failed':
      return 'NO CONNECTION. CHECK YOUR INTERNET AND TRY AGAIN.';
    case 'auth/operation-not-allowed':
      return 'EMAIL SIGN-IN IS NOT SWITCHED ON. ENABLE EMAIL/PASSWORD IN FIREBASE CONSOLE > AUTHENTICATION > SIGN-IN METHOD.';
    default:
      return describeAuthError(error);
  }
}

export async function signInEmail(email: string, password: string): Promise<void> {
  const { auth } = getFirebase();
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

/** New email account for someone without Google; verified so it can't be taken over. */
export async function createEmailAccount(email: string, password: string): Promise<void> {
  const { auth } = getFirebase();
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await sendEmailVerification(user).catch(() => {
    /* the account works without it; verification only hardens it */
  });
}

export async function sendPasswordReset(email: string): Promise<void> {
  const { auth } = getFirebase();
  await sendPasswordResetEmail(auth, email.trim());
}

export function hasAppPassword(user: User): boolean {
  return user.providerData.some((provider) => provider.providerId === 'password');
}

/**
 * Add an email + password to the signed-in account (usually a Google one) so
 * the Home Screen app can sign in to the same account, and the same saves,
 * without Google. Changes the password if one is already set.
 */
export async function setAppPassword(password: string): Promise<void> {
  const { auth } = getFirebase();
  const user = auth.currentUser;
  if (!user?.email) throw new Error('SIGN IN FIRST');
  if (hasAppPassword(user)) {
    await updatePassword(user, password);
  } else {
    await linkWithCredential(user, EmailAuthProvider.credential(user.email, password));
  }
  await user.reload();
}

export async function signInGoogle(): Promise<void> {
  const { auth } = getFirebase();
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (popupError) {
    // In a Home Screen app the redirect leaves the app and comes back without
    // its state, so don't strand the player there: point them at email.
    if (isStandaloneApp()) {
      throw new Error(
        `GOOGLE SIGN-IN DOESN'T WORK IN THE HOME SCREEN APP. USE EMAIL + APP PASSWORD BELOW. (${describeAuthError(popupError)})`,
      );
    }
    // Some in-app browsers block the popup, so fall back to a full-page
    // redirect; useAuthUser() completes it on the next load.
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (redirectError) {
      throw new Error(
        `POPUP ${describeAuthError(popupError)} / REDIRECT ${describeAuthError(redirectError)}`,
      );
    }
  }
}

export async function signOutCloud(): Promise<void> {
  const { auth } = getFirebase();
  await signOut(auth);
}

/**
 * Current signed-in user (or null). `ready` flips true once auth is resolved,
 * and `error` reports a redirect sign-in that came back without completing.
 */
export function useAuthUser(): {
  user: User | null;
  ready: boolean;
  error: string | null;
} {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!firebaseReady());
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!firebaseReady()) return;
    const { auth } = getFirebase();
    // Complete any pending redirect sign-in, then listen for state. A failure
    // here is the signal that the OAuth handoff lost its initial state, which
    // is what happens when the flow starts in an iOS Home Screen app and
    // returns through Safari, so report it rather than discarding it.
    getRedirectResult(auth).catch((redirectError) => {
      setError(describeAuthError(redirectError));
    });
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
  }, []);
  return { user, ready, error };
}

export { firebaseReady };
