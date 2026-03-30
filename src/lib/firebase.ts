import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

// Hardcoded Firebase config for testing - replace with environment variables in production
const firebaseConfig = {
  apiKey: "AIzaSyAbXudXqsjwWxv_iEvdVpvN4dW7X2oxFfc",
  authDomain: "project-9fde4fd7-75d9-4cad-a3e.firebaseapp.com",
  projectId: "project-9fde4fd7-75d9-4cad-a3e",
  storageBucket: "project-9fde4fd7-75d9-4cad-a3e.firebasestorage.app",
  messagingSenderId: "300565307201",
  appId: "1:300565307201:web:41cea0ed279320f0458bc0",
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

export default getFirebaseApp;
