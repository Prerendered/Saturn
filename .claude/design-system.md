This document is the single source of truth for Saturn's visual identity, design tokens, and popup UI rules. Claude Code and humans must reference this before writing any styles or building any popup components.

**Portability principle:** All components in `src/popup/components/` are written to be fully modular. Each component lives in its own folder containing the `.tsx` file and, when warranted, a `.utils.ts` file for non-trivial helpers that benefit from standalone testing. What a component folder never contains is domain logic (Chrome APIs, storage reads, quality mapping). Colours are always CSS custom properties. Any component folder can be copied into another project and imported without modification. This is intentional and must be preserved — never couple a component to Saturn internals.

---

## 1. Design Tokens (as code)

`src/utils/tokens.ts` is exclusively for **visual design tokens**: colours, typography, and layout dimensions used by the UI. It is not a general constants file.

Behavioural constants (retry counts, delay values, storage keys, quality lists) live in `src/utils/constants.ts`. If you're looking for `POPUP_WIDTH_PX`, that's in `constants.ts`. If you're looking for `COLORS.accent`, that's here.

Tokens live in `src/utils/tokens.ts` and are imported by popup components and CSS generation. Never hardcode a colour hex value or font size outside this file.

```tsx
// src/utils/tokens.ts

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
  success:       '#4ade80',
  danger:        '#f87171',
} as const

export const TYPOGRAPHY = {
  fontFamily: 'Inter, sans-serif',
  fontMono:   'JetBrains Mono, monospace',
  weights: {
    regular:  400,
    medium:   500,
    semibold: 600,
  },
} as const

// Note: POPUP_WIDTH_PX (the number) lives in constants.ts.
// This CSS string version is here purely for use in style objects.
export const POPUP = {
  width: '320px',  // Chrome popup constraint — source of truth is POPUP_WIDTH_PX in constants.ts
} as const
```

---

## 2. Colour Palette

| Role | Token | Value |
| --- | --- | --- |
| Page background | `COLORS.bg` | `#0d0f14` |
| Card / surface | `COLORS.surface` | `#13161e` |
| Raised surface | `COLORS.surfaceRaised` | `#1a1d27` |
| Purple accent | `COLORS.accent` | `#a78bfa` |
| Accent dim background | `COLORS.accentDimBg` | `rgba(167,139,250,0.10)` |
| Accent border | `COLORS.accentBorder` | `rgba(167,139,250,0.28)` |
| Active glow | `COLORS.accentGlow` | `rgba(167,139,250,0.45)` |
| Primary text | `COLORS.textPrimary` | `#e2e0f0` |
| Secondary text | `COLORS.textSecondary` | `#8b88a8` |
| Muted text | `COLORS.textMuted` | `#4a4870` |
| Border default | `COLORS.borderDefault` | `#1a1d2a` |
| Border hover | `COLORS.borderHover` | `#26293a` |
| Success / active | `COLORS.success` | `#4ade80` |
| Danger / error | `COLORS.danger` | `#f87171` |

---

## 3. Typography

**Primary font:** Inter (Google Fonts) — clean, readable at the small sizes the popup uses. Free and OFL licensed.

**Mono font:** JetBrains Mono — used exclusively for resolution values and quality strings in the popup readout.

| Role | Weight | Size | Usage |
| --- | --- | --- | --- |
| Brand / logo | 600 | 14px | Popup header only |
| Section headers | 600 | 11px | Settings group labels |
| Status label | 500 | 12px | Current quality indicator |
| Toggle labels | 400 | 12px | Enable/disable options |
| Resolution readout | 400 | 10px | JetBrains Mono, detected resolution string |
| Muted metadata | 400 | 10px | Version number, hints |

### Rules

- Use Inter for all text except the resolution readout
- Use JetBrains Mono only for the resolution readout and quality string — not for any other UI text
- Never go below 10px for any visible text
- Font weights are limited to 400, 500, 600 — no other weights needed at popup scale

---

## 4. CSS Custom Properties

All tokens are exposed as CSS custom properties on `:root` so components can reference them without importing the TS token object. This is the preferred approach in components — use `var(--color-accent)` over importing `COLORS.accent`.

```css
/* src/popup/styles/tokens.css */

:root {
  /* Backgrounds */
  --color-bg:             #0d0f14;
  --color-surface:        #13161e;
  --color-surface-raised: #1a1d27;

  /* Accent */
  --color-accent:         #a78bfa;
  --color-accent-dim:     rgba(167,139,250,0.10);
  --color-accent-border:  rgba(167,139,250,0.28);
  --color-accent-glow:    rgba(167,139,250,0.45);

  /* Text */
  --color-text-primary:   #e2e0f0;
  --color-text-secondary: #8b88a8;
  --color-text-muted:     #4a4870;

  /* Borders */
  --color-border:         #1a1d2a;
  --color-border-hover:   #26293a;

  /* Semantic */
  --color-success:        #4ade80;
  --color-danger:         #f87171;

  /* Layout */
  --popup-width:          320px;
}
```

---

## 5. Popup Layout Rules

- **Fixed width: 320px** — this is a Chrome popup constraint. Never change this or add a `min-width`/`max-width` that conflicts with it.
- **No horizontal scroll** — everything must fit within 320px
- **Max height: ~600px** before Chrome clips the popup — design for the most common case of ~400px of content
- **Padding:** 16px horizontal, 12px vertical for main content areas
- **Section spacing:** 16px gap between logical groups
- **No external fonts loaded at runtime** — Inter must be bundled via Vite, not loaded from Google Fonts CDN (CSP restriction)

---

## 6. Component Patterns

### Modularity contract

Every component listed in this section satisfies the following contract. Claude Code must verify this before writing or editing any component:

- **Folder-per-component** — every component lives in `components/component-name/`. The folder always contains `ComponentName.tsx`. It optionally contains `component-name.utils.ts` when there are non-trivial pure functions worth decoupling and testing independently.
- **Utils file is conditional** — only create it when it earns its place: the functions have real logic, would be cleaner to test without a React renderer, or are making the `.tsx` file hard to read. Don’t create it for one-liners.
- **If a utils file exists, a test file exists** — `component-name.utils.test.ts` lives in the same folder.
- **External data via props only** — the component never calls a hook, reads from storage, or makes a Chrome API call to get its own data. Data it doesn’t own arrives as props.
- **CSS custom properties only** — every colour references a `var(--color-*)` token. Zero hardcoded hex values anywhere in the component folder.
- **Named export** — `export function ComponentName(...)`, never `export default`.
- **No Saturn-specific imports** — the only allowed imports inside a component folder are `react`, other component folders, and `src/types/index.ts`. No imports from `src/utils/storage`, `src/popup/hooks/`, or `src/utils/quality-map`.
- **Copyable folder** — the entire `component-name/` folder can be dropped into any React project. Import via the `.tsx` file. Works as long as the consuming project loads `tokens.css`.

### How to use a component in another project

```bash
# 1. Copy the component folder (includes .tsx, .utils.ts, .test.ts if present)
cp -r saturn/src/popup/components/toggle other-project/src/components/toggle

# 2. Copy the tokens CSS (if not already present)
cp saturn/src/popup/styles/tokens.css other-project/src/styles/tokens.css

# 3. Load tokens.css once at the root of the consuming app
```

```tsx
// other-project/src/main.tsx
import './styles/tokens.css'
import { Toggle } from './components/toggle/Toggle'

// Works immediately — no extra setup
<Toggle enabled={true} onToggle={v => console.log(v)} label="Enable feature" />
```

The component renders correctly because it only depends on the CSS variables being present in the cascade — it has no knowledge of Saturn or Chrome extensions.

### Toggle

- Off state: muted border (`--color-border`), track background `--color-surface-raised`
- On state: accent colour (`--color-accent`) track, white thumb
- Hover state: border brightens to `--color-border-hover`
- Transition: 150ms ease
- Always includes `role="switch"` and `aria-checked` for accessibility

Toggle has real colour-selection logic, so it uses the folder + utils file structure. `getTrackColor` and `getBorderColor` live in `toggle.utils.ts` where they can be tested with plain `bun test` — no React renderer needed.

```tsx
// src/popup/components/toggle/toggle.utils.ts

export function getTrackColor(enabled: boolean, hovered: boolean): string {
  if (enabled) return 'var(--color-accent)'
  if (hovered) return 'var(--color-border-hover)'
  return 'var(--color-surface-raised)'
}

export function getBorderColor(enabled: boolean, hovered: boolean): string {
  if (enabled) return 'var(--color-accent-border)'
  if (hovered) return 'var(--color-border-hover)'
  return 'var(--color-border)'
}
```

```tsx
// src/popup/components/toggle/Toggle.tsx

import { useState } from 'react'
import { getTrackColor, getBorderColor } from './toggle.utils'

interface Props {
  enabled: boolean
  onToggle: (value: boolean) => void
  label: string
}

export function Toggle({ enabled, onToggle, label }: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onToggle(!enabled)}
      style={{
        background: getTrackColor(enabled, hovered),
        border: `1px solid ${getBorderColor(enabled, hovered)}`,
        borderRadius: '12px',
        width: '36px',
        height: '20px',
        cursor: 'pointer',
        transition: 'background 150ms ease, border-color 150ms ease',
        position: 'relative',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: enabled ? '18px' : '2px',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 150ms ease',
        }}
      />
    </button>
  )
}
```

### Status Pill

Shows the current active quality level. Only visible when the extension has successfully set quality.

- Background: `--color-accent-dim`
- Border: `--color-accent-border`
- Text: `--color-accent`, weight 500, 11px
- Active state: box-shadow glow using `--color-accent-glow`
- Quality string rendered in JetBrains Mono

```tsx
// src/popup/components/StatusPill.tsx

interface Props {
  quality: string | null  // e.g. 'hd1440', null when unknown
  active: boolean
}

export function StatusPill({ quality, active }: Props) {
  if (!quality) return null

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '6px',
        background: 'var(--color-accent-dim)',
        border: '1px solid var(--color-accent-border)',
        color: 'var(--color-accent)',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        fontWeight: 500,
        boxShadow: active ? '0 0 8px var(--color-accent-glow)' : 'none',
        transition: 'box-shadow 200ms ease',
      }}
    >
      {quality}
    </span>
  )
}
```

### Resolution Readout

Displays the detected physical screen resolution.

- Font: JetBrains Mono
- Size: 10px, weight 400
- Colour: `--color-text-muted`
- Format: `{width} × {height}` (e.g. `2560 × 1440`)

### Buttons

- Background: `--color-accent-dim`
- Border: `--color-accent-border`
- Text: `--color-accent`
- Hover: brighten border to `rgba(167,139,250,0.45)`
- No filled/solid primary buttons in the popup — the dim + border style is the only button style

### Loading / Empty State

- Centered in the popup
- Spinner: a simple CSS animation, `--color-text-muted` colour
- No third-party spinner libraries

```tsx
export function LoadingState() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '80px',
      color: 'var(--color-text-muted)',
    }}>
      {/* CSS spinner */}
      <span className="spinner" />
    </div>
  )
}
```

---

## 7. Icon Sizes

Chrome requires extension icons at three sizes. All must use the purple accent palette.

| Size | Usage |
| --- | --- |
| 16px | Browser toolbar icon (inactive state) |
| 48px | Extension management page |
| 128px | Chrome Web Store listing |

Active / enabled state: use full `#a78bfa` accent fill

Disabled state: use `#4a4870` muted fill

---

## 8. Design Rules Summary

### Modularity & portability

- **All components are modular by default** — every component in `src/popup/components/` must be copyable into another project and work without modification (beyond the import path)
- **UI logic lives in the component file** — local state, event handlers, and rendering helpers belong in the same file as the JSX. One file per component, everything that belongs to that component’s UI lives inside it.
- **External data via props only** — never reach into hooks or storage to fetch data inside a component. If the component needs data, the parent passes it as props.
- **Named exports only** — `export function Toggle(...)`, never `export default Toggle`
- **No Saturn-specific imports in components** — components may only import from `react`, other component files, and `src/types/index.ts`
- **`tokens.css` is the only external dependency** — a component works in any project that loads the CSS custom properties. Document this clearly in any component you write.

### Styling

- **Never hardcode hex values** in components — use `var(--color-*)` CSS properties
- **Never import `COLORS` directly in components** — use CSS custom properties. `COLORS` is for non-component code only (e.g. canvas, icon generators).
- **All interactive elements** (toggles, buttons) must have visible focus styles using the accent colour
- **Transitions** are 150–200ms ease — snappy but not jarring at popup scale

### Layout & typography

- **Popup width is always 320px** — non-negotiable Chrome constraint
- **Inter for all text, JetBrains Mono for resolution and quality strings only**
- **No external fonts loaded at runtime** — bundle Inter via Vite (CSP blocks Google Fonts CDN at runtime)