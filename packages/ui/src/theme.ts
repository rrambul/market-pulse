import { css } from 'lit';

export const colors = {
  bg: '#0a0e17',
  bgCard: '#111827',
  bgCardHover: '#1a2332',
  border: '#1e293b',
  borderActive: '#3b82f6',
  text: '#e2e8f0',
  textMuted: '#64748b',
  textDim: '#475569',
  positive: '#22c55e',
  positiveGlow: '#22c55e40',
  negative: '#ef4444',
  negativeGlow: '#ef444440',
  warning: '#f59e0b',
  info: '#3b82f6',
  accent: '#8b5cf6',
  accentGlow: '#8b5cf640',
};

export const themeStyles = css`
  :host {
    --mp-bg: #0a0e17;
    --mp-bg-card: #111827;
    --mp-bg-card-hover: #1a2332;
    --mp-border: #1e293b;
    --mp-border-active: #3b82f6;
    --mp-text: #e2e8f0;
    --mp-text-muted: #64748b;
    --mp-text-dim: #475569;
    --mp-positive: #22c55e;
    --mp-positive-glow: #22c55e40;
    --mp-negative: #ef4444;
    --mp-negative-glow: #ef444440;
    --mp-warning: #f59e0b;
    --mp-info: #3b82f6;
    --mp-accent: #8b5cf6;
    --mp-accent-glow: #8b5cf640;

    --mp-font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
    --mp-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;

    --mp-radius: 8px;
    --mp-radius-sm: 4px;
    --mp-transition: 150ms ease;

    font-family: var(--mp-font-sans);
    color: var(--mp-text);
    box-sizing: border-box;
  }

  *, *::before, *::after {
    box-sizing: inherit;
  }
`;
