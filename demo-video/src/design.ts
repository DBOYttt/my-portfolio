// Exact design tokens from the portfolio's globals.css
// Public portfolio uses OKLCH — fully supported in Remotion's Chrome renderer

export const C = {
  // Light mode (public pages)
  paper:      'oklch(97% 0.008 80)',       // warm off-white background
  paper2:     'oklch(94.5% 0.012 80)',     // slightly darker surface
  ink:        'oklch(20% 0.012 60)',       // near-black text
  inkSoft:    'oklch(38% 0.012 60)',       // secondary text
  inkFaint:   'oklch(58% 0.012 60)',       // tertiary / meta text
  hairline:   'oklch(82% 0.010 60)',       // subtle borders
  rule:       'oklch(70% 0.012 60)',       // visible rules
  accent:     'oklch(58% 0.13 45)',        // rust-orange accent
  accentSoft: 'oklch(58% 0.13 45 / 0.18)',
  highlight:  'oklch(90% 0.10 95 / 0.55)',

  // Admin panel (explicit hex, isolated from CSS vars)
  adminBg:      '#0f1117',
  adminCard:    '#1a1d27',
  adminBorder:  '#2a2d3a',
  adminText:    '#e2e8f0',    // slate-100
  adminMuted:   '#94a3b8',    // slate-400
  adminFaint:   '#475569',    // slate-600
  adminCyan:    '#06b6d4',    // cyan-500
  adminGreen:   '#22c55e',    // green-500
  adminBadgeBg: 'rgba(6,182,212,0.12)',
};

export const F = {
  // Font stacks — loaded via @remotion/google-fonts
  serif: 'Newsreader, Georgia, serif',
  sans:  '"Inter Tight", Inter, system-ui, sans-serif',
  mono:  '"JetBrains Mono", "Fira Code", monospace',
};
