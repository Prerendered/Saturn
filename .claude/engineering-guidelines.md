This document is the single source of truth for all code standards, project structure, git conventions, and Chrome extension architecture. Claude Code must read and follow this before every session.

Read all three docs before writing any code:

1. This page — Engineering Guidelines (TypeScript, naming, git, architecture, security)
2. [🧩 Design Patterns](https://www.notion.so/Design-Patterns-32ac946c2801817e8b2bea68ce86d66f?pvs=21) — all architectural patterns with code examples
3. [🎨 Design System](https://www.notion.so/Design-System-32ac946c280181d0a708d40c9fe78a56?pvs=21) — colours, typography, tokens, popup UI rules

---

## 1. Language & Runtime

- **TypeScript strict mode** — `"strict": true` in tsconfig, no exceptions. Also enable `noUncheckedIndexedAccess`, `noImplicitReturns`, `exactOptionalPropertyTypes`.
- **No `any`** — use `unknown` + type narrowing or define proper types
- **No non-null assertions** (`!`) — handle nullability explicitly
- **Explicit return types** on all exported functions
- **Interfaces over types** for object shapes. Types for unions and primitives.
- **Enums are banned** — use `as const` objects instead
- **Bun** as package manager and runtime for tooling scripts
- **Target:** Chrome Manifest V3 only

```tsx
// BAD
export default function applyQuality(player: any) { ... }

// GOOD
export function applyQuality(player: YouTubePlayer): void { ... }
```

## 2. Code Style & Naming Conventions

- 2-space indentation, single quotes, no semicolons (Prettier defaults)
- **Named exports only** — no default exports except React components
- **File names:** `kebab-case.ts` — e.g. `quality-map.ts`
- **Component files:** `PascalCase.tsx` — e.g. `StatusPill.tsx`
- **One component per file** — no exceptions
- **Hooks:** `camelCase` with `use` prefix — e.g. `use-extension-settings.ts`
- **Types/Interfaces:** `PascalCase` — e.g. `ExtensionSettings`, `QualityLevel`
- **Constants:** see Section 6 — constants have their own file and naming convention

## 3. Extension Architecture Rules

- **No `localStorage`** — all persistence via `chrome.storage.local`. No exceptions.
- **No external network requests** anywhere — no telemetry, analytics, or CDN calls at runtime. The extension must function entirely offline after install.
- **Player API access only via content script** — never from background service worker or popup
- All YouTube player API calls wrapped in `try/catch` — YouTube updates break the player object silently
- **SPA navigation detected via `MutationObserver` on `#page-manager`** — not `popstate`, not `history` events
- **Message passing for popup → content** communication via `chrome.tabs.sendMessage` with typed message schemas
- Background service worker is **stateless** — does not cache player state. Source of truth is `chrome.storage.local`.
- All Chrome API calls (`chrome.storage`, `chrome.tabs`, `chrome.runtime`) must be wrapped to handle errors—these APIs can fail silently on page unload or when the extension is disabled

## 4. Quality Control Logic

These rules govern the core quality-setting behaviour and must not be changed without a full regression test.

- `getAvailableQualityLevels()` **must always be called** before `setPlaybackQualityRange()` — never assume quality levels are available
- Always target the **highest available quality ≤ detected screen height × devicePixelRatio**
- If the player object is not found after retries: log a warning with `console.warn` and bail silently — never throw or break page execution
- If YouTube is buffering when the observer fires: retry with exponential backoff (max 3 retries, 300ms intervals)
- **Canonical quality string order** (highest to lowest): `hd2160`, `hd1440`, `hd1080`, `hd720`, `large`, `medium`, `small`, `tiny`
- Never call `setPlaybackQuality()` (deprecated) — always use `setPlaybackQualityRange(quality, quality)`

```tsx
// GOOD: full quality clamping pipeline
export function applyQuality(player: YouTubePlayer, screenHeight: number): void {
  try {
    const available = player.getAvailableQualityLevels()
    if (!available.length) return
    const target = resolveTargetQuality(screenHeight, available)
    player.setPlaybackQualityRange(target, target)
  } catch (err) {
    console.warn('[Saturn] Failed to apply quality:', err)
  }
}
```

## 5. Git Conventions

### Branch naming

```
feat/quality-clamping
feat/popup-ui
fix/spa-navigation-observer
chore/setup-vite-manifest-v3
refactor/extract-resolution-utils
```

### Commit message format (Conventional Commits)

Format: `<type>(<scope>): <short description>`

Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `style`

```
feat(content): add quality clamping to available levels
feat(popup): build toggle + status pill UI
fix(content): handle player not ready on SPA navigation
chore(root): initialise Bun + Vite Manifest V3 setup
refactor(utils): extract resolution detection to separate module
```

### Rules

- **No commits directly to `main`** — always branch + PR
- **One logical change per commit** — no "did a bunch of stuff" commits
- **PRs must pass TypeScript check** before merge: `bun run typecheck`
- **Remove any extra comments/logs** after fixed; before merge
- No `WIP` commits on `main`
- Branch names always use one of: `feat/`, `fix/`, `chore/`, `refactor/`, `docs/`

## 6. Folder Structure

```jsx
saturn/
├── CLAUDE.md
├── .claude/
│   ├── engineering-guidelines.md
│   ├── design-patterns.md
│   ├── design-system.md
│   └── project-structure.md
├── src/
│   ├── background/               Chrome Service Worker
│   │   └── index.ts
│   ├── content/                  Injected into YouTube pages
│   │   ├── player-controller.ts  Player API hooks + quality logic
│   │   ├── spa-observer.ts       MutationObserver for SPA nav
│   │   └── index.ts
│   ├── popup/                    React 18 popup UI (320px)
│   │   ├── components/
│   │   │   ├── Toggle.tsx
│   │   │   ├── StatusPill.tsx
│   │   │   └── ResolutionReadout.tsx
│   │   ├── hooks/
│   │   │   └── use-extension-settings.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── utils/                    Pure utilities (no Chrome API calls)
│   │   ├── constants.ts          All behavioural constants — single source of truth
│   │   ├── tokens.ts             Design tokens (colours, typography) only
│   │   ├── resolution.ts
│   │   ├── quality-map.ts
│   │   └── storage.ts
│   └── types/
│       └── index.ts
├── public/
│   ├── manifest.json
│   └── icons/
├── vite.config.ts
├── tsconfig.json
└── package.json
```

**Key rule:** `src/utils/` contains only pure functions with zero Chrome API calls. Chrome APIs are called exclusively in `src/content/`, `src/background/`, and `src/popup/hooks/`. This keeps utilities fully testable with `bun test` without a browser environment.

---

## 6a. Constants

### The rule

All non-trivial constants live in `src/utils/constants.ts`. This is the single file a developer opens when they need to tune a number, change a key, or understand the system's configurable limits. Never scatter constants across files.

**One exception:** `src/utils/tokens.ts` holds design tokens (colours, typography, spacing). That file is strictly for visual constants. Everything behavioural — retry counts, delay values, storage keys, quality lists — goes in `constants.ts`.

### Naming convention

Constants use `SCREAMING_SNAKE_CASE` with a **domain prefix**. The domain prefix makes constants immediately self-describing and visually distinguishable from variables at a glance — you know at once what system the constant belongs to, what it configures, and whether it's something you'd want to tweak.

Format: `DOMAIN_DESCRIPTION_UNIT` (unit suffix when the value has one — `_MS`, `_PX`, `_COUNT`)

| Domain prefix | Covers | Examples |
| --- | --- | --- |
| `PLAYER_` | YouTube player API behaviour | `PLAYER_RETRY_COUNT`, `PLAYER_RETRY_DELAY_MS` |
| `QUALITY_` | Quality strings and resolution thresholds | `QUALITY_ORDER`, `QUALITY_THRESHOLD_HD2160_PX` |
| `STORAGE_` | [chrome.storage](http://chrome.storage) keys | `STORAGE_KEY_SETTINGS` |
| `POPUP_` | Popup layout dimensions | `POPUP_WIDTH_PX`, `POPUP_PADDING_PX` |
| `SPA_` | SPA navigation observer | `SPA_NAV_DEBOUNCE_DELAY_MS` |

**Good constant names are verbose on purpose.** `PLAYER_RETRY_COUNT` is better than `MAX_RETRIES` because it tells you which retries, and it avoids colliding with any future retry constant from a different domain. `STORAGE_KEY_SETTINGS` is better than `KEY` or `SETTINGS_KEY` because the domain is unambiguous.

```tsx
// src/utils/constants.ts
// Single source of truth for all behavioural constants.
// Design tokens (colours, fonts) live in tokens.ts — not here.
// When you need to change a number or a key, this is the only file you open.

// ─── Player ────────────────────────────────────────────────────────────────

/** How many times to retry finding the YouTube player before giving up. */
export const PLAYER_RETRY_COUNT = 3 as const

/** Base delay (ms) between player lookup retries. Multiplied by attempt index for backoff. */
export const PLAYER_RETRY_DELAY_MS = 300 as const

// ─── Quality ───────────────────────────────────────────────────────────────

/** Canonical YouTube quality strings, ordered highest to lowest. Never redefine these elsewhere. */
export const QUALITY_ORDER = [
  'hd2160',
  'hd1440',
  'hd1080',
  'hd720',
  'large',
  'medium',
  'small',
  'tiny',
] as const

/** Minimum physical screen height (px) required to use each quality level. */
export const QUALITY_THRESHOLDS = {
  hd2160: 2160,
  hd1440: 1440,
  hd1080: 1080,
  hd720:  720,
  large:  480,
  medium: 360,
  small:  240,
  tiny:   0,
} as const

// ─── Storage ───────────────────────────────────────────────────────────────

/** chrome.storage.local key for persisted extension settings. */
export const STORAGE_KEY_SETTINGS = 'settings' as const

// ─── Popup ─────────────────────────────────────────────────────────────────

/** Chrome popup width constraint (px). This is a hard browser limit — never change. */
export const POPUP_WIDTH_PX = 320 as const

/** Standard horizontal padding (px) for popup content areas. */
export const POPUP_PADDING_PX = 16 as const

// ─── SPA Navigation ────────────────────────────────────────────────────────

/** Delay (ms) after YouTube SPA navigation before attempting to access the player.
 *  YouTube needs time to inject the new player into the DOM. */
export const SPA_NAV_DEBOUNCE_DELAY_MS = 500 as const
```

### Rules

- **All behavioural constants live in `constants.ts`** — no magic numbers or magic strings anywhere else in the codebase
- **Every constant has a JSDoc comment** — one line minimum explaining what it is and why that value was chosen
- **Unit suffix is mandatory** when the value has units — `_MS` for milliseconds, `_PX` for pixels, `_COUNT` for counts. A bare number like `300` communicates nothing; `PLAYER_RETRY_DELAY_MS = 300` is unambiguous.
- **`as const`** on every constant — ensures TypeScript infers the literal type, not a widened `number` or `string`
- **Domain sections are separated by comments** — keeps the file scannable as it grows
- Never define the same concept in two places. If `STORAGE_KEY_SETTINGS` exists in `constants.ts`, `storage.ts` imports it — it doesn't define its own `const STORAGE_KEY`

### Importing constants

```tsx
// In any file that needs a constant — import from constants.ts, never redefine
import {
  PLAYER_RETRY_COUNT,
  PLAYER_RETRY_DELAY_MS,
  QUALITY_ORDER,
  QUALITY_THRESHOLDS,
} from '../utils/constants'

// storage.ts imports its own key — no local const
import { STORAGE_KEY_SETTINGS } from '../utils/constants'

export async function getSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEY_SETTINGS)
  return { ...DEFAULTS, ...(result[STORAGE_KEY_SETTINGS] as Partial<ExtensionSettings> ?? {}) }
}
```

---

## 7. Component Standards (Popup UI)

The popup is a fixed 320px React UI. Keep components small and purposeful.

### Folder structure

Every component lives in its own folder under `src/popup/components/`. The folder always contains the `.tsx` file. A `.utils.ts` file is added only when there are non-trivial pure functions worth separating — if it exists, a `.test.ts` file must exist alongside it.

```
src/popup/components/
  toggle/
    Toggle.tsx
    toggle.utils.ts        (only if there are non-trivial helpers)
    toggle.utils.test.ts   (required whenever utils file exists)
  status-pill/
    StatusPill.tsx         (no utils needed — folder only has the tsx)
  resolution-readout/
    ResolutionReadout.tsx
    resolution-readout.utils.ts
    resolution-readout.utils.test.ts
```

Importing always goes via the component file, never via the utils file:

```tsx
import { Toggle } from './components/toggle/Toggle'
```

### File structure for every component

```tsx
// 1. External imports
import { useState } from 'react'

// 2. Internal imports
import type { ExtensionSettings } from '../../types'

// 3. Types local to this file
interface Props {
  enabled: boolean
  onToggle: (value: boolean) => void
}

// 4. Component — hooks first, handlers second, render last
export function Toggle({ enabled, onToggle }: Props) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={() => onToggle(!enabled)}
    >
      {/* ... */}
    </button>
  )
}
```

### Rules

- **One component per file** — no exceptions
- **No inline hex values** — use CSS custom properties (`var(--color-accent)`) or class names only. Never hardcode colours.
- **No magic numbers** — extract to named constants or tokens
- **No direct `chrome.storage` calls in components** — go through the `useExtensionSettings` hook
- **No business logic in components** — logic lives in `src/utils/`
- Props interfaces always defined **above** the component, never inline
- Components never exceed **100 lines** — if it's longer, split it

---

## 8. Hooks Standards

Hooks are the only place the popup UI touches Chrome APIs.

```tsx
// src/popup/hooks/use-extension-settings.ts

import { useEffect, useState } from 'react'
import type { ExtensionSettings } from '../../types'
import { getSettings, saveSettings } from '../../utils/storage'

interface UseExtensionSettingsResult {
  settings: ExtensionSettings | null
  loading: boolean
  update: (partial: Partial<ExtensionSettings>) => Promise<void>
}

export function useExtensionSettings(): UseExtensionSettingsResult {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s)
      setLoading(false)
    })
  }, [])

  const update = async (partial: Partial<ExtensionSettings>) => {
    const updated = { ...settings!, ...partial }
    setSettings(updated)           // optimistic — update UI immediately
    await saveSettings(updated)    // persist to chrome.storage.local
  }

  return { settings, loading, update }
}
```

### Rules

- All `chrome.storage` reads happen inside hooks — never directly in components
- Hooks return a consistent shape: `{ settings, loading, update }` or `{ data, loading, error }`
- Hook names always start with `use`
- Hooks live in `src/popup/hooks/` — not inside `components/`

---

## 9. Storage & Typed Settings

All `chrome.storage.local` reads/writes go through a typed wrapper. Never call the Chrome storage API directly anywhere else.

```tsx
// src/utils/storage.ts

import type { ExtensionSettings } from '../types'

const STORAGE_KEY = 'settings' as const

const DEFAULTS: ExtensionSettings = {
  enabled: true,
  showBadge: true,
}

export async function getSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return { ...DEFAULTS, ...(result[STORAGE_KEY] as Partial<ExtensionSettings> ?? {}) }
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: settings })
}
```

### Rules

- `storage.ts` is the **only** file allowed to call `chrome.storage.local`
- Always merge incoming values with `DEFAULTS` — never assume a key already exists in storage (user may be on a fresh install)
- Storage keys are `as const` string constants defined at the top of the file — no magic string literals scattered around

---

## 10. Error Handling

- **Never swallow errors silently** — always log with `console.warn` or `console.error` and a `[Saturn]` prefix so they're easy to filter in DevTools
- All YouTube player API interactions must be in `try/catch` — the player object can disappear without warning on navigation or YouTube updates
- Use typed custom errors for domain failures

```tsx
export class PlayerNotFoundError extends Error {
  constructor() {
    super('YouTube player object not found on page')
    this.name = 'PlayerNotFoundError'
  }
}

export class QualityNotAvailableError extends Error {
  constructor(requested: string, available: string[]) {
    super(`Quality "${requested}" not in available levels: [${available.join(', ')}]`)
    this.name = 'QualityNotAvailableError'
  }
}
```

- **Graceful degradation is always the default**: if any part of the quality pipeline fails, the extension silently no-ops. It must never break the YouTube page or throw uncaught exceptions into the page context.

---

## 11. Security Rules

- **No external network requests** — the extension must function fully offline after install. Zero telemetry, zero analytics, zero CDN calls at runtime.
- **No user data transmitted** — detected resolution and quality strings never leave the device
- **`chrome.storage.local` only** — no `localStorage`, `sessionStorage`, or cookies
- **No `eval`** and no dynamic script injection — Manifest V3 CSP prohibits both, and they're bad practice regardless
- Permissions in `manifest.json` must be the **minimum required** — never add `"tabs"`, `"history"`, `"bookmarks"`, or any broad permission unless it is strictly necessary
- Content Security Policy in `manifest.json` must never be weakened
- Do not request `"host_permissions"` broader than `"*://*.youtube.com/*"`

---

## 12. Testing Standards

- All pure utility functions in `src/utils/` must have unit tests
- Test files live alongside source: `quality-map.ts` → `quality-map.test.ts`
- Use Bun's built-in test runner: `bun test`
- Player API interactions are **not unit-tested** (require a real browser environment). Test the pure logic around them instead: resolution detection, quality clamping, quality string mapping.

```tsx
import { describe, expect, it } from 'bun:test'
import { resolveTargetQuality } from './quality-map'

describe('resolveTargetQuality', () => {
  it('returns hd2160 for a 4K display', () => {
    expect(resolveTargetQuality(2160, ['hd2160', 'hd1440', 'hd1080'])).toBe('hd2160')
  })

  it('clamps to highest available when 4K is not in the available list', () => {
    expect(resolveTargetQuality(2160, ['hd1440', 'hd1080', 'hd720'])).toBe('hd1440')
  })

  it('returns hd1080 for a 1080p display', () => {
    expect(resolveTargetQuality(1080, ['hd2160', 'hd1440', 'hd1080', 'hd720'])).toBe('hd1080')
  })

  it('returns the best available quality when screen is below all tiers', () => {
    expect(resolveTargetQuality(480, ['hd1080', 'hd720', 'large', 'medium'])).toBe('large')
  })

  it('returns null when available list is empty', () => {
    expect(resolveTargetQuality(1080, [])).toBeNull()
  })
})
```