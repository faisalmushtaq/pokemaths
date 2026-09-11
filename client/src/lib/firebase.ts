// =============================================================================
// POKÉMATHS — FIREBASE
// =============================================================================
// Web config is public by design (security is enforced by Firestore rules +
// authorized domains), so it's safe to ship in client code. Firebase is lazily
// initialised the first time it's needed.
// =============================================================================

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAwS40W4AmzELBNdImRW78WaKJAEuDxA7w',
  authDomain: 'pokemaths-e031e.firebaseapp.com',
  projectId: 'pokemaths-e031e',
  storageBucket: 'pokemaths-e031e.firebasestorage.app',
  messagingSenderId: '630803342938',
  appId: '1:630803342938:web:957a86bb0ad90e95591a63',
  measurementId: 'G-8JSGFN6EYF',
};

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

/** True when a real Firebase config is present (lets the app run without one). */
export function firebaseReady(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

export function getFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (!app) {
    app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
  }
  return { app, auth: authInstance!, db: dbInstance! };
}

export const googleProvider = new GoogleAuthProvider();
