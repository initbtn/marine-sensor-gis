import React from 'react';
import { MarineTheme } from '../../styles/theme';
import { AlarmLevel } from '../../types/telemetry';

interface AlertBadgeProps {
  level: AlarmLevel;
  label?: string;
  blinking?: boolean;
  className?: string;
}

export const AlertBadge: React.FC<AlertBadgeProps> = ({
  level,
  label,
  blinking = false,
  className = '',
}) => {
  const getColors = () => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'rgba(231, 29, 54, 0.2)',
          border: MarineTheme.colors.criticalCrimson,
          text: MarineTheme.colors.criticalCrimson,
          defaultLabel: 'CRITICAL',
        };
      case 'WARNING':
        return {
          bg: 'rgba(255, 159, 28, 0.2)',
          border: MarineTheme.colors.warningAmber,
          text: MarineTheme.colors.warningAmber,
          defaultLabel: 'WARNING',
        };
      case 'INFO':
      default:
        return {
          bg: 'rgba(0, 245, 212, 0.15)',
          border: MarineTheme.colors.ecoCyan,
          text: MarineTheme.colors.ecoCyan,
          defaultLabel: 'NORMAL',
        };
    }
  };

  const styleConfig = getColors();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider ${className} ${
        blinking ? 'animate-pulse' : ''
      }`}
      style={{
        backgroundColor: styleConfig.bg,
        border: `1px solid ${styleConfig.border}`,
        color: styleConfig.text,
      }}
      data-testid={`alert-badge-${level.toLowerCase()}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: styleConfig.text }}
      />
      {label || styleConfig.defaultLabel}
    </span>
  );
};
