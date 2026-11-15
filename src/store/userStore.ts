import { create } from 'zustand';
import { ExperienceMode } from '../types';
import type { UserProfile } from '../firebase/authService';

interface UserPreferencesState {
  experienceMode: ExperienceMode;
  language: 'en' | 'hi';
  textSize: 'normal' | 'medium' | 'large';
  reducedMotion: boolean;
  offlineSimulated: boolean;
  activeUserId: string;
  activeUserName: string;
  firebaseProfile: UserProfile | null;
  authLoading: boolean;
  setExperienceMode: (mode: ExperienceMode) => void;
  setLanguage: (lang: 'en' | 'hi') => void;
  setTextSize: (size: 'normal' | 'medium' | 'large') => void;
  setReducedMotion: (enabled: boolean) => void;
  setOfflineSimulated: (offline: boolean) => void;
  setActiveUser: (userId: string, name: string, roleMode: ExperienceMode) => void;
  setFirebaseProfile: (profile: UserProfile | null) => void;
  setAuthLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserPreferencesState>((set) => ({
  experienceMode: 'elder',
  language: 'en',
  textSize: 'normal',
  reducedMotion: false,
  offlineSimulated: false,
  activeUserId: 'user-elder-dhyan',
  activeUserName: 'Dhyanchand Sharma',
  firebaseProfile: null,
  authLoading: true,

  setExperienceMode: (mode) => {
    document.documentElement.setAttribute('data-mode', mode);
    set({ experienceMode: mode });
  },

  setLanguage: (lang) => {
    set({ language: lang });
  },

  setTextSize: (size) => {
    document.documentElement.setAttribute('data-text-size', size);
    set({ textSize: size });
  },

  setReducedMotion: (enabled) => {
    document.documentElement.setAttribute('data-reduced-motion', enabled ? 'true' : 'false');
    set({ reducedMotion: enabled });
  },

  setOfflineSimulated: (offline) => {
    set({ offlineSimulated: offline });
  },

  setActiveUser: (userId, name, roleMode) => {
    document.documentElement.setAttribute('data-mode', roleMode);
    set({
      activeUserId: userId,
      activeUserName: name,
      experienceMode: roleMode,
    });
  },

  setFirebaseProfile: (profile) => {
    if (profile) {
      document.documentElement.setAttribute('data-mode', profile.role || 'elder');
      set({
        firebaseProfile: profile,
        activeUserId: profile.uid,
        activeUserName: profile.displayName || profile.email?.split('@')[0] || 'User',
        experienceMode: profile.role || 'elder',
        authLoading: false,
      });
    } else {
      set({
        firebaseProfile: null,
        activeUserId: 'guest-user',
        activeUserName: 'Guest User',
        authLoading: false,
      });
    }
  },

  setAuthLoading: (loading) => {
    set({ authLoading: loading });
  },
}));
