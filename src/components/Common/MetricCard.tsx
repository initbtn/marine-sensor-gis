import React from 'react';
import { MarineTheme } from '../../styles/theme';
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
  const getStatusBorderColor = () => {
    switch (status) {
      case 'CRITICAL':
        return MarineTheme.colors.criticalCrimson;
      case 'WARNING':
        return MarineTheme.colors.warningAmber;
      case 'INFO':
      default:
        return MarineTheme.colors.border;
    }
  };

  return (
    <div
      className={`p-4 rounded-xl transition-all duration-200 flex flex-col justify-between shadow-lg ${className}`}
      style={{
        backgroundColor: MarineTheme.colors.bgCard,
        border: `1px solid ${getStatusBorderColor()}`,
      }}
      data-testid={`metric-card-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {icon && <span style={{ color: MarineTheme.colors.ecoCyan }}>{icon}</span>}
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: MarineTheme.colors.textSecondary }}
          >
            {title}
          </span>
        </div>
        <AlertBadge level={status} />
      </div>

      <div className="flex items-baseline gap-1 my-1">
        <span
          className="text-2xl font-bold tracking-tight font-mono"
          style={{ color: MarineTheme.colors.textPrimary }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span
            className="text-xs font-medium"
            style={{ color: MarineTheme.colors.textSecondary }}
          >
            {unit}
          </span>
        )}
      </div>

      {(thresholdNotice || subtext) && (
        <div className="mt-2 pt-2 border-t border-slate-700/50 flex flex-col gap-0.5">
          {thresholdNotice && (
            <span
              className="text-[11px] font-medium"
              style={{ color: MarineTheme.colors.ecoCyanMuted }}
            >
              ⚖️ {thresholdNotice}
            </span>
          )}
          {subtext && (
            <span
              className="text-[11px]"
              style={{ color: MarineTheme.colors.textMuted }}
            >
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
