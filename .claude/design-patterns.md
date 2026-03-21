This document defines all architectural and UI patterns used in the Saturn Chrome extension. Every pattern has a reason — don't deviate without updating this document first.

**Modularity principle:** Every utility, hook, and UI component in this project is written to be self-contained and importable by other projects. Nothing assumes it will only ever live inside Saturn. Utilities have zero Saturn-specific dependencies. Each component lives in its own folder containing the component file and, when warranted, a co-located utils file for non-trivial helpers. If you are building a new Planet project and need a `Toggle`, a `StatusPill`, or a `resolveTargetQuality` function — copy the folder, import it, and it works.

---

## 1. Content Script Pattern

All YouTube player interaction lives exclusively in the content script layer. The background service worker and popup UI never touch the player directly.

```
Background SW  ──────────────────────►  chrome.storage.local
                                               │
Popup UI  ──── chrome.tabs.sendMessage ──►  Content Script  ──►  YouTube Player API
```

### Why

The YouTube player object exists only in the page DOM. Content scripts are the only extension context that shares the page's JavaScript environment. Background workers and popups cannot access `document` on the YouTube tab.

### Structure

```tsx
// src/content/index.ts
// Entry point — wires together the two content script modules

import { initPlayerController } from './player-controller'
import { initSpaObserver } from './spa-observer'

// Run on initial page load
initPlayerController()

// Watch for YouTube SPA navigation and re-apply quality
initSpaObserver(() => {
  initPlayerController()
})
```

### Rules

- Content scripts must never make external network requests
- Content scripts must never throw uncaught exceptions — always `try/catch` and log with `[Saturn]` prefix
- Content scripts must not import from `src/popup/` — no shared UI code

---

## 2. SPA Navigation Observer Pattern

YouTube is a Single Page Application. Navigating between videos does not trigger a full page reload, so the content script's initial `initPlayerController()` call only runs once. A `MutationObserver` watches for YouTube's SPA navigation signals and re-triggers quality application.

### Why `MutationObserver` and not `popstate`

YouTube does not consistently fire `popstate` or `hashchange` events on internal navigation. It manipulates the History API directly. The most reliable signal is a DOM mutation on `#page-manager` — YouTube's root routing container — which swaps child elements when navigating.

```tsx
// src/content/spa-observer.ts

export function initSpaObserver(onNavigate: () => void): void {
  const pageManager = document.querySelector('#page-manager')
  if (!pageManager) {
    console.warn('[Saturn] #page-manager not found — SPA observer not started')
    return
  }

  let lastUrl = location.href

  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href
      // Small delay — give YouTube time to inject the new player
      setTimeout(onNavigate, 500)
    }
  })

  observer.observe(pageManager, { childList: true, subtree: false })
}
```

### Rules

- Always observe `#page-manager`, not `document.body` — `body` mutation volume is too high
- Always include a short delay (300–600ms) after navigation before accessing the player — the player takes time to appear in the DOM
- If `#page-manager` is not found, log a warning and return silently — never throw

---

## 3. Quality Clamping Pipeline Pattern

Quality is never set blindly. The pipeline always checks what YouTube has available before requesting anything.

```
Detect screen resolution
       ↓
Get available quality levels from player
       ↓
Find highest available level ≤ screen resolution
       ↓
Call setPlaybackQualityRange(target, target)
```

```tsx
// src/content/player-controller.ts

import { detectScreenHeight } from '../utils/resolution'
import { resolveTargetQuality } from '../utils/quality-map'
import { getSettings } from '../utils/storage'

export async function initPlayerController(): Promise<void> {
  const settings = await getSettings()
  if (!settings.enabled) return

  // Retry up to 3 times with exponential backoff — player may not be ready yet
  const player = await findPlayerWithRetry(3, 300)
  if (!player) {
    console.warn('[Saturn] Player not found after retries — skipping quality set')
    return
  }

  try {
    const screenHeight = detectScreenHeight()
    const available = player.getAvailableQualityLevels() as string[]
    if (!available.length) return

    const target = resolveTargetQuality(screenHeight, available)
    if (!target) return

    player.setPlaybackQualityRange(target, target)
  } catch (err) {
    console.warn('[Saturn] Failed to apply quality:', err)
  }
}

async function findPlayerWithRetry(
  maxRetries: number,
  delayMs: number
): Promise<YoutubePlayer | null> {
  for (let i = 0; i < maxRetries; i++) {
    const el = document.querySelector('.html5-video-player')
    const player = el as unknown as YoutubePlayer | null
    if (player && typeof player.getAvailableQualityLevels === 'function') {
      return player
    }
    await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)))
  }
  return null
}
```

### Rules

- Always retry with backoff — never assume the player is immediately ready
- `getAvailableQualityLevels()` must always be called before `setPlaybackQualityRange()`
- `setPlaybackQualityRange(target, target)` is the correct API — never use deprecated `setPlaybackQuality()`
- If `target` resolves to `null` (empty available list), return early silently

---

## 4. Resolution Detection Pattern

Physical screen resolution is computed from `window.screen.height` multiplied by `window.devicePixelRatio`. This gives the actual pixel height of the monitor, accounting for HiDPI / Retina displays.

```tsx
// src/utils/resolution.ts

/**
 * Returns the physical screen height in pixels.
 * Uses devicePixelRatio to account for HiDPI / Retina displays.
 * A 1440p monitor at 2x DPR would incorrectly read as 720 from screen.height alone.
 */
export function detectScreenHeight(): number {
  return Math.round(window.screen.height * window.devicePixelRatio)
}
```

### Why not `window.innerHeight`?

`window.innerHeight` returns the viewport height, not the monitor height. On a 4K monitor with a browser window that's not maximised, this would severely underestimate the display capability.

### Why `devicePixelRatio`?

On a MacBook Pro with a 1440p display, `window.screen.height` reports 900 (logical pixels) while the physical resolution is 1800. Multiplying by `devicePixelRatio` (2.0) gives the correct physical height.

### Rules

- Always use `detectScreenHeight()` — never access `window.screen.height` or `devicePixelRatio` directly in other files
- The result is cached per content script session — monitor resolution doesn't change mid-session

---

## 5. Quality Map Pattern

The mapping from screen height to quality string is a pure, testable utility. It never touches Chrome APIs or the DOM.

```tsx
// src/utils/quality-map.ts

// Ordered highest to lowest — must stay in this order
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

export type QualityLevel = typeof QUALITY_ORDER[number]

// Maps quality string → minimum screen height (in physical pixels) required to use it
const QUALITY_THRESHOLDS: Record<QualityLevel, number> = {
  hd2160: 2160,
  hd1440: 1440,
  hd1080: 1080,
  hd720:  720,
  large:  480,
  medium: 360,
  small:  240,
  tiny:   0,
}

/**
 * Returns the highest available quality level that fits the screen height.
 * Returns null if the available list is empty.
 */
export function resolveTargetQuality(
  screenHeight: number,
  available: string[]
): QualityLevel | null {
  if (!available.length) return null

  for (const quality of QUALITY_ORDER) {
    if (
      available.includes(quality) &&
      screenHeight >= QUALITY_THRESHOLDS[quality]
    ) {
      return quality
    }
  }

  // Fallback: return the highest available quality regardless of screen size
  return (available[0] as QualityLevel) ?? null
}
```

### Rules

- `QUALITY_ORDER` is the canonical list — never define quality strings anywhere else
- `resolveTargetQuality` is a pure function — no side effects, no DOM access, no Chrome APIs
- Adding a new quality tier = add to `QUALITY_ORDER` + add to `QUALITY_THRESHOLDS` + add test cases

### Portability

`quality-map.ts` and `resolution.ts` have **zero dependencies** — no Chrome APIs, no DOM calls beyond `window.screen`, no Saturn-specific imports. They can be dropped into any TypeScript project and imported directly.

Note: `quality-map.ts` imports `QUALITY_ORDER` and `QUALITY_THRESHOLDS` from `constants.ts`. Copy `constants.ts` alongside it, or inline the values if you only need the function.

```tsx
// In a completely different project
import { resolveTargetQuality } from 'path/to/quality-map'
import { detectScreenHeight } from 'path/to/resolution'

const height = detectScreenHeight()
const target = resolveTargetQuality(height, availableQualities)
```

---

## 6. Storage Wrapper Pattern

All `chrome.storage.local` calls are centralised in one typed wrapper. Components and hooks never call `chrome.storage` directly.

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

### Why

- Keeps type safety centralised — one place to update if the settings schema changes
- Makes the settings shape predictable everywhere in the app — always merged with `DEFAULTS`
- Easier to test — mock `storage.ts` exports instead of mocking Chrome APIs globally

### Rules

- `storage.ts` is the **only** file allowed to call `chrome.storage.local`
- Always merge with `DEFAULTS` — a fresh install has nothing in storage
- Storage keys are `as const` constants at the top of the file — no raw string literals elsewhere

### Portability

The `ExtensionSettings` type, `DEFAULTS` constant, and the imported `STORAGE_KEY_SETTINGS` are the only Saturn-specific knowledge inside `storage.ts`. To reuse in another extension: copy the file and `constants.ts`, replace `ExtensionSettings` and `DEFAULTS`, rename the storage key constant. The wrapper structure is generic.

---

## 7. Popup Hook Pattern

The popup UI is a standard React 18 app. The only Saturn-specific pattern is that all Chrome API access is wrapped in a custom hook, keeping components pure and testable.

```tsx
// src/popup/hooks/use-extension-settings.ts

import { useEffect, useState } from 'react'
import type { ExtensionSettings } from '../../types'
import { getSettings, saveSettings } from '../../utils/storage'

export function useExtensionSettings() {
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
    setSettings(updated)         // optimistic — update UI before storage write confirms
    await saveSettings(updated)  // persist
  }

  return { settings, loading, update }
}
```

### Usage in a component

```tsx
// src/popup/App.tsx

import { useExtensionSettings } from './hooks/use-extension-settings'
import { Toggle } from './components/toggle/Toggle'
import { StatusPill } from './components/status-pill/StatusPill'

export default function App() {
  const { settings, loading, update } = useExtensionSettings()

  if (loading || !settings) return <LoadingState />

  return (
    <main>
      <Toggle
        enabled={settings.enabled}
        onToggle={enabled => update({ enabled })}
      />
      <StatusPill enabled={settings.enabled} />
    </main>
  )
}
```

### Rules

- Components receive state and callbacks as props — they never call `useExtensionSettings` themselves (only `App.tsx` does)
- The `update` function is always optimistic — update local state first, then persist
- `loading` must always be handled — never render settings UI with a null `settings` object

### Portability

The hook itself is Saturn-specific (it talks to `storage.ts` which knows about `ExtensionSettings`). But the **pattern** — a hook that loads from storage on mount, exposes a typed `update` function, and applies changes optimistically — is generic. Clone and adapt for any extension that needs settings management.

---

## 8. Message Passing Pattern

When the popup needs to trigger an action in the content script (e.g., re-apply quality immediately after the user enables the extension), it uses `chrome.tabs.sendMessage` with typed message schemas.

```tsx
// src/types/index.ts

export interface SaturnMessage {
  type: 'APPLY_QUALITY' | 'PING'
}

// src/popup/hooks/use-extension-settings.ts
// After saving settings, notify the active tab's content script

import type { SaturnMessage } from '../../types'

const update = async (partial: Partial<ExtensionSettings>) => {
  const updated = { ...settings!, ...partial }
  setSettings(updated)
  await saveSettings(updated)

  // Tell the active YouTube tab to re-apply quality with new settings
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id) {
    const msg: SaturnMessage = { type: 'APPLY_QUALITY' }
    chrome.tabs.sendMessage(tab.id, msg).catch(() => {
      // Tab may not have the content script — silently ignore
    })
  }
}

// src/content/index.ts
// Listen for messages from the popup

chrome.runtime.onMessage.addListener((message: SaturnMessage) => {
  if (message.type === 'APPLY_QUALITY') {
    initPlayerController()
  }
})
```

### Rules

- All message types are defined in `src/types/index.ts` — never use raw string literals
- `sendMessage` must always have a `.catch()` — it throws if no listener is present (e.g., user is not on YouTube)
- Keep messages minimal — pass a type identifier only, not large data payloads

---

## 9. Graceful Degradation Pattern

Saturn must never break the YouTube page. Every point of contact with the YouTube DOM or player API follows a "log and bail" strategy.

```tsx
// The full degradation hierarchy:

// 1. Settings disabled — return early, do nothing
if (!settings.enabled) return

// 2. Player not found after retries — log and return
const player = await findPlayerWithRetry(3, 300)
if (!player) {
  console.warn('[Saturn] Player not found — skipping')
  return
}

// 3. Player API call fails (YouTube update) — catch and log
try {
  const available = player.getAvailableQualityLevels()
  const target = resolveTargetQuality(screenHeight, available)
  if (!target) return
  player.setPlaybackQualityRange(target, target)
} catch (err) {
  console.warn('[Saturn] Quality apply failed:', err)
  // Extension is now effectively a no-op until next navigation — that's fine
}
```

### Rules

- Every step in the pipeline has an explicit early return
- `console.warn` with `[Saturn]` prefix on every degraded path — easy to filter in DevTools
- Never use `console.error` for expected failure modes (player not found is expected on non-video pages)
- Never re-throw from content scripts — uncaught exceptions in content scripts pollute the page's error console

---

## 10. Component Modularity & Portability Pattern

Every component, hook, and utility in Saturn is written to be **self-contained and importable by other projects without modification**. This is a first-class design constraint, not an afterthought.

### The rule in one sentence

If a file cannot be copied into a different project and imported with a single path change, it is not modular enough.

### What makes a file portable

**Utilities (`src/utils/`)** — must have:

- Zero Chrome API calls
- Zero Saturn-specific imports
- Named exports only (no default exports)
- Full TypeScript types on all public functions
- JSDoc on every exported function

```tsx
// GOOD — zero dependencies, works anywhere
export function detectScreenHeight(): number {
  return Math.round(window.screen.height * window.devicePixelRatio)
}

// BAD — depends on Chrome API, not portable
export async function detectScreenHeight(): Promise<number> {
  const settings = await chrome.storage.local.get('settings') // ❌ Chrome API
  ...
}
```

**UI Components (`src/popup/components/`)** — each component lives in its own folder. The folder always contains the component `.tsx` file. It optionally contains a `.utils.ts` file when there are helpers worth decoupling — pure functions with non-trivial logic that benefit from being tested without a React renderer.

```
src/popup/components/
  toggle/
    Toggle.tsx                    ← always: JSX, local state, event handlers
    toggle.utils.ts               ← only if needed: getTrackColor(), getBorderColor()
    toggle.utils.test.ts          ← if utils file exists, test file exists too
  status-pill/
    StatusPill.tsx                ← simple enough, no utils file needed
  resolution-readout/
    ResolutionReadout.tsx
    resolution-readout.utils.ts   ← formatResolutionString() earns its own file
    resolution-readout.utils.test.ts
```

**When to create a utils file:** the component file contains functions that have non-trivial logic, would be cleaner to unit-test without rendering the component, or are making the component file noticeably hard to read. Extract them.

**When NOT to create a utils file:** one-liners and trivial derivations don’t need a separate file. Don’t create ceremony for things like `const isActive = quality !== null`.

The component file imports from its own utils file. Consumers outside the folder always import from the component file only — the utils file is an internal implementation detail:

```tsx
// toggle/toggle.utils.ts — pure functions, no React, fully bun-testable
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
// toggle/Toggle.tsx — imports helpers from its own utils file
import { useState } from 'react'
import { getTrackColor, getBorderColor } from './toggle.utils'

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
      }}
    >
      <span style={{ left: enabled ? '18px' : '2px' }} />
    </button>
  )
}
```

```tsx
// toggle/toggle.utils.test.ts
import { describe, expect, it } from 'bun:test'
import { getTrackColor } from './toggle.utils'

describe('getTrackColor', () => {
  it('returns accent when enabled', () => {
    expect(getTrackColor(true, false)).toBe('var(--color-accent)')
  })
  it('returns hover colour when idle and hovered', () => {
    expect(getTrackColor(false, true)).toBe('var(--color-border-hover)')
  })
  it('returns surface when idle', () => {
    expect(getTrackColor(false, false)).toBe('var(--color-surface-raised)')
  })
})
```

Importing from outside the folder is always via the component file:

```tsx
import { Toggle } from '../components/toggle/Toggle'
// In another project: copy the whole toggle/ folder, same import path
```

A component folder is portable when:

- External data arrives via props
- All colours are `var(--color-*)` — no hardcoded hex
- No imports from `src/popup/hooks/` or `src/utils/storage`
- No Chrome API calls anywhere in the folder
- Named export only (not `export default`)

```tsx
// BAD — domain hook inside the component breaks portability
export function Toggle({ label }: { label: string }) {
  const { settings, update } = useExtensionSettings() // ❌
}

// BAD — Chrome API inside a utils file is still wrong
// toggle/toggle.utils.ts
export async function getInitialState() {
  return chrome.storage.local.get('settings') // ❌ Chrome API in component utils
}
```

**Hooks (`src/popup/hooks/`)** — these are Saturn-aware by design (they talk to `storage.ts`). They are not portable as-is, but the **pattern** they implement (optimistic update, typed settings, loading state) is. Document the pattern, not the implementation, when reusing.

### How to import a Saturn utility or component in another project

There are two approaches depending on the situation:

**Option A: Direct copy** (for utilities and single components)

```bash
# Utilities — copy the file
cp saturn/src/utils/quality-map.ts venus/src/utils/quality-map.ts

# Components — copy the whole folder
cp -r saturn/src/popup/components/toggle venus/src/components/toggle
```

Then import normally:

```tsx
import { resolveTargetQuality } from '../utils/quality-map'
import { Toggle } from '../components/toggle/Toggle'
```

**Option B: Shared package** (for components reused across 2+ Planet projects)

Move the component folder into a shared package:

```
packages/
  ui/
    src/
      toggle/
        Toggle.tsx
        toggle.utils.ts
      status-pill/
        StatusPill.tsx
      tokens.css
    package.json   { "name": "@planets/ui" }
```

Import in any project:

```tsx
import { Toggle } from '@planets/ui/toggle/Toggle'
import { StatusPill } from '@planets/ui/status-pill/StatusPill'
```

The component works in any project that loads `@planets/ui/tokens.css`. No other setup required.

### Checklist before adding a new component or utility

- [ ]  For components: does all external data arrive via props? (Internal UI state, handlers, and utils-file helpers are all fine)
- [ ]  If the component has non-trivial logic functions, are they in a `component-name.utils.ts` file in the same folder?
- [ ]  If a utils file exists, does it have a corresponding `.test.ts` file?
- [ ]  Does it use `var(--color-*)` instead of hardcoded hex values?
- [ ]  Does it have a named export?
- [ ]  Could it be copied into Venus or Pluto and work without any changes beyond the import path?
- [ ]  Does it have JSDoc on exported functions?
- [ ]  Does it have zero Chrome API calls (for utilities)?

If any answer is No — refactor before merging.

---

## Pattern Summary

| Pattern | Where | Why |
| --- | --- | --- |
| Content Script | `src/content/` | Only context with player DOM access |
| SPA Observer | `src/content/spa-observer.ts` | YouTube doesn't fire `popstate` reliably |
| Quality Clamping Pipeline | `src/content/player-controller.ts` | Never set unavailable quality levels |
| Resolution Detection | `src/utils/resolution.ts` | Account for HiDPI / Retina displays |
| Quality Map | `src/utils/quality-map.ts` | Pure, testable height → quality mapping |
| Storage Wrapper | `src/utils/storage.ts` | Centralise Chrome API + type safety |
| Popup Hook | `src/popup/hooks/` | Isolate Chrome APIs from React components |
| Message Passing | types + content + popup | Trigger re-apply from popup toggle |
| Graceful Degradation | All content script code | Never break the YouTube page |
| Component Modularity | All files in `src/utils/` and `src/popup/components/` | Every file is importable by other projects unchanged |