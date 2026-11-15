import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { translations } from '../../i18n/translations';
import { logoutUser } from '../../firebase/authService';
import { FirebaseDetailsModal } from '../auth/FirebaseDetailsModal';

export const Header: React.FC = () => {
  const location = useLocation();
  const experienceMode = useUserStore((s) => s.experienceMode);
  const setExperienceMode = useUserStore((s) => s.setExperienceMode);
  const language = useUserStore((s) => s.language);
  const setLanguage = useUserStore((s) => s.setLanguage);
  const textSize = useUserStore((s) => s.textSize);
  const setTextSize = useUserStore((s) => s.setTextSize);
  const reducedMotion = useUserStore((s) => s.reducedMotion);
  const setReducedMotion = useUserStore((s) => s.setReducedMotion);
  const offlineSimulated = useUserStore((s) => s.offlineSimulated);
  const setOfflineSimulated = useUserStore((s) => s.setOfflineSimulated);

  const firebaseProfile = useUserStore((s) => s.firebaseProfile);
  const activeUserName = useUserStore((s) => s.activeUserName);
  const setFirebaseProfile = useUserStore((s) => s.setFirebaseProfile);

  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const t = translations[language];

  const handleLogout = async () => {
    try {
      await logoutUser();
      setFirebaseProfile(null);
      setIsUserMenuOpen(false);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <>
      <header className="border-b border-hairline bg-surface signature-header-wash sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand & Experience Indicator */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 focus:outline-none">
              {/* Custom Brand Mark */}
              <div className="w-9 h-9 rounded-full bg-teal-800 flex items-center justify-center text-teal-50 shadow-sm border border-teal-700/30">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v10M7 12h10" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <span className="font-extrabold text-lg sm:text-xl text-ink tracking-tight">
                  {t.brand}
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-200">
                  {experienceMode === 'elder' ? 'Elder Mode' : experienceMode === 'family' ? 'Family Dashboard' : 'Caregiver View'}
                </span>
              </div>
            </Link>

            {/* Quick link to /kit */}
            <Link
              to="/kit"
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors md:hidden ${
                location.pathname === '/kit'
                  ? 'bg-teal-800 text-white border-teal-800'
                  : 'bg-canvas text-ink-secondary border-hairline'
              }`}
            >
              UI Kit
            </Link>
          </div>

          {/* Global Controls: Mode Switcher, Language Switcher, Accessibility, Auth */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            {/* Segmented Mode Switcher */}
            <div className="flex bg-canvas p-1 rounded-full border border-hairline" role="group" aria-label="Experience Mode Switcher">
              <button
                type="button"
                onClick={() => setExperienceMode('elder')}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                  experienceMode === 'elder'
                    ? 'bg-teal-800 text-white shadow-sm'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                👵 Elder
              </button>
              <button
                type="button"
                onClick={() => setExperienceMode('family')}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                  experienceMode === 'family'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                👨‍👩‍👧 Family
              </button>
              <button
                type="button"
                onClick={() => setExperienceMode('caregiver')}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                  experienceMode === 'caregiver'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                🩺 Caregiver
              </button>
            </div>

            {/* Language Switcher */}
            <div className="flex bg-canvas p-0.5 rounded-full border border-hairline" role="group" aria-label="Language Selector">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                  language === 'en'
                    ? 'bg-white shadow-sm text-ink font-semibold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                  language === 'hi'
                    ? 'bg-white shadow-sm text-ink font-semibold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* Accessibility: Text Size */}
            <div className="flex bg-canvas p-0.5 rounded-full border border-hairline items-center" title="Adjust text size">
              <button
                type="button"
                onClick={() => setTextSize('normal')}
                className={`px-2 py-0.5 rounded-full font-bold ${textSize === 'normal' ? 'bg-white shadow-sm text-teal-900' : 'text-ink-muted'}`}
                title="Normal Text Size"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setTextSize('medium')}
                className={`px-2 py-0.5 rounded-full font-bold ${textSize === 'medium' ? 'bg-white shadow-sm text-teal-900' : 'text-ink-muted'}`}
                title="Medium Text Size (+15%)"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setTextSize('large')}
                className={`px-2 py-0.5 rounded-full font-bold ${textSize === 'large' ? 'bg-white shadow-sm text-teal-900' : 'text-ink-muted'}`}
                title="Large Text Size (+30%)"
              >
                A++
              </button>
            </div>

            {/* Reduced Motion Toggle */}
            <button
              type="button"
              onClick={() => setReducedMotion(!reducedMotion)}
              className={`hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors ${
                reducedMotion
                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                  : 'bg-canvas text-ink-muted border-hairline hover:text-ink'
              }`}
              title="Toggle reduced motion"
            >
              {reducedMotion ? '⚡ Motion Off' : '✨ Motion On'}
            </button>

            {/* Offline Simulation Toggle */}
            <button
              type="button"
              onClick={() => setOfflineSimulated(!offlineSimulated)}
              className={`px-2.5 py-1 rounded-full border font-semibold transition-colors ${
                offlineSimulated
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-canvas text-ink-secondary border-hairline hover:bg-slate-200'
              }`}
              title="Simulate offline mode"
            >
              {offlineSimulated ? '📡 Offline (Simulated)' : '📶 Online'}
            </button>

            {/* Firebase Database Inspector Pill */}
            <button
              type="button"
              onClick={() => setIsDbModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-900 font-bold hover:bg-amber-100 shadow-sm transition-all"
              title="View & Edit User Details in Firebase Cloud Firestore"
            >
              <span>🔥</span>
              <span className="hidden sm:inline">Firebase DB</span>
            </button>

            {/* User Account / Auth Section */}
            {firebaseProfile ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-2.5 pr-3 rounded-full border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-900 font-semibold transition-all shadow-sm"
                >
                  {firebaseProfile.photoURL ? (
                    <img
                      src={firebaseProfile.photoURL}
                      alt={activeUserName}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center text-[10px] font-bold">
                      {(firebaseProfile.displayName || firebaseProfile.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[100px] truncate">{activeUserName}</span>
                  <span className="text-[10px]">▼</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-surface rounded-card-lg border border-hairline shadow-xl p-2 z-50 animate-fade-in space-y-1">
                    <div className="px-3 py-2 border-b border-hairline">
                      <p className="font-bold text-ink text-xs truncate">
                        {firebaseProfile.displayName || 'Firebase User'}
                      </p>
                      <p className="text-[11px] text-ink-muted truncate">
                        {firebaseProfile.email}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase">
                        {firebaseProfile.role}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDbModalOpen(true);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-ink-secondary hover:bg-canvas rounded-card transition-colors flex items-center gap-2"
                    >
                      <span>🔥</span>
                      <span>Edit Details in Firebase DB</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 rounded-card font-semibold transition-colors flex items-center gap-2"
                    >
                      <span>🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="px-3 py-1 rounded-full font-bold text-teal-900 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-all shadow-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-block px-3 py-1 rounded-full font-bold text-white bg-teal-800 hover:bg-teal-900 transition-all shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Desktop link to Component Kit */}
            <Link
              to="/kit"
              className={`hidden md:inline-flex items-center px-3 py-1 rounded-full border font-semibold transition-colors ${
                location.pathname === '/kit'
                  ? 'bg-teal-800 text-white border-teal-800'
                  : 'bg-canvas text-ink-secondary border-hairline hover:bg-teal-50'
              }`}
            >
              UI Kit
            </Link>
          </div>
        </div>
      </header>

      {/* Cloud Firestore User Details Modal */}
      <FirebaseDetailsModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </>
  );
};
