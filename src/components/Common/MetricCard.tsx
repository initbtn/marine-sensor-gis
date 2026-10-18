import React from 'react';
import { AlarmLevel } from '../../types/telemetry';
import { AlertBadge } from './AlertBadge';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  status?: AlarmLevel;
  icon?: React.ReactNode;
  thresholdNotice?: string;
  subtext?: string;
  className?: string;
}

const STATUS_BORDER_CLASSES: Record<AlarmLevel, string> = {
  CRITICAL: 'border-rose-500/70 shadow-rose-950/20',
  WARNING: 'border-amber-500/60 shadow-amber-950/20',
  INFO: 'border-marine-border',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  status = 'INFO',
  icon,
  thresholdNotice,
  subtext,
  className = '',
}) => {
  const borderClass = STATUS_BORDER_CLASSES[status] || STATUS_BORDER_CLASSES.INFO;

  return (
    <div
      className={`p-4 rounded-xl transition-all duration-200 flex flex-col justify-between shadow-lg bg-marine-card border ${borderClass} ${className}`}
      data-testid={`metric-card-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {icon && <span className="text-marine-cyan">{icon}</span>}
          <span className="text-xs font-medium uppercase tracking-wider text-marine-secondary">
            {title}
          </span>
        </div>
        <AlertBadge level={status} />
      </div>

      <div className="flex items-baseline gap-1 my-1">
        <span className="text-2xl font-bold tracking-tight font-mono text-marine-primary">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-marine-secondary">
            {unit}
          </span>
        )}
      </div>

      {(thresholdNotice || subtext) && (
        <div className="mt-2 pt-2 border-t border-slate-700/50 flex flex-col gap-0.5">
          {thresholdNotice && (
            <span className="text-[11px] font-medium text-cyan-400">
              ⚖️ {thresholdNotice}
            </span>
          )}
          {subtext && (
            <span className="text-[11px] text-marine-muted">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
