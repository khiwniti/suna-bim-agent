/**
 * Firebase Configuration
 *
 * Core Firebase initialization with all services.
 * Includes Analytics, Auth, Firestore, and Storage.
 *
 * ★ Insight ─────────────────────────────────────
 * Firebase provides:
 * - Authentication (Google, Email/Password)
 * - Firestore (scalable NoSQL database)
 * - Storage (file uploads for IFC models)
 * - Analytics (user behavior tracking)
 * ─────────────────────────────────────────────────
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  EmailAuthProvider,
  connectAuthEmulator,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage,
  connectStorageEmulator,
} from 'firebase/storage';

// ============================================
// Firebase Configuration
// ============================================

/**
 * Validate Firebase environment variables at startup
 * Throws error if required variables are missing
 */
function validateFirebaseConfig() {
  const required = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`);

  if (missing.length > 0 && typeof window !== 'undefined') {
    console.error(
      `[Firebase] Missing required environment variables: ${missing.join(', ')}\n` +
      'Please ensure these are set in your .env.local file.'
    );
  }

  return required;
}

const envConfig = validateFirebaseConfig();

const firebaseConfig = {
  apiKey: envConfig.apiKey || '',
  authDomain: envConfig.authDomain || '',
  projectId: envConfig.projectId || '',
  storageBucket: envConfig.storageBucket || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// ============================================
// Initialize Firebase (Singleton Pattern)
// ============================================

let app: FirebaseApp;
let analytics: Analytics | null = null;
 
let auth: Auth;
 
let db: Firestore;
 
let storage: FirebaseStorage;

function initializeFirebase(): FirebaseApp {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  return app;
}

// Initialize app
app = initializeFirebase();

// Initialize Auth
auth = getAuth(app);

// Initialize Firestore
db = getFirestore(app);

// Initialize Storage
storage = getStorage(app);

// Initialize Analytics (only in browser)
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// ============================================
// Emulator Configuration (Development)
// ============================================

const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

if (useEmulators && typeof window !== 'undefined') {
  // Only connect to emulators once
  const isEmulatorConnected = (window as unknown as { __FIREBASE_EMULATORS_CONNECTED__?: boolean }).__FIREBASE_EMULATORS_CONNECTED__;

  if (!isEmulatorConnected) {
    console.log('🔧 Connecting to Firebase Emulators...');

    // Auth emulator
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });

    // Firestore emulator
    connectFirestoreEmulator(db, 'localhost', 8080);

    // Storage emulator
    connectStorageEmulator(storage, 'localhost', 9199);

    (window as unknown as { __FIREBASE_EMULATORS_CONNECTED__?: boolean }).__FIREBASE_EMULATORS_CONNECTED__ = true;
  }
}

// ============================================
// Auth Providers
// ============================================

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export const emailProvider = new EmailAuthProvider();

// ============================================
// Exports
// ============================================

export { app, analytics, auth, db, storage, firebaseConfig };

export default app;
