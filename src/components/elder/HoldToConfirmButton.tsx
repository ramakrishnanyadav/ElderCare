import React, { useState, useRef, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { translations } from '../../i18n/translations';

interface HoldToConfirmButtonProps {
  onConfirmed: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export const HoldToConfirmButton: React.FC<HoldToConfirmButtonProps> = ({
  onConfirmed,
  disabled = false,
  label,
  className = '',
}) => {
  const language = useUserStore((s) => s.language);
  const t = translations[language].elder;
  const buttonLabel = label || t.holdToConfirm;

  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const HOLD_DURATION = 600; // ~600ms required hold duration

  const triggerVibration = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 30, 80]); // subtle haptic completion pulse
      } catch {
        // Ignored if unsupported
      }
    }
  };

  const startHold = () => {
    if (disabled || completed) return;
    setIsHolding(true);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentPct = Math.min(100, (elapsed / HOLD_DURATION) * 100);
      setProgress(currentPct);

      if (elapsed >= HOLD_DURATION) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsHolding(false);
        setCompleted(true);
        triggerVibration();
        onConfirmed();
      }
    }, 16);
  };

  const cancelHold = () => {
    if (completed) return;
    setIsHolding(false);
    setProgress(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handlePlainClick = () => {
    if (disabled || completed) return;
    setCompleted(true);
    triggerVibration();
    onConfirmed();
  };

  return (
    <div className="w-full space-y-3">
      {/* Primary Press-and-Hold Target (Min 56px height for Elder Mode) */}
      <div className="relative w-full">
        <button
          type="button"
          onMouseDown={startHold}
          onMouseUp={cancelHold}
          onMouseLeave={cancelHold}
          onTouchStart={startHold}
          onTouchEnd={cancelHold}
          onTouchCancel={cancelHold}
          disabled={disabled || completed}
          aria-label={`${buttonLabel}. Press and hold for half a second.`}
          className={`relative w-full min-h-[64px] rounded-full overflow-hidden font-bold text-lg sm:text-xl transition-all duration-200 select-none shadow-btn-teal border-2 border-teal-700/20 active:scale-[0.98] ${
            completed
              ? 'bg-[#1E7A45] text-white cursor-default'
              : 'bg-[#0B554F] text-white hover:bg-teal-900 active:bg-teal-950'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        >
          {/* Progress fill layer */}
          {isHolding && !completed && (
            <div
              style={{ width: `${progress}%` }}
              className="absolute inset-y-0 left-0 bg-teal-600/50 transition-all ease-linear"
            />
          )}

          <div className="relative z-10 flex items-center justify-center gap-3 px-6 py-4">
            {completed ? (
              <>
                <svg className="w-6 h-6 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{t.confirmed}</span>
              </>
            ) : isHolding ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>{t.holding}</span>
              </>
            ) : (
              <>
                <span className="text-2xl" aria-hidden="true">👆</span>
                <span>{buttonLabel}</span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Accessible Plain-Button Fallback for Switch Access & Keyboard Navigation */}
      {!completed && (
        <button
          type="button"
          onClick={handlePlainClick}
          disabled={disabled}
          className="w-full py-2.5 px-4 text-sm font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-full border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-700 transition-colors"
        >
          {t.plainButtonFallback}
        </button>
      )}
    </div>
  );
};
