// =============================================================================
// POKÉMATHS | FIREBASE
// =============================================================================
// The public web configuration is safe to ship because Firestore rules and
// authorised domains enforce access. The Firebase SDK itself loads only when
// account or synchronisation features require it.
// =============================================================================

import type { FirebaseApp } from 'firebase/app';
import type { Auth, GoogleAuthProvider } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore/lite';

const firebaseConfig = {
  apiKey: 'AIzaSyAwS40W4AmzELBNdImRW78WaKJAEuDxA7w',
  authDomain: 'pokemaths-e031e.firebaseapp.com',
  projectId: 'pokemaths-e031e',
  storageBucket: 'pokemaths-e031e.firebasestorage.app',
  messagingSenderId: '630803342938',
  appId: '1:630803342938:web:957a86bb0ad90e95591a63',
  measurementId: 'G-8JSGFN6EYF',
};

let appPromise: Promise<FirebaseApp> | null = null;
let authPromise: Promise<{ auth: Auth; googleProvider: GoogleAuthProvider }> | null = null;
let firestorePromise: Promise<Firestore> | null = null;

/** True when a real Firebase configuration is present, allowing offline play without one. */
export function firebaseReady(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

async function getApp(): Promise<FirebaseApp> {
  if (!appPromise) {
    appPromise = import('firebase/app').then(({ initializeApp }) => initializeApp(firebaseConfig));
  }
  return appPromise;
}

/** Loads Google account services only when authentication is needed. */
export async function getFirebaseAuth(): Promise<{ auth: Auth; googleProvider: GoogleAuthProvider }> {
  if (!authPromise) {
    authPromise = Promise.all([getApp(), import('firebase/auth')]).then(([app, authModule]) => ({
      auth: authModule.getAuth(app),
      googleProvider: new authModule.GoogleAuthProvider(),
    }));
  }
  return authPromise;
}

/** Loads Firestore only when a signed-in player's data must synchronise. */
export async function getFirebaseDb(): Promise<Firestore> {
  if (!firestorePromise) {
    firestorePromise = Promise.all([getApp(), import('firebase/firestore/lite')]).then(([app, firestoreModule]) => firestoreModule.getFirestore(app));
  }
  return firestorePromise;
}
