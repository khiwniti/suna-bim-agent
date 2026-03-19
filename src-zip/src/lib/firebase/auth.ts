/**
 * Firebase Authentication Service
 *
 * Complete authentication system with Google Sign-in,
 * Email/Password, and session management.
 */

import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  User,
  UserCredential,
  AuthError,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, FieldValue } from 'firebase/firestore';
import { auth, db, googleProvider } from './config';

// ============================================
// Types
// ============================================

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  errorCode?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  provider: 'google' | 'email';
  plan: 'free' | 'pro' | 'enterprise';
  analysesRemaining: number;
  company?: string;
  role?: string;
}

// ============================================
// Error Messages
// ============================================

const errorMessages: Record<string, string> = {
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/invalid-credential': 'Invalid credentials. Please try again.',
};

function getErrorMessage(error: AuthError): string {
  return errorMessages[error.code] || error.message;
}

// ============================================
// User Profile Management
// ============================================

/**
 * Create or update user profile in Firestore
 */
async function upsertUserProfile(
  user: User,
  provider: 'google' | 'email',
  additionalData?: Partial<UserProfile>
): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Create new user profile
    const profile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      provider,
      plan: 'free' as const,
      analysesRemaining: 5, // Free tier starts with 5 analyses
      company: additionalData?.company,
      role: additionalData?.role,
    };

    await setDoc(userRef, profile);
    console.log('[Auth] New user profile created:', user.uid);
  } else {
    // Update last login
    await setDoc(
      userRef,
      {
        lastLoginAt: serverTimestamp(),
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        photoURL: user.photoURL,
      },
      { merge: true }
    );
    console.log('[Auth] User profile updated:', user.uid);
  }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
      } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('[Auth] Error getting user profile:', error);
    return null;
  }
}

// ============================================
// Authentication Methods
// ============================================

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    await upsertUserProfile(result.user, 'google');

    return {
      success: true,
      user: result.user,
    };
  } catch (error) {
    const authError = error as AuthError;
    console.error('[Auth] Google sign-in error:', authError.code);

    return {
      success: false,
      error: getErrorMessage(authError),
      errorCode: authError.code,
    };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const result: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    await upsertUserProfile(result.user, 'email');

    return {
      success: true,
      user: result.user,
    };
  } catch (error) {
    const authError = error as AuthError;
    console.error('[Auth] Email sign-in error:', authError.code);

    return {
      success: false,
      error: getErrorMessage(authError),
      errorCode: authError.code,
    };
  }
}

/**
 * Create new account with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResult> {
  try {
    const result: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Update display name if provided
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }

    // Send verification email
    await sendEmailVerification(result.user);

    // Create user profile
    await upsertUserProfile(result.user, 'email');

    return {
      success: true,
      user: result.user,
    };
  } catch (error) {
    const authError = error as AuthError;
    console.error('[Auth] Sign-up error:', authError.code);

    return {
      success: false,
      error: getErrorMessage(authError),
      errorCode: authError.code,
    };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<AuthResult> {
  try {
    await firebaseSignOut(auth);

    return {
      success: true,
    };
  } catch (error) {
    const authError = error as AuthError;
    console.error('[Auth] Sign-out error:', authError.code);

    return {
      success: false,
      error: getErrorMessage(authError),
      errorCode: authError.code,
    };
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    await sendPasswordResetEmail(auth, email);

    return {
      success: true,
    };
  } catch (error) {
    const authError = error as AuthError;
    console.error('[Auth] Password reset error:', authError.code);

    return {
      success: false,
      error: getErrorMessage(authError),
      errorCode: authError.code,
    };
  }
}

/**
 * Resend email verification
 */
export async function resendVerificationEmail(): Promise<AuthResult> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return {
        success: false,
        error: 'No user is currently signed in.',
      };
    }

    await sendEmailVerification(user);

    return {
      success: true,
    };
  } catch (error) {
    const authError = error as AuthError;
    console.error('[Auth] Verification email error:', authError.code);

    return {
      success: false,
      error: getErrorMessage(authError),
      errorCode: authError.code,
    };
  }
}

// ============================================
// Auth State Observer
// ============================================

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// ============================================
// Export
// ============================================

export { auth };

export default {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  resetPassword,
  resendVerificationEmail,
  getUserProfile,
  onAuthStateChange,
  getCurrentUser,
};
