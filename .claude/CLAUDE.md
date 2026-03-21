# Saturn — Claude Code Instructions

## What this project is
A Chrome Manifest V3 extension that automatically sets YouTube video quality
to the highest resolution supported by the user's monitor.
No manual switching. No API keys. No external network requests.

## Read these files before writing any code
1. `.claude/project-structure.md` — full folder tree and file responsibilities
2. `.claude/engineering-guidelines.md` — TypeScript, naming, git, security
3. `.claude/design-patterns.md` — all architectural patterns with code examples
4. `.claude/design-system.md` — colours, typography, tokens, popup UI rules

Then read:
5. `src/types/index.ts` — all TypeScript types
6. `src/utils/constants.ts` — **read this first** — all configurable values and keys live here
7. `src/utils/storage.ts` — how settings persistence works
8. `src/utils/quality-map.ts` — resolution to quality string logic

## Project structure
- `src/background/` — Chrome Service Worker (stateless, no player access)
- `src/content/` — Content scripts injected into YouTube pages (player API lives here)
- `src/popup/` — React 18 popup UI (320px fixed width)
- `src/utils/` — Shared pure utilities (zero Chrome API calls — fully testable)
- `src/types/` — All TypeScript types

## Non-negotiable rules
- Never use `any` in TypeScript
- Never use `localStorage` — all persistence via `chrome.storage.local` through `src/utils/storage.ts`
- Never make external network requests from any part of the extension
- Never access the YouTube player API from background or popup — content script only
- Always call `getAvailableQualityLevels()` before `setPlaybackQualityRange()`
- Always wrap player API calls in try/catch — YouTube can silently break them
- Never throw from content scripts — log with [Saturn] prefix and bail gracefully
- Never hardcode hex colour values — use CSS custom properties
- Never define a magic number or magic string inline — all constants go in `src/utils/constants.ts`
- Never commit directly to `main`
- All commits follow Conventional Commits format
- Run `bun run typecheck` before considering any task done
- Run `bun test` before considering any task done

## Design system
- Font: Inter (Google Fonts)
- Mono: JetBrains Mono (resolution readouts only)
- Design tokens: `src/utils/tokens.ts` — never hardcode colours or sizes
- Popup width: 320px — Chrome popup constraint, never change this
- All colours via CSS custom properties — no inline hex values in components

## Adding a new quality tier
1. Add quality string to `QUALITY_ORDER` in `src/utils/quality-map.ts`
2. Update resolution threshold in `resolveTargetQuality()`
3. Add test cases in `quality-map.test.ts`
4. Update the quality tier table in `.claude/design-system.md`

## Handling YouTube player API changes
If YouTube updates break the player object:
1. Check if `.html5-video-player` still exists in the DOM
2. Check if `player.getAvailableQualityLevels` is still a function
3. Log a descriptive warning with `[Saturn]` prefix and exit — never throw
4. Open a GitHub issue documenting exactly what broke and what YouTube changed

## Commit format
`<type>(<scope>): <description>`
Types: feat, fix, chore, refactor, test, docs
Scopes: content, popup, background, utils, types
Examples:
  feat(content): add SPA navigation observer
  feat(popup): build status pill component
  fix(content): handle player not ready after YouTube update
  chore(root): bump Bun and rebuild lockfile
  refactor(utils): split resolution and quality map into separate files

## Project management
- Notion: https://www.notion.so/329c946c2801816592d3dfda38964ede
- Engineering Guidelines: https://www.notion.so/329c946c280181949c2ec57727bd5b41