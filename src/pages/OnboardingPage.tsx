import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { ElderPinKeypad } from '../../components/elder/ElderPinKeypad';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'INVITE' | 'PIN'>('INVITE');
  const [inviteCode, setInviteCode] = useState('');
  const [roleSelection, setRoleSelection] = useState<'elder' | 'family' | 'caregiver'>('elder');
  const setActiveUser = useUserStore((s) => s.setActiveUser);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    if (roleSelection === 'elder') {
      setStep('PIN');
    } else if (roleSelection === 'family') {
      setActiveUser('user-family-anita', 'Anita Sharma', 'family');
      navigate('/');
    } else {
      setActiveUser('user-caregiver-sunita', 'Sunita Devi', 'caregiver');
      navigate('/');
    }
  };

  const handlePinSuccess = () => {
    setActiveUser('user-elder-dhyan', 'Dhyanchand Sharma', 'elder');
    navigate('/');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {step === 'INVITE' ? (
          <div className="card-premium rounded-card-lg p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto bg-teal-800 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-sm">
                360
              </div>
              <h1 className="text-2xl font-bold text-ink">Welcome to ELDERCARE 360</h1>
              <p className="text-xs text-ink-muted leading-relaxed">
                Enter your single-use 24-hour invitation passcode or sign in with your Firebase account.
              </p>
            </div>

            {/* Quick Firebase Auth Banner */}
            <div className="p-3.5 rounded-card bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center justify-between">
              <div>
                <p className="font-bold">Have an email or Google account?</p>
                <p className="text-[11px] text-teal-700">Store and sync profile directly with Firebase DB</p>
              </div>
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-full font-bold bg-teal-800 text-white hover:bg-teal-900 transition-all text-xs shadow-sm whitespace-nowrap"
              >
                Sign In →
              </Link>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="invite-code-input" className="block text-xs font-bold uppercase tracking-wider text-ink-secondary">
                  One-Time Invite Passcode
                </label>
                <input
                  id="invite-code-input"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. CARE-8B4F"
                  className="w-full p-3.5 text-center text-lg font-mono font-bold tracking-widest rounded-card border border-hairline bg-canvas focus:outline-none focus:ring-2 focus:ring-teal-700 uppercase"
                  required
                />
                <p className="text-[11px] text-ink-muted">
                  Hashed with Argon2id, 24h expiry, no master bypass codes.
                </p>
              </div>

              {/* Persona / Role Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary">
                  Join as Persona
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRoleSelection('elder')}
                    className={`py-2 px-1 text-xs font-bold rounded-card border transition-all ${
                      roleSelection === 'elder'
                        ? 'bg-teal-800 text-white border-teal-800 shadow-sm'
                        : 'bg-canvas text-ink-secondary border-hairline'
                    }`}
                  >
                    👵 Elder
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleSelection('family')}
                    className={`py-2 px-1 text-xs font-bold rounded-card border transition-all ${
                      roleSelection === 'family'
                        ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                        : 'bg-canvas text-ink-secondary border-hairline'
                    }`}
                  >
                    👨‍👩‍👧 Family
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleSelection('caregiver')}
                    className={`py-2 px-1 text-xs font-bold rounded-card border transition-all ${
                      roleSelection === 'caregiver'
                        ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                        : 'bg-canvas text-ink-secondary border-hairline'
                    }`}
                  >
                    🩺 Caregiver
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[52px] bg-teal-800 hover:bg-teal-900 text-white font-bold text-base rounded-full shadow-btn-teal transition-all active:scale-[0.98]"
              >
                Continue with Passcode →
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <ElderPinKeypad
              onSuccess={handlePinSuccess}
              title="Enter Registered Device PIN"
            />
            <button
              onClick={() => setStep('INVITE')}
              className="w-full text-center text-xs text-ink-muted hover:text-ink font-semibold"
            >
              ← Back to invite code
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
