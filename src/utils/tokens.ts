// Visual design tokens — colours, typography, and popup dimensions.
// This file is exclusively for UI tokens. Behavioural constants (retry counts,
// storage keys, quality strings) live in constants.ts — not here.
//
// Usage in components: prefer CSS custom properties (var(--color-accent)) over
// importing COLORS directly. Import COLORS only in non-component code such as
// canvas drawing or icon generation.

// ─── Colours ───────────────────────────────────────────────────────────────

export const COLORS = {
  // Backgrounds
  bg:            '#0d0f14',
  surface:       '#13161e',
  surfaceRaised: '#1a1d27',

  // Accent — purple
  accent:        '#a78bfa',
  accentDimBg:   'rgba(167,139,250,0.10)',
  accentBorder:  'rgba(167,139,250,0.28)',
  accentGlow:    'rgba(167,139,250,0.45)',

  // Text
  textPrimary:   '#e2e0f0',
  textSecondary: '#8b88a8',
  textMuted:     '#4a4870',

  // Borders
  borderDefault: '#1a1d2a',
  borderHover:   '#26293a',

  // Semantic
  success: '#4ade80',
  danger:  '#f87171',
} as const

// ─── Typography ────────────────────────────────────────────────────────────

export const TYPOGRAPHY = {
  fontFamily: 'Inter, sans-serif',
  fontMono:   'JetBrains Mono, monospace',
  weights: {
    regular:  400,
    medium:   500,
    semibold: 600,
  },
  sizes: {
    brand:      '14px', // Popup header / logo
    label:      '12px', // Toggle labels, status label
    meta:       '11px', // Section headers, status pill quality string
    readout:    '10px', // Resolution readout (JetBrains Mono), muted metadata
  },
} as const

// ─── Popup layout ──────────────────────────────────────────────────────────

// Note: POPUP_WIDTH_PX (the number) is the source of truth and lives in
// constants.ts. This CSS string is provided purely for use in style objects.
export const POPUP = {
  width: '320px',
} as const
