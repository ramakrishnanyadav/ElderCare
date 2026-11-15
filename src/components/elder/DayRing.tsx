import React, { useState, useEffect } from 'react';
import { DoseSlot } from '../../types';
import { useUserStore } from '../../store/userStore';
import { translations } from '../../i18n/translations';

interface DayRingProps {
  slots: DoseSlot[];
  onSelectSlot: (slot: DoseSlot) => void;
}

export const DayRing: React.FC<DayRingProps> = ({ slots, onSelectSlot }) => {
  const language = useUserStore((s) => s.language);
  const t = translations[language].elder;

  // Track current time of day for sweeping hand (0 to 24 hours)
  const [currentHoursFloat, setCurrentHoursFloat] = useState(8.5); // Default to 8:30 AM for demo

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentHoursFloat(now.getHours() + now.getMinutes() / 60);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const size = 320;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Convert hours (0-24) to degrees where 00:00 is top (-90 deg from 3 o'clock)
  const timeToAngle = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const fraction = (h + m / 60) / 24;
    return fraction * 360 - 90;
  };

  const currentAngle = (currentHoursFloat / 24) * 360 - 90;
  const currentHandX = center + (radius - 12) * Math.cos((currentAngle * Math.PI) / 180);
  const currentHandY = center + (radius - 12) * Math.sin((currentAngle * Math.PI) / 180);

  const getStatusColor = (status: DoseSlot['status']) => {
    switch (status) {
      case 'TAKEN':
        return '#1E7A45';
      case 'DUE':
        return '#12605A';
      case 'SKIPPED':
        return '#A35A00';
      case 'MISSED':
        return '#B42318';
      case 'NOT_YET':
      default:
        return '#94A3B8';
    }
  };

  return (
    <div className="card-premium rounded-card-lg p-6 flex flex-col items-center relative overflow-hidden">
      <div className="text-center mb-4">
        <h3 className="text-xl sm:text-2xl font-bold text-ink">{t.dayRingTitle}</h3>
        <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-sm">{t.dayRingDesc}</p>
      </div>

      {/* SVG 24-Hour Circular Dial */}
      <div className="relative w-[320px] h-[320px] flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
          role="img"
          aria-label="24-hour visual medication dial"
        >
          {/* Background Clock Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#E4EAEA"
            strokeWidth={strokeWidth}
          />

          {/* Quadrant time markers (12 AM, 6 AM, 12 PM, 6 PM) */}
          <text x={center} y={center - radius + 2} textAnchor="middle" fontSize="10" fill="#6B7776" fontWeight="600">
            00:00
          </text>
          <text x={center + radius - 2} y={center + 4} textAnchor="middle" fontSize="10" fill="#6B7776" fontWeight="600">
            06:00
          </text>
          <text x={center} y={center + radius + 12} textAnchor="middle" fontSize="10" fill="#6B7776" fontWeight="600">
            12:00
          </text>
          <text x={center - radius + 2} y={center + 4} textAnchor="middle" fontSize="10" fill="#6B7776" fontWeight="600">
            18:00
          </text>

          {/* Render Dose Markers on Dial */}
          {slots.map((slot) => {
            const angle = timeToAngle(slot.dueTime);
            const rad = (angle * Math.PI) / 180;
            const markerX = center + radius * Math.cos(rad);
            const markerY = center + radius * Math.sin(rad);
            const color = getStatusColor(slot.status);
            const isDue = slot.status === 'DUE';

            return (
              <g
                key={slot.id}
                onClick={() => onSelectSlot(slot)}
                className="cursor-pointer group focus:outline-none"
                tabIndex={0}
                role="button"
                aria-label={`${slot.brandName} at ${slot.dueTime}, Status: ${slot.status}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectSlot(slot);
                }}
              >
                {/* Glow ring for DUE slot */}
                {isDue && (
                  <circle
                    cx={markerX}
                    cy={markerY}
                    r={22}
                    fill="#12605A"
                    fillOpacity="0.2"
                    className="animate-ping"
                  />
                )}

                {/* Marker Outer Circle */}
                <circle
                  cx={markerX}
                  cy={markerY}
                  r={15}
                  fill={color}
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  className="transition-transform group-hover:scale-125 group-focus:scale-125"
                />

                {/* Center dot/icon */}
                <circle cx={markerX} cy={markerY} r={5} fill="#FFFFFF" />

                {/* Time Label on hover/focus */}
                <text
                  x={markerX}
                  y={markerY + (markerY > center ? 28 : -20)}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#0E1B1A"
                  className="pointer-events-none select-none bg-white px-1 shadow-sm"
                >
                  {slot.dueTime}
                </text>
              </g>
            );
          })}

          {/* Sweeping Current Time Hand & Indicator */}
          <line
            x1={center}
            y1={center}
            x2={currentHandX}
            y2={currentHandY}
            stroke="#12605A"
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />
          <circle
            cx={currentHandX}
            cy={currentHandY}
            r={6}
            fill="#12605A"
            stroke="#DAEEEC"
            strokeWidth="3"
            className="animate-pulse"
          />
        </svg>

        {/* Center Clock Display */}
        <div className="absolute text-center pointer-events-none">
          <div className="text-3xl font-bold tracking-tight text-ink tabular-nums">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-800 mt-0.5">
            Today
          </div>
        </div>
      </div>

      {/* Accessible List Equivalent for Screen Readers */}
      <div className="sr-only">
        <h4>Scheduled doses today</h4>
        <ul>
          {slots.map((s) => (
            <li key={s.id}>
              {s.dueTime}: {s.brandName} - {s.dosageText}. Status: {s.status}.
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
