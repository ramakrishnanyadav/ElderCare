import {
  registerWithEmail,
  loginWithEmail,
  signInWithGoogle,
  getUserProfile,
  updateUserProfile,
  logoutUser,
} from '../../src/firebase/authService';

// Mock Firebase SDKs
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => [{}]),
  getApp: jest.fn(() => ({})),
}));

const mockDocRef = { id: 'test-user-123' };
const mockDocSnap = {
  exists: jest.fn(() => true),
  data: jest.fn(() => ({
    uid: 'test-user-123',
    email: 'kamala.devi@example.com',
    displayName: 'Kamala Devi',
    role: 'elder',
  })),
};

const mockSetDoc = jest.fn().mockResolvedValue(undefined);
const mockGetDoc = jest.fn().mockResolvedValue(mockDocSnap);
const mockUpdateDoc = jest.fn().mockResolvedValue(undefined);
const mockDoc = jest.fn(() => mockDocRef);

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  serverTimestamp: jest.fn(() => 'MOCK_SERVER_TIMESTAMP'),
}));

const mockUser = {
  uid: 'test-user-123',
  email: 'kamala.devi@example.com',
  displayName: 'Kamala Devi',
  photoURL: 'https://example.com/avatar.jpg',
};

const mockCreateUserWithEmailAndPassword = jest.fn().mockResolvedValue({
  user: mockUser,
});
const mockSignInWithEmailAndPassword = jest.fn().mockResolvedValue({
  user: mockUser,
});
const mockSignInWithPopup = jest.fn().mockResolvedValue({
  user: mockUser,
});
const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockUpdateProfile = jest.fn().mockResolvedValue(undefined);

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({
    setCustomParameters: jest.fn(),
  })),
  createUserWithEmailAndPassword: (...args: any[]) =>
    mockCreateUserWithEmailAndPassword(...args),
  signInWithEmailAndPassword: (...args: any[]) =>
    mockSignInWithEmailAndPassword(...args),
  signInWithPopup: (...args: any[]) => mockSignInWithPopup(...args),
  signOut: (...args: any[]) => mockSignOut(...args),
  updateProfile: (...args: any[]) => mockUpdateProfile(...args),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/analytics', () => ({
  getAnalytics: jest.fn(),
  isSupported: jest.fn().mockResolvedValue(false),
}));

describe('Firebase Authentication & Cloud Firestore Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerWithEmail', () => {
    it('creates a user and saves the profile to Firestore users collection', async () => {
      const profile = await registerWithEmail(
        'kamala.devi@example.com',
        'securePass123',
        'Kamala Devi',
        'elder',
        { phoneNumber: '+91 98765 43210' }
      );

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'kamala.devi@example.com',
        'securePass123'
      );
      expect(mockUpdateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: 'Kamala Devi',
      });
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'test-user-123');
      expect(mockSetDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          uid: 'test-user-123',
          email: 'kamala.devi@example.com',
          displayName: 'Kamala Devi',
          role: 'elder',
          phoneNumber: '+91 98765 43210',
          createdAt: 'MOCK_SERVER_TIMESTAMP',
        }),
        { merge: true }
      );
      expect(profile.displayName).toBe('Kamala Devi');
      expect(profile.role).toBe('elder');
    });
  });

  describe('loginWithEmail', () => {
    it('authenticates user and updates lastLoginAt in Firestore', async () => {
      const profile = await loginWithEmail('kamala.devi@example.com', 'securePass123');

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'kamala.devi@example.com',
        'securePass123'
      );
      expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocRef, {
        lastLoginAt: 'MOCK_SERVER_TIMESTAMP',
      });
      expect(profile.uid).toBe('test-user-123');
      expect(profile.email).toBe('kamala.devi@example.com');
    });
  });

  describe('signInWithGoogle', () => {
    it('authenticates with Google popup and syncs profile with Firestore', async () => {
      const profile = await signInWithGoogle('family');

      expect(mockSignInWithPopup).toHaveBeenCalled();
      expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocRef, {
        lastLoginAt: 'MOCK_SERVER_TIMESTAMP',
        photoURL: 'https://example.com/avatar.jpg',
      });
      expect(profile.uid).toBe('test-user-123');
    });
  });

  describe('updateUserProfile', () => {
    it('updates specific profile fields in Firestore', async () => {
      await updateUserProfile('test-user-123', {
        emergencyContactName: 'Anita Sharma',
        emergencyContactPhone: '+91 98111 22334',
      });

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'test-user-123');
      expect(mockSetDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          emergencyContactName: 'Anita Sharma',
          emergencyContactPhone: '+91 98111 22334',
          updatedAt: 'MOCK_SERVER_TIMESTAMP',
        }),
        { merge: true }
      );
    });
  });

  describe('logoutUser', () => {
    it('calls Firebase signOut', async () => {
      await logoutUser();
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
