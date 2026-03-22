import type { QUALITY_ORDER } from '../utils/constants'

// ─── Settings ──────────────────────────────────────────────────────────────

/** Persisted extension settings stored in chrome.storage.local. */
export interface ExtensionSettings {
  /** Whether the extension is actively applying quality. */
  enabled: boolean
  /** Whether to show the active quality string as a badge on the toolbar icon. */
  showBadge: boolean
  /**
   * Manual quality override. null means auto — resolve from screen height.
   * When set, this quality is applied directly without screen detection.
   */
  manualQuality: QualityLevel | null
}

// ─── Messaging ─────────────────────────────────────────────────────────────

/** Typed message schema for inter-script communication. */
export type SaturnMessage =
  /**
   * APPLY_QUALITY — re-run the quality clamping pipeline on the active tab.
   * PING          — health-check that the content script is alive.
   */
  | { type: 'APPLY_QUALITY' | 'PING' }
  /**
   * SET_BADGE — update the toolbar badge for the sending tab.
   * show: false clears the badge; show: true writes the quality label.
   */
  | { type: 'SET_BADGE'; quality: QualityLevel; show: boolean }
  /** CLEAR_BADGE — remove the toolbar badge for the sending tab. */
  | { type: 'CLEAR_BADGE' }

// ─── YouTube Player ────────────────────────────────────────────────────────

/** Quality string as defined by the YouTube player API. */
export type QualityLevel = (typeof QUALITY_ORDER)[number]

/**
 * Minimal interface for the YouTube HTML5 player object.
 * Accessed by casting the `.html5-video-player` DOM element.
 * Only the methods Saturn actually calls are typed here — YouTube's full
 * internal API is undocumented and subject to change without notice.
 */
export interface YouTubePlayer {
  /**
   * Returns the quality levels available for the current video,
   * ordered highest to lowest. Must be called before setPlaybackQualityRange.
   */
  getAvailableQualityLevels(): QualityLevel[]

  /**
   * Sets the playback quality range. Pass the same value for both arguments
   * to lock to a single quality level.
   * Never use the deprecated setPlaybackQuality() — use this instead.
   */
  setPlaybackQualityRange(min: QualityLevel, max: QualityLevel): void

  /** Returns the quality level currently being played. */
  getPlaybackQuality(): QualityLevel
}
