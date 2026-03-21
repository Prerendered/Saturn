import { describe, expect, it, beforeEach } from 'bun:test'
import { getSettings, saveSettings } from './storage'

// ── chrome.storage.local mock ───────────────────────────────────────────────

const store: Record<string, unknown> = {}

function mockChrome(): void {
  Object.defineProperty(globalThis, 'chrome', {
    value: {
      storage: {
        local: {
          get: async (key: string) => {
            return { [key]: store[key] }
          },
          set: async (obj: Record<string, unknown>) => {
            Object.assign(store, obj)
          },
        },
      },
    },
    configurable: true,
    writable: true,
  })
}

beforeEach(() => {
  // Reset store and re-install mock before each test
  for (const key of Object.keys(store)) {
    delete store[key]
  }
  mockChrome()
})

// ── getSettings ─────────────────────────────────────────────────────────────

describe('getSettings', () => {
  it('returns full defaults on a fresh install (nothing in storage)', async () => {
    const settings = await getSettings()
    expect(settings.enabled).toBe(true)
    expect(settings.showBadge).toBe(true)
  })

  it('merges stored partial value with defaults', async () => {
    store['settings'] = { enabled: false }
    const settings = await getSettings()
    expect(settings.enabled).toBe(false)
    expect(settings.showBadge).toBe(true) // default preserved
  })

  it('returns stored values when all keys are present', async () => {
    store['settings'] = { enabled: false, showBadge: false }
    const settings = await getSettings()
    expect(settings.enabled).toBe(false)
    expect(settings.showBadge).toBe(false)
  })
})

// ── saveSettings ─────────────────────────────────────────────────────────────

describe('saveSettings', () => {
  it('persists settings that are then returned by getSettings', async () => {
    await saveSettings({ enabled: false, showBadge: false, manualQuality: null })
    const settings = await getSettings()
    expect(settings.enabled).toBe(false)
    expect(settings.showBadge).toBe(false)
  })
})
