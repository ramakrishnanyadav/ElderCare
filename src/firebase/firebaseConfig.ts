// Firebase App Configuration and Services
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: 'AIzaSyASXsM3WYzGfeNa62FfuZDmqR66QBaQHuo',
  authDomain: 'mnm-project-8bb64.firebaseapp.com',
  projectId: 'mnm-project-8bb64',
  storageBucket: 'mnm-project-8bb64.firebasestorage.app',
  messagingSenderId: '677366399511',
  appId: '1:677366399511:web:aa911a15ee026d6f399252',
  measurementId: 'G-17YBVXT3WJ'
};

// Initialize Firebase singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Auth Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Safe Analytics initialization
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (err) {
        console.warn('Analytics initialization skipped:', err);
      }
    }
  }).catch(() => {});
}
