# Pomodoro Timer & Version Check Design

**Date:** 2026-03-24
**Status:** Approved

## Overview

Two new features for statusline-for-claudecode:
1. **Pomodoro Timer** — A classic pomodoro clock displayed in the statusline
2. **Version Check + Update Command** — Automatic new-version detection with a one-command update flow

Both features maintain the project's zero-dependency, stateless-CLI architecture by persisting state to local JSON files.

---

## Feature 1: Pomodoro Timer

### Data Model

State file: `~/.claude/plugins/statusline-for-claudecode/pomodoro.json`

```json
{
  "phase": "work",
  "startedAt": 1711234567890,
  "duration": 1500000,
  "completedPomodoros": 2
}
```

Fields:
- `phase`: `"work"` | `"shortBreak"` | `"longBreak"` — only present when a session is active. File is deleted or empty when idle.
- `startedAt`: Epoch milliseconds when current phase started
- `duration`: Current phase length in milliseconds
- `completedPomodoros`: Count within current cycle (resets after longBreak)

**Idle state:** No file, or file does not exist. The canonical check for "is pomodoro active" is whether the file exists and parses successfully with a valid `phase` field.

**Error handling:**
- On JSON parse failure (corrupted file, partial write): treat as idle state, delete the file silently. Same pattern as `config.ts` which silently falls back to defaults.
- On negative remaining time (clock skew, NTP sync): treat as elapsed, auto-advance to next phase immediately.
- Concurrent writes from multiple Claude Code instances: last-write-wins. Each instance reads, computes, and writes atomically. Acceptable because the worst case is a skipped or repeated phase transition — not data corruption.

### Phase Rotation

```
work → shortBreak → work → shortBreak → work → shortBreak → work → longBreak → (reset count) → work → ...
```

After every 4th work phase completes, the next break is a longBreak. After longBreak, `completedPomodoros` resets to 0.

### State Management (`src/pomodoro.ts`)

Functions:
- `loadAndAdvancePomodoroState()` — Read JSON file, compute remaining time. If current phase has elapsed, auto-advance to next phase and save. Returns display-ready data or null if idle. **Called from `main()` in `index.ts`** (not from the render layer), consistent with the existing pattern where `main()` gathers all data before passing to `render()`.
- `savePomodoroState()` — Write state to JSON file.
- `startPomodoro()` — Write file with phase=work, record startedAt.
- `stopPomodoro()` — Delete the state file.
- `skipPhase()` — Advance to next phase immediately, update file.

**Important:** The auto-advance write side-effect happens in `main()` before rendering, not in the render layer. The render layer receives pure data and has no side effects.

### Data Flow

```
main() in index.ts:
  1. readStdin()
  2. loadConfig()
  3. detectRepos() → queryGitStatus()
  4. loadAndAdvancePomodoroState()    ← NEW (may write to file)
  5. checkForUpdate()                 ← NEW (async, may write cache)
  6. render({ data, config, repos, primaryGitStatus, pomodoroDisplay, versionInfo })
```

The `RenderInput` interface in `src/render/index.ts` gains two new optional fields:
```typescript
export interface RenderInput {
  data: StdinData;
  config: DashboardConfig;
  repos: { info: RepoInfo; status: GitStatus }[];
  primaryGitStatus: GitStatus | null;
  pomodoroDisplay: PomodoroDisplay | null;    // NEW
  versionInfo: VersionInfo | null;            // NEW
}
```

### Pomodoro Display Types (added to `src/types.ts`)

```typescript
export interface PomodoroDisplay {
  phase: 'work' | 'shortBreak' | 'longBreak';
  remainingMs: number;
  completedPomodoros: number;
  justCompleted: boolean;  // true if phase transitioned on this refresh
}
```

### Rendering (`src/render/pomodoro-segment.ts`)

Pure function: receives `PomodoroDisplay | null` and `DashboardConfig`, returns a string or null.

Display states:
- **Working:** `🍅 WORK 18:32` (red text, MM:SS countdown)
- **Short break:** `☕ REST 3:15` (green text)
- **Long break:** `☕ LONG REST 12:45` (green text)
- **Phase just completed:** `✅ DONE! 4/4 🍅` (yellow text)
- **Idle / module off:** Returns null (nothing rendered)

Integration: `render/index.ts` passes `pomodoroDisplay` to `renderStatsLine()`, which calls `renderPomodoroSegment()` and prepends the result to its parts array.

### Slash Command (`commands/pomodoro.md`)

Command: `/statusline-for-claudecode:pomodoro`
Allowed tools: `Read, Write, AskUserQuestion`

Interactive flow:
1. Read current pomodoro state file
2. Present options via AskUserQuestion: Start / Stop / Skip Phase / Status
3. Execute chosen action by writing/deleting the state file
4. Confirm result to user

Note: No `Bash` tool needed — this command only reads/writes a JSON file.

### Configuration

Added to `DashboardConfig`:

```json
{
  "modules": {
    "pomodoro": true
  },
  "pomodoro": {
    "workDuration": 25,
    "shortBreakDuration": 5,
    "longBreakDuration": 15,
    "longBreakInterval": 4
  }
}
```

All values in minutes. Defaults shown above (classic Pomodoro Technique).

---

## Feature 2: Version Check + Update Command

### Version Check (`src/version.ts`)

Mechanism:
1. Fetch latest tag from `https://api.github.com/repos/Key-wei/statusline-for-claudecode/tags`
2. Strip `v` prefix from tag name if present (e.g., `v0.2.0` → `0.2.0`)
3. Compare with local `package.json` version using simple string inequality (`!==`). No semver library needed — we use clean `MAJOR.MINOR.PATCH` tags.
4. Cache result to `~/.claude/plugins/statusline-for-claudecode/version-cache.json`

Cache file:
```json
{
  "checkedAt": 1711234567890,
  "latestVersion": "0.2.0",
  "currentVersion": "0.1.0"
}
```

Behavior:
- Cache TTL: 24 hours. Only fetch when cache is expired or missing.
- Network request timeout: 3 seconds.
- On failure (network error, parse error): silently return null, no impact on statusline.
- Uses Node.js built-in `https` module (no external dependencies).
- **This function is async** (HTTP request + file I/O). Called from `main()` in `index.ts` which is already async. The result is passed as pure data to the synchronous render pipeline.

Functions:
- `checkForUpdate(): Promise<VersionInfo | null>` — Async. Returns update info or null.
- `clearVersionCache()` — Deletes the cache file (used after update).

### Version Display Types (added to `src/types.ts`)

```typescript
export interface VersionInfo {
  hasUpdate: boolean;
  latestVersion: string;
}
```

### Statusline Display

When a newer version is available, append to the stats line:
```
⬆ v0.2.0 available
```

When no update or check failed: nothing displayed.

Integration: `render/index.ts` passes `versionInfo` to `renderStatsLine()`. The stats line renderer appends the version segment at the end of its parts array if `hasUpdate` is true.

### Configuration

```json
{
  "modules": {
    "versionCheck": true
  }
}
```

### Update Command (`commands/update.md`)

Command: `/statusline-for-claudecode:update`
Allowed tools: `Bash, Read, Write`

Execution flow:
1. Detect plugin install path (directory containing this repo's files)
2. Run `git pull origin main` in the plugin directory
3. Run `npm install` (in case new dependencies were added)
4. Run `npm run build`
5. Clear version cache file
6. Inform user to restart Claude Code for changes to take effect

---

## New Files Summary

| File | Purpose |
|------|---------|
| `src/pomodoro.ts` | Pomodoro state management (load/save/start/stop/skip) |
| `src/version.ts` | Async version check against GitHub API with local cache |
| `src/render/pomodoro-segment.ts` | Pure render function for pomodoro countdown segment |
| `commands/pomodoro.md` | Slash command for pomodoro start/stop/skip/status |
| `commands/update.md` | Slash command for self-update |

## Modified Files Summary

| File | Changes |
|------|---------|
| `src/types.ts` | Add `PomodoroDisplay`, `VersionInfo`, extend `DashboardConfig` with pomodoro and versionCheck |
| `src/config.ts` | Add pomodoro and versionCheck module defaults |
| `src/index.ts` | Call `loadAndAdvancePomodoroState()` and `checkForUpdate()` in `main()`, pass results to `render()` |
| `src/render/index.ts` | Extend `RenderInput` with `pomodoroDisplay` and `versionInfo`, pass them to `renderStatsLine()` |
| `src/render/stats-line.ts` | Accept pomodoro and version data as parameters, integrate segments |
| `.claude-plugin/plugin.json` | Register new commands (pomodoro, update) |
