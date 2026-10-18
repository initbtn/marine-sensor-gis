/**
 * Marine Design System (MDS) - Semantic Tokens
 * 도메인 역할과 맥락(Context)을 부여한 CSS 변수 매핑 토큰
 */

export const mdsSemantic = {
  bg: {
    app: 'var(--marine-bg-app)',
    shell: 'var(--marine-bg-shell)',
    card: 'var(--marine-bg-card)',
    cardHover: 'var(--marine-bg-card-hover)',
    surfaceMuted: 'var(--marine-bg-surface-muted)',
  },
  border: {
    subtle: 'var(--marine-border-subtle)',
    focus: 'var(--marine-border-focus)',
    card: 'var(--marine-border-card)',
  },
  text: {
    primary: 'var(--marine-text-primary)',
    secondary: 'var(--marine-text-secondary)',
    muted: 'var(--marine-text-muted)',
    inverse: 'var(--marine-text-inverse)',
  },
  status: {
    normal: 'var(--marine-status-normal)',
    normalBg: 'var(--marine-status-normal-bg)',
    normalBorder: 'var(--marine-status-normal-border)',
    warning: 'var(--marine-status-warning)',
    warningBg: 'var(--marine-status-warning-bg)',
    warningBorder: 'var(--marine-status-warning-border)',
    critical: 'var(--marine-status-critical)',
    criticalBg: 'var(--marine-status-critical-bg)',
    criticalBorder: 'var(--marine-status-critical-border)',
    info: 'var(--marine-status-info)',
    infoBg: 'var(--marine-status-info-bg)',
  },
} as const;
