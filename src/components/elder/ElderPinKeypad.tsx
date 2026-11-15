import React, { useState } from 'react';

interface ElderPinKeypadProps {
  onSuccess: () => void;
  title?: string;
  expectedPin?: string; // Default: '1234'
}

export const ElderPinKeypad: React.FC<ElderPinKeypadProps> = ({
  onSuccess,
  title = 'Enter Elder Security PIN',
  expectedPin = '1234',
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const handleKeyPress = (num: string) => {
    if (isLocked || pin.length >= 4) return;
    const nextPin = pin + num;
    setPin(nextPin);
    setErrorMsg('');

    if (nextPin.length === 4) {
      if (nextPin === expectedPin) {
        onSuccess();
      } else {
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);
        setPin('');
        if (nextFailed >= 3) {
          setIsLocked(true);
          setErrorMsg('Security lockout: 3 failed attempts. Account locked for 5 minutes.');
          setTimeout(() => {
            setIsLocked(false);
            setFailedAttempts(0);
            setErrorMsg('');
          }, 300000);
        } else {
          setErrorMsg(`Incorrect PIN (${3 - nextFailed} attempts remaining).`);
        }
      }
    }
  };

  const handleDelete = () => {
    if (isLocked) return;
    setPin(pin.slice(0, -1));
    setErrorMsg('');
  };

  return (
    <div className="card-premium rounded-card-lg p-6 sm:p-8 max-w-sm mx-auto space-y-6 text-center">
      <div className="space-y-1">
        <div className="w-12 h-12 mx-auto bg-teal-50 rounded-full flex items-center justify-center text-teal-800 text-xl border border-teal-200">
          🔒
        </div>
        <h3 className="text-xl font-bold text-ink">{title}</h3>
        <p className="text-xs text-ink-muted">Device-bound security authentication</p>
      </div>

      {/* 4-Digit Display Indicator */}
      <div className="flex justify-center items-center gap-4 py-2">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              idx < pin.length
                ? 'bg-teal-800 border-teal-800 scale-110'
                : 'border-slate-300 bg-canvas'
            }`}
          />
        ))}
      </div>

      {errorMsg && (
        <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-card border border-rose-200 animate-shake">
          {errorMsg}
        </p>
      )}

      {/* High-Accessibility Touch Keypad (Min 56px height per button) */}
      <div className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleKeyPress(digit)}
            disabled={isLocked}
            className="min-h-[58px] rounded-card bg-canvas hover:bg-teal-50 active:bg-teal-100 text-2xl font-bold text-ink border border-hairline shadow-sm transition-transform active:scale-95 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-teal-700"
          >
            {digit}
          </button>
        ))}
        <div />
        <button
          type="button"
          onClick={() => handleKeyPress('0')}
          disabled={isLocked}
          className="min-h-[58px] rounded-card bg-canvas hover:bg-teal-50 active:bg-teal-100 text-2xl font-bold text-ink border border-hairline shadow-sm transition-transform active:scale-95 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-teal-700"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isLocked || pin.length === 0}
          className="min-h-[58px] rounded-card bg-canvas hover:bg-rose-50 text-base font-bold text-ink-secondary border border-hairline transition-transform active:scale-95 disabled:opacity-30 focus:outline-none"
        >
          ⌫
        </button>
      </div>
    </div>
  );
};
