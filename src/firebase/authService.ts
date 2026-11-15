// Firebase Authentication & Firestore User Profile Service
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  Unsubscribe
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebaseConfig';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'elder' | 'family' | 'caregiver';
  phoneNumber?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  preferredLanguage?: 'en' | 'hi';
  bloodGroup?: string | null;
  address?: string | null;
  createdAt?: any;
  lastLoginAt?: any;
  notes?: string;
}

/**
 * Register a new user with Email and Password
 * Stores user profile and initial details in Firestore 'users' collection
 */
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
  role: 'elder' | 'family' | 'caregiver' = 'elder',
  additionalData: Partial<UserProfile> = {}
): Promise<UserProfile> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Set auth display name
  if (displayName) {
    await updateProfile(user, { displayName });
  }

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: displayName || user.email?.split('@')[0] || 'User',
    photoURL: user.photoURL || null,
    role,
    phoneNumber: additionalData.phoneNumber || null,
    emergencyContactName: additionalData.emergencyContactName || null,
    emergencyContactPhone: additionalData.emergencyContactPhone || null,
    preferredLanguage: additionalData.preferredLanguage || 'en',
    bloodGroup: additionalData.bloodGroup || null,
    address: additionalData.address || null,
    notes: additionalData.notes || '',
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  };

  // Persist user record in Cloud Firestore
  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(userDocRef, profile, { merge: true });

  return profile;
}

/**
 * Log in an existing user with Email and Password
 * Updates last login timestamp and retrieves their profile from Firestore
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<UserProfile> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  const userDocRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userDocRef);

  if (docSnap.exists()) {
    await updateDoc(userDocRef, {
      lastLoginAt: serverTimestamp(),
    });
    return { ...docSnap.data() } as UserProfile;
  } else {
    // If no firestore doc exists yet, generate default profile
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || null,
      role: 'elder',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };
    await setDoc(userDocRef, profile, { merge: true });
    return profile;
  }
}

/**
 * Sign in with Google Popup
 * Stores or updates profile in Cloud Firestore
 */
export async function signInWithGoogle(
  defaultRole: 'elder' | 'family' | 'caregiver' = 'family'
): Promise<UserProfile> {
  const credential = await signInWithPopup(auth, googleProvider);
  const user = credential.user;

  const userDocRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userDocRef);

  if (docSnap.exists()) {
    await updateDoc(userDocRef, {
      lastLoginAt: serverTimestamp(),
      photoURL: user.photoURL || null,
    });
    return { ...docSnap.data() } as UserProfile;
  } else {
    // Brand new Google user: save their details to Firestore
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Google User',
      photoURL: user.photoURL || null,
      role: defaultRole,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };
    await setDoc(userDocRef, profile);
    return profile;
  }
}

/**
 * Sign out the currently logged-in user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Fetch a user profile document from Firestore by UID
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.error('Error fetching user profile from Firestore:', err);
    return null;
  }
}

/**
 * Update user details in Firestore
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Listen to Firebase Auth state changes and load Firestore profile
 */
export function listenToAuthChanges(
  callback: (profile: UserProfile | null, rawUser: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, async (rawUser) => {
    if (!rawUser) {
      callback(null, null);
      return;
    }

    try {
      let profile = await getUserProfile(rawUser.uid);
      if (!profile) {
        // Create if missing
        profile = {
          uid: rawUser.uid,
          email: rawUser.email,
          displayName: rawUser.displayName || rawUser.email?.split('@')[0] || 'User',
          photoURL: rawUser.photoURL || null,
          role: 'elder',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', rawUser.uid), profile, { merge: true });
      }
      callback(profile, rawUser);
    } catch (err) {
      console.warn('Failed to fetch user profile from Firestore during auth state change:', err);
      // Fallback profile from raw auth user
      callback({
        uid: rawUser.uid,
        email: rawUser.email,
        displayName: rawUser.displayName || rawUser.email?.split('@')[0] || 'User',
        photoURL: rawUser.photoURL || null,
        role: 'elder',
      }, rawUser);
    }
  });
}
