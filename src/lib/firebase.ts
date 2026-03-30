import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

// Firebase config - only available in browser
const firebaseConfig = {
  apiKey: typeof window !== "undefined" ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY : undefined,
  authDomain: typeof window !== "undefined" ? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN : undefined,
  projectId: typeof window !== "undefined" ? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID : undefined,
  storageBucket: typeof window !== "undefined" ? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET : undefined,
  messagingSenderId: typeof window !== "undefined" ? process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID : undefined,
  appId: typeof window !== "undefined" ? process.env.NEXT_PUBLIC_FIREBASE_APP_ID : undefined,
};

// Lazy initialization - only runs in browser
let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;
let _googleProvider: GoogleAuthProvider | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return _app;
}

export function getDB(): Firestore | null {
  if (typeof window === "undefined") return null;
  const app = getFirebaseApp();
  if (!app) return null;
  if (!_db) {
    _db = getFirestore(app);
  }
  return _db;
}

export function getAuthInstance(): Auth | null {
  if (typeof window === "undefined") return null;
  const app = getFirebaseApp();
  if (!app) return null;
  if (!_auth) {
    _auth = getAuth(app);
  }
  return _auth;
}

export function getGoogleProvider(): GoogleAuthProvider | null {
  if (typeof window === "undefined") return null;
  if (!_googleProvider) {
    _googleProvider = new GoogleAuthProvider();
  }
  return _googleProvider;
}

// Export null-safe aliases for convenience
export const db = getDB();
export const auth = getAuthInstance();
export const googleProvider = getGoogleProvider();
export default getFirebaseApp;
