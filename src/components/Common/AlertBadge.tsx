import React from 'react';
import { AlarmLevel } from '../../types/telemetry';

interface AlertBadgeProps {
  level: AlarmLevel;
  label?: string;
  blinking?: boolean;
  className?: string;
}

const BADGE_CLASSES: Record<AlarmLevel, { badgeClass: string; dotClass: string; defaultLabel: string }> = {
  CRITICAL: {
    badgeClass: 'marine-badge-critical text-rose-400 bg-rose-950/40 border-rose-500/40',
    dotClass: 'bg-rose-500',
    defaultLabel: 'CRITICAL',
  },
  WARNING: {
    badgeClass: 'marine-badge-warning text-amber-400 bg-amber-950/40 border-amber-500/40',
    dotClass: 'bg-amber-500',
    defaultLabel: 'WARNING',
  },
  INFO: {
    badgeClass: 'marine-badge-normal text-emerald-400 bg-emerald-950/40 border-emerald-500/40',
    dotClass: 'bg-emerald-400',
    defaultLabel: 'NORMAL',
  },
};

export const AlertBadge: React.FC<AlertBadgeProps> = ({
  level,
  label,
  blinking = false,
  className = '',
}) => {
  const config = BADGE_CLASSES[level] || BADGE_CLASSES.INFO;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider border ${config.badgeClass} ${className} ${
        blinking ? 'animate-pulse' : ''
      }`}
      data-testid={`alert-badge-${level.toLowerCase()}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {label || config.defaultLabel}
    </span>
  );
};
