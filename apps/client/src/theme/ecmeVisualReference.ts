/**
 * Ecme visual reference — actionable notes extracted from the Ecme template
 * (`Theme/TypeScript/main`) to guide our React Native design tokens and shell.
 *
 * This is documentation only (a typed const so it travels with the theme). We rebuild
 * Ecme's visual language with RN primitives + tokens — we never port its web-only code
 * (Tailwind/CSS variables/DOM). See `.kiro/steering/ecme-reference.md`.
 */
export const ECME_VISUAL_REFERENCE = {
  appShell:
    'Persistent left sidebar (≈290px) on a white/neutral chrome, fixed 64px header bar, ' +
    'soft neutral page background, content laid out in rounded cards with generous gutters.',
  sidebar:
    'White surface, brand/logo block at top (header height), grouped vertical nav. Active ' +
    'item uses a soft primary-tinted pill with primary text/icon; inactive items are muted.',
  topbar:
    '64px tall, surface/chrome background with a hairline bottom border. Left: context ' +
    '(brand/active store). Right: quick actions (theme), user identity, sign-out.',
  card:
    'Rounded-2xl (16px) white/surface panels, hairline neutral border (gray-200), very ' +
    'soft drop shadow. Optional header row with a bottom divider; body padding ≈20px.',
  density:
    'Radius scale up to 16–20px; spacing tight-but-readable; borders subtle (gray-200); ' +
    'shadows low-opacity. Lists use hairline row dividers rather than heavy separators.',
  typography:
    'Bold/semibold headings with clear hierarchy (title > heading > subheading > body), ' +
    'muted captions for secondary metadata, uppercase micro-labels for KPI captions.',
  colors:
    'Primary brand blue #2a85ff (deep #0069f6), success #10b981, danger #ff6a55, ' +
    'warning #f59e0b, info #2a85ff; neutral gray ramp #fafafa→#171717. Status badges use ' +
    'a soft tinted background + solid foreground of the same hue.',
  badgesButtons:
    'Pill badges with soft tinted bg + solid fg. Buttons: bold label, rounded, primary ' +
    'filled / neutral secondary / ghost; subtle press feedback.',
  composition:
    'Dashboard = KPI row + action center + recent orders + inventory/top widgets. ' +
    'Lists = search + filter chips + rows with badges + trailing chevron. ' +
    'Detail = header with status badges + sectioned cards.',
  rtl:
    'Ecme defaults to RTL with Persian (fa). Rows mirror (row-reverse), text reads RTL, ' +
    'the start edge follows reading direction. We keep an LTR toggle.',
} as const;
