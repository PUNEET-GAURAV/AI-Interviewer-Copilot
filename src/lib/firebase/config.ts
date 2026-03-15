import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize if we actually have an API key (prevents crashing if not set up yet)
const app = getApps().length === 0 && firebaseConfig.apiKey 
  ? initializeApp(firebaseConfig) 
  : getApps().length > 0 ? getApp() : null;

const auth = app ? getAuth(app) : null;
const googleProvider = new GoogleAuthProvider();

// Guard to prevent double-popup crashes
let signInInProgress = false;

export const signInWithGoogle = async () => {
  if (!auth) {
    console.warn("Firebase is not initialized. Skipping Google Sign-in.");
    return null;
  }
  if (signInInProgress) {
    console.warn("Sign-in already in progress, ignoring duplicate request.");
    return null;
  }
  signInInProgress = true;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    const code = error?.code || '';
    // Silently handle known non-critical errors
    if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') {
      console.warn("Sign-in popup was cancelled or closed by user.");
      return null;
    }
    if (code === 'auth/configuration-not-found') {
      console.error("Firebase Auth: Google Sign-In provider is not enabled. Please enable it in Firebase Console → Authentication → Sign-in method → Google.");
      alert("Google Sign-In is not configured yet. You can still use the app without signing in.");
      return null;
    }
    console.error("Error signing in with Google:", error);
    return null;
  } finally {
    signInInProgress = false;
  }
};

export const logOut = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

export { app, auth };
