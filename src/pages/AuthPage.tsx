import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import {
  loginWithEmail,
  registerWithEmail,
  signInWithGoogle,
  UserProfile,
} from '../firebase/authService';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'REGISTER' : 'LOGIN';

  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'elder' | 'family' | 'caregiver'>('elder');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const setFirebaseProfile = useUserStore((s) => s.setFirebaseProfile);

  const getCleanErrorMessage = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists. Please sign in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please verify your credentials and try again.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/popup-closed-by-user':
        return 'Google Sign-In popup was closed before completing.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      default:
        return err?.message || 'Authentication error occurred. Please try again.';
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      let profile: UserProfile;

      if (authMode === 'REGISTER') {
        if (!displayName.trim()) {
          setErrorMessage('Please enter your full name.');
          setLoading(false);
          return;
        }

        profile = await registerWithEmail(email, password, displayName, role, {
          phoneNumber: phoneNumber.trim() || null,
          emergencyContactName: emergencyContactName.trim() || null,
          emergencyContactPhone: emergencyContactPhone.trim() || null,
        });

        setSuccessMessage('Account created and details saved to Firebase Database!');
      } else {
        profile = await loginWithEmail(email, password);
        setSuccessMessage('Welcome back! Loading your care continuity profile...');
      }

      setFirebaseProfile(profile);
      setTimeout(() => {
        navigate('/');
      }, 700);
    } catch (err: any) {
      setErrorMessage(getCleanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setGoogleLoading(true);

    try {
      const profile = await signInWithGoogle(role);
      setFirebaseProfile(profile);
      setSuccessMessage(`Signed in as ${profile.displayName || profile.email}!`);
      setTimeout(() => {
        navigate('/');
      }, 700);
    } catch (err: any) {
      setErrorMessage(getCleanErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="card-premium rounded-card-lg p-6 sm:p-8 space-y-6">
          {/* Brand header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-teal-800 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-sm">
              360
            </div>
            <h1 className="text-2xl font-bold text-ink">
              {authMode === 'LOGIN' ? 'Sign In to ELDERCARE 360' : 'Create Care Circle Account'}
            </h1>
            <p className="text-xs text-ink-muted leading-relaxed">
              {authMode === 'LOGIN'
                ? 'Access your medicine obligations, appointments, and care circle.'
                : 'Register your profile and store your care continuity details in Firebase.'}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-canvas rounded-card border border-hairline">
            <button
              type="button"
              onClick={() => {
                setAuthMode('LOGIN');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                authMode === 'LOGIN'
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('REGISTER');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                authMode === 'REGISTER'
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-card bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="p-3.5 rounded-card bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <span className="text-base">✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-card border border-hairline bg-surface hover:bg-slate-50 transition-all font-semibold text-sm text-ink shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-50"
            >
              {googleLoading ? (
                <div className="w-5 h-5 border-2 border-teal-800 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-hairline w-full" />
            <span className="bg-surface px-3 text-[11px] uppercase tracking-wider text-ink-muted font-bold relative">
              Or with email & password
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {authMode === 'REGISTER' && (
              <>
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Kamala Devi"
                    className="w-full p-3 rounded-card border border-hairline bg-canvas text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
                    required
                  />
                </div>

                {/* Role Picker */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary">
                    Care Circle Role (Stored in Firebase DB)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('elder')}
                      className={`py-2 px-1 text-xs font-bold rounded-card border transition-all ${
                        role === 'elder'
                          ? 'bg-teal-800 text-white border-teal-800 shadow-sm'
                          : 'bg-canvas text-ink-secondary border-hairline'
                      }`}
                    >
                      👵 Elder
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('family')}
                      className={`py-2 px-1 text-xs font-bold rounded-card border transition-all ${
                        role === 'family'
                          ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                          : 'bg-canvas text-ink-secondary border-hairline'
                      }`}
                    >
                      👨‍👩‍👧 Family
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('caregiver')}
                      className={`py-2 px-1 text-xs font-bold rounded-card border transition-all ${
                        role === 'caregiver'
                          ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                          : 'bg-canvas text-ink-secondary border-hairline'
                      }`}
                    >
                      🩺 Caregiver
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full p-3 rounded-card border border-hairline bg-canvas text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full p-3 rounded-card border border-hairline bg-canvas text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
                required
                minLength={6}
              />
            </div>

            {authMode === 'REGISTER' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Phone */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 rounded-card border border-hairline bg-canvas text-xs focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                {/* Emergency Contact Phone */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                    Emergency Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder="+91 98111 22334"
                    className="w-full p-2.5 rounded-card border border-hairline bg-canvas text-xs focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3.5 px-4 rounded-full font-bold text-white bg-teal-800 hover:bg-teal-900 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : authMode === 'LOGIN' ? (
                'Sign In'
              ) : (
                'Create Account & Store Details'
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="text-center pt-2 space-y-2">
            <p className="text-xs text-ink-muted">
              {authMode === 'LOGIN' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('REGISTER');
                      setErrorMessage(null);
                    }}
                    className="font-bold text-teal-800 hover:underline"
                  >
                    Register here
                  </button>
                </>
              ) : (
                <>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('LOGIN');
                      setErrorMessage(null);
                    }}
                    className="font-bold text-teal-800 hover:underline"
                  >
                    Sign in here
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
