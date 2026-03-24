# Pomodoro Timer & Version Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pomodoro timer display and automatic version-check notification to the statusline-for-claudecode plugin.

**Architecture:** Both features follow the existing data-flow pattern: `main()` gathers data (pomodoro state from a local JSON file, version info from a cached GitHub API call), then passes pure data into the synchronous render pipeline. No external dependencies — uses only Node.js built-ins.

**Tech Stack:** TypeScript, Node.js built-in `fs`/`path`/`os`/`https`/`child_process` modules.

**Spec:** `docs/superpowers/specs/2026-03-24-pomodoro-and-version-check-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|----------------|
| `src/pomodoro.ts` | Pomodoro state file I/O, phase auto-advance logic, start/stop/skip actions |
| `src/version.ts` | Async GitHub tags fetch, local cache read/write, version comparison |
| `src/render/pomodoro-segment.ts` | Pure function: PomodoroDisplay → ANSI string segment |
| `commands/pomodoro.md` | Slash command definition for `/statusline-for-claudecode:pomodoro` |
| `commands/update.md` | Slash command definition for `/statusline-for-claudecode:update` |

### Modified Files

| File | What Changes |
|------|-------------|
| `src/types.ts` | Add `PomodoroState`, `PomodoroDisplay`, `VersionInfo` interfaces; extend `DashboardConfig.modules` and add `pomodoro` config section |
| `src/config.ts` | Add pomodoro and versionCheck defaults to `DEFAULT_CONFIG`; export `getPluginDataDir()` for shared state file paths |
| `src/index.ts` | Call `loadAndAdvancePomodoroState()` and `checkForUpdate()` in `main()`; pass results to `render()` |
| `src/render/index.ts` | Extend `RenderInput` with `pomodoroDisplay` and `versionInfo`; pass them to `renderStatsLine()` |
| `src/render/stats-line.ts` | Accept and render pomodoro segment (prepend) and version indicator (append) |
| `.claude-plugin/plugin.json` | Register new commands |

---

## Task 1: Extend Types

**Files:**
- Modify: `src/types.ts:59-81`

- [ ] **Step 1: Add pomodoro and version types after the RepoInfo block**

Append the following after line 57 (`}` closing `RepoInfo`) and before the `// ── Config ──` comment at line 59:

```typescript
// ── Pomodoro ──

export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak';

export interface PomodoroState {
  phase: PomodoroPhase;
  startedAt: number;
  duration: number;
  completedPomodoros: number;
}

export interface PomodoroDisplay {
  phase: PomodoroPhase;
  remainingMs: number;
  completedPomodoros: number;
  justCompleted: boolean;
}

// ── Version ──

export interface VersionInfo {
  hasUpdate: boolean;
  latestVersion: string;
}
```

- [ ] **Step 2: Extend DashboardConfig**

In the `DashboardConfig` interface, add `pomodoro` and `versionCheck` to modules, and add the `pomodoro` config section. The full interface becomes:

```typescript
export interface DashboardConfig {
  modules: {
    context: boolean;
    git: boolean;
    stats: boolean;
    subRepos: boolean;
    pomodoro: boolean;
    versionCheck: boolean;
  };
  git: {
    showFileStats: boolean;
    showAheadBehind: boolean;
  };
  stats: {
    showTime: boolean;
    showTodayCommits: boolean;
    showLastCommit: boolean;
    lastCommitMaxLen: number;
  };
  contextBar: {
    length: number;
  };
  pomodoro: {
    workDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    longBreakInterval: number;
  };
}
```

- [ ] **Step 3: Build to verify compilation**

Run: `npm run build`
Expected: Compilation fails — `config.ts` DEFAULT_CONFIG doesn't have the new fields yet. That's expected and will be fixed in Task 2.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts
git commit -m "feat: add pomodoro and version check types to DashboardConfig"
```

---

## Task 2: Extend Config Defaults

**Files:**
- Modify: `src/config.ts:6-26` (DEFAULT_CONFIG) and add `getPluginDataDir()` export

- [ ] **Step 1: Add new defaults to DEFAULT_CONFIG**

Add `pomodoro: true` and `versionCheck: true` to `modules`, and add the `pomodoro` config section:

```typescript
const DEFAULT_CONFIG: DashboardConfig = {
  modules: {
    context: true,
    git: true,
    stats: true,
    subRepos: true,
    pomodoro: true,
    versionCheck: true,
  },
  git: {
    showFileStats: true,
    showAheadBehind: true,
  },
  stats: {
    showTime: true,
    showTodayCommits: true,
    showLastCommit: true,
    lastCommitMaxLen: 40,
  },
  contextBar: {
    length: 10,
  },
  pomodoro: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
  },
};
```

- [ ] **Step 2: Export getPluginDataDir()**

Add a new exported function after `getConfigPath()` (line 44). This provides a shared base path for pomodoro.json and version-cache.json:

```typescript
export function getPluginDataDir(): string {
  return path.join(getConfigDir(), 'plugins', 'statusline-for-claudecode');
}
```

Also update `getConfigPath()` to reuse it:

```typescript
function getConfigPath(): string {
  return path.join(getPluginDataDir(), 'config.json');
}
```

- [ ] **Step 3: Build to verify compilation**

Run: `npm run build`
Expected: SUCCESS — types and config are now aligned.

- [ ] **Step 4: Test manually**

Run: `echo '{"model":{"display_name":"Opus"},"context_window":{"used_percentage":35},"cwd":"."}' | node dist/index.js`
Expected: Same output as before — no visible change yet.

- [ ] **Step 5: Commit**

```bash
git add src/config.ts
git commit -m "feat: add pomodoro and versionCheck config defaults, export getPluginDataDir"
```

---

## Task 3: Implement Pomodoro State Management

**Files:**
- Create: `src/pomodoro.ts`

- [ ] **Step 1: Create `src/pomodoro.ts`**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { PomodoroState, PomodoroDisplay, PomodoroPhase, DashboardConfig } from './types';
import { getPluginDataDir } from './config';

function getStatePath(): string {
  return path.join(getPluginDataDir(), 'pomodoro.json');
}

function readState(): PomodoroState | null {
  const state_path = getStatePath();
  if (!fs.existsSync(state_path)) return null;

  try {
    const raw = fs.readFileSync(state_path, 'utf8');
    const state = JSON.parse(raw) as PomodoroState;
    // Validate required fields
    if (!state.phase || !state.startedAt || !state.duration) {
      fs.unlinkSync(state_path);
      return null;
    }
    return state;
  } catch {
    // Corrupted file — delete and treat as idle
    try { fs.unlinkSync(state_path); } catch { /* ignore */ }
    return null;
  }
}

function writeState(state: PomodoroState): void {
  const dir = path.dirname(getStatePath());
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(getStatePath(), JSON.stringify(state, null, 2), 'utf8');
}

function getNextPhase(state: PomodoroState, config: DashboardConfig): { phase: PomodoroPhase; duration: number; completedPomodoros: number } {
  if (state.phase === 'work') {
    const completed = state.completedPomodoros + 1;
    if (completed >= config.pomodoro.longBreakInterval) {
      return {
        phase: 'longBreak',
        duration: config.pomodoro.longBreakDuration * 60 * 1000,
        completedPomodoros: completed,
      };
    }
    return {
      phase: 'shortBreak',
      duration: config.pomodoro.shortBreakDuration * 60 * 1000,
      completedPomodoros: completed,
    };
  }
  // After any break → work
  const reset = state.phase === 'longBreak' ? 0 : state.completedPomodoros;
  return {
    phase: 'work',
    duration: config.pomodoro.workDuration * 60 * 1000,
    completedPomodoros: reset,
  };
}

/**
 * Load pomodoro state, auto-advance if phase elapsed.
 * Called from main() — may write to file as a side effect.
 * Returns display-ready data or null if idle.
 */
export function loadAndAdvancePomodoroState(config: DashboardConfig): PomodoroDisplay | null {
  if (!config.modules.pomodoro) return null;

  const state = readState();
  if (!state) return null;

  const elapsed = Date.now() - state.startedAt;
  const remaining = state.duration - elapsed;

  if (remaining <= 0) {
    // Phase elapsed — advance to next
    const next = getNextPhase(state, config);
    const new_state: PomodoroState = {
      phase: next.phase,
      startedAt: Date.now(),
      duration: next.duration,
      completedPomodoros: next.completedPomodoros,
    };
    writeState(new_state);
    return {
      phase: state.phase,
      remainingMs: 0,
      completedPomodoros: next.completedPomodoros,
      justCompleted: true,
    };
  }

  return {
    phase: state.phase,
    remainingMs: remaining,
    completedPomodoros: state.completedPomodoros,
    justCompleted: false,
  };
}

/** Start a new pomodoro work session. */
export function startPomodoro(config: DashboardConfig): void {
  const state: PomodoroState = {
    phase: 'work',
    startedAt: Date.now(),
    duration: config.pomodoro.workDuration * 60 * 1000,
    completedPomodoros: 0,
  };
  writeState(state);
}

/** Stop the current pomodoro session. */
export function stopPomodoro(): void {
  try { fs.unlinkSync(getStatePath()); } catch { /* ignore */ }
}

/** Skip current phase, advance to next. */
export function skipPhase(config: DashboardConfig): PomodoroPhase | null {
  const state = readState();
  if (!state) return null;

  const next = getNextPhase(state, config);
  const new_state: PomodoroState = {
    phase: next.phase,
    startedAt: Date.now(),
    duration: next.duration,
    completedPomodoros: next.completedPomodoros,
  };
  writeState(new_state);
  return next.phase;
}
```

- [ ] **Step 2: Build to verify compilation**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 3: Commit**

```bash
git add src/pomodoro.ts
git commit -m "feat: implement pomodoro state management with auto-advance"
```

---

## Task 4: Implement Pomodoro Renderer

**Files:**
- Create: `src/render/pomodoro-segment.ts`

- [ ] **Step 1: Create `src/render/pomodoro-segment.ts`**

```typescript
import { PomodoroDisplay, DashboardConfig } from '../types';
import { c, colors } from './colors';

function formatCountdown(ms: number): string {
  const total_seconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total_seconds / 60);
  const seconds = total_seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Render pomodoro segment for the stats line.
 * Returns a string segment or null if idle/disabled.
 */
export function renderPomodoroSegment(
  display: PomodoroDisplay | null,
  config: DashboardConfig,
): string | null {
  if (!display) return null;

  if (display.justCompleted) {
    const count = display.completedPomodoros;
    return `${c(colors.brightYellow, '✅ DONE!')} ${c(colors.yellow, `${count}/${config.pomodoro.longBreakInterval} 🍅`)}`;  }

  const countdown = formatCountdown(display.remainingMs);

  switch (display.phase) {
    case 'work':
      return `${c(colors.red, '🍅 WORK')} ${c(colors.brightRed, countdown)}`;
    case 'shortBreak':
      return `${c(colors.green, '☕ REST')} ${c(colors.brightGreen, countdown)}`;
    case 'longBreak':
      return `${c(colors.green, '☕ LONG REST')} ${c(colors.brightGreen, countdown)}`;
    default:
      return null;
  }
}
```

- [ ] **Step 2: Build to verify compilation**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 3: Commit**

```bash
git add src/render/pomodoro-segment.ts
git commit -m "feat: add pomodoro countdown renderer"
```

---

## Task 5: Implement Version Check

**Files:**
- Create: `src/version.ts`

- [ ] **Step 1: Create `src/version.ts`**

```typescript
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { VersionInfo } from './types';
import { getPluginDataDir } from './config';

const GITHUB_TAGS_URL = 'https://api.github.com/repos/Key-wei/statusline-for-claudecode/tags';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const REQUEST_TIMEOUT_MS = 3000;

interface VersionCache {
  checkedAt: number;
  latestVersion: string;
  currentVersion: string;
}

function getCachePath(): string {
  return path.join(getPluginDataDir(), 'version-cache.json');
}

function getCurrentVersion(): string {
  try {
    const pkg_path = path.join(__dirname, '..', 'package.json');
    const raw = fs.readFileSync(pkg_path, 'utf8');
    return JSON.parse(raw).version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function readCache(): VersionCache | null {
  try {
    const raw = fs.readFileSync(getCachePath(), 'utf8');
    return JSON.parse(raw) as VersionCache;
  } catch {
    return null;
  }
}

function writeCache(cache: VersionCache): void {
  const dir = path.dirname(getCachePath());
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(getCachePath(), JSON.stringify(cache, null, 2), 'utf8');
}

function fetchLatestTag(): Promise<string | null> {
  return new Promise((resolve) => {
    const req = https.get(GITHUB_TAGS_URL, {
      headers: { 'User-Agent': 'statusline-for-claudecode' },
      timeout: REQUEST_TIMEOUT_MS,
    }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        resolve(null);
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString('utf8');
          const tags = JSON.parse(body);
          if (Array.isArray(tags) && tags.length > 0 && tags[0].name) {
            const tag_name: string = tags[0].name;
            // Strip 'v' prefix if present
            resolve(tag_name.startsWith('v') ? tag_name.slice(1) : tag_name);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
      res.on('error', () => resolve(null));
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

/**
 * Check for updates. Uses cache to avoid frequent network requests.
 * Returns version info or null on failure.
 */
export async function checkForUpdate(enabled: boolean): Promise<VersionInfo | null> {
  if (!enabled) return null;

  const current_version = getCurrentVersion();
  const cache = readCache();

  // Use cache if still fresh and current version matches
  if (cache && cache.currentVersion === current_version) {
    const age = Date.now() - cache.checkedAt;
    if (age < CACHE_TTL_MS) {
      return {
        hasUpdate: cache.latestVersion !== current_version,
        latestVersion: cache.latestVersion,
      };
    }
  }

  // Fetch from GitHub
  const latest = await fetchLatestTag();
  if (!latest) return null;

  // Update cache
  const new_cache: VersionCache = {
    checkedAt: Date.now(),
    latestVersion: latest,
    currentVersion: current_version,
  };
  try { writeCache(new_cache); } catch { /* ignore */ }

  return {
    hasUpdate: latest !== current_version,
    latestVersion: latest,
  };
}

/** Clear the version cache file. */
export function clearVersionCache(): void {
  try { fs.unlinkSync(getCachePath()); } catch { /* ignore */ }
}
```

- [ ] **Step 2: Build to verify compilation**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 3: Commit**

```bash
git add src/version.ts
git commit -m "feat: implement version check with GitHub API and local cache"
```

---

## Task 6: Wire into Render Pipeline

**Files:**
- Modify: `src/render/index.ts` (entire file)
- Modify: `src/render/stats-line.ts:1-41`

- [ ] **Step 1: Update `src/render/index.ts`**

Replace the `RenderInput` interface and `render()` function to pass new data through:

```typescript
import { StdinData, DashboardConfig, GitStatus, RepoInfo, PomodoroDisplay, VersionInfo } from '../types';
import { renderContextLine } from './context-line';
import { renderGitLines } from './git-line';
import { renderStatsLine } from './stats-line';

export interface RenderInput {
  data: StdinData;
  config: DashboardConfig;
  repos: { info: RepoInfo; status: GitStatus }[];
  primaryGitStatus: GitStatus | null;
  pomodoroDisplay: PomodoroDisplay | null;
  versionInfo: VersionInfo | null;
}

/**
 * Assemble all module outputs into final lines for stdout.
 */
export function render(input: RenderInput): string {
  const { data, config, repos, primaryGitStatus, pomodoroDisplay, versionInfo } = input;
  const lines: string[] = [];

  // Line 1 parts: context + git (combined on one line for compact display)
  const context_part = renderContextLine(data, config);
  const git_lines = renderGitLines(repos, config);

  if (context_part && git_lines.length > 0) {
    // Combine context and first git line on line 1
    const { SEP } = require('./colors');
    lines.push(context_part + SEP + git_lines[0]);
    // Additional git lines (multi-repo) go on separate lines
    for (let i = 1; i < git_lines.length; i++) {
      lines.push(git_lines[i]);
    }
  } else if (context_part) {
    lines.push(context_part);
  } else if (git_lines.length > 0) {
    lines.push(...git_lines);
  }

  // Stats line (now includes pomodoro and version info)
  const stats_line = renderStatsLine(primaryGitStatus, config, pomodoroDisplay, versionInfo);
  if (stats_line) {
    lines.push(stats_line);
  }

  return lines.join('\n');
}
```

- [ ] **Step 2: Update `src/render/stats-line.ts`**

Add pomodoro segment at the start and version indicator at the end:

```typescript
import { GitStatus, DashboardConfig, PomodoroDisplay, VersionInfo } from '../types';
import { c, colors, SEP } from './colors';
import { formatTime, truncate } from '../utils';
import { renderPomodoroSegment } from './pomodoro-segment';

/**
 * Render the stats line.
 * Example: 🍅 WORK 18:32 │ ⏱ 16:56 │ 📝 Today 5 commits │ Latest: fix: xxx... (3 min ago) │ ⬆ v0.2.0 available
 */
export function renderStatsLine(
  git_status: GitStatus | null,
  config: DashboardConfig,
  pomodoro_display: PomodoroDisplay | null = null,
  version_info: VersionInfo | null = null,
): string | null {
  if (!config.modules.stats) return null;

  const parts: string[] = [];

  // Pomodoro segment (prepend)
  const pomodoro_part = renderPomodoroSegment(pomodoro_display, config);
  if (pomodoro_part) {
    parts.push(pomodoro_part);
  }

  // Current time
  if (config.stats.showTime) {
    parts.push(`${c(colors.dim, '⏱')} ${c(colors.white, formatTime())}`);
  }

  if (git_status) {
    // Today's commits
    if (config.stats.showTodayCommits) {
      const count = git_status.todayCommits;
      const count_color = count > 0 ? colors.brightGreen : colors.gray;
      parts.push(`${c(colors.dim, '📝')} ${c(count_color, `Today ${count} commits`)}`);
    }

    // Last commit
    if (config.stats.showLastCommit && git_status.lastCommit) {
      const subject = truncate(git_status.lastCommit.subject, config.stats.lastCommitMaxLen);
      const time_ago = git_status.lastCommit.relativeTime;
      parts.push(
        `${c(colors.dim, 'Latest:')} ${c(colors.white, subject)} ${c(colors.gray, `(${time_ago})`)}`,
      );
    }
  }

  // Version update indicator (append)
  if (version_info && version_info.hasUpdate) {
    parts.push(`${c(colors.brightCyan, '⬆')} ${c(colors.cyan, `v${version_info.latestVersion} available`)}`);
  }

  return parts.length > 0 ? parts.join(SEP) : null;
}
```

- [ ] **Step 3: Build to verify compilation**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 4: Commit**

```bash
git add src/render/index.ts src/render/stats-line.ts
git commit -m "feat: wire pomodoro and version info into render pipeline"
```

---

## Task 7: Wire into Main Entry Point

**Files:**
- Modify: `src/index.ts` (entire file)

- [ ] **Step 1: Update `src/index.ts`**

Add imports and calls for pomodoro and version check:

```typescript
import { readStdin } from './stdin';
import { loadConfig } from './config';
import { queryGitStatus } from './git';
import { detectRepos } from './repo-detector';
import { render } from './render';
import { GitStatus, RepoInfo } from './types';
import { loadAndAdvancePomodoroState } from './pomodoro';
import { checkForUpdate } from './version';

async function main(): Promise<void> {
  const data = await readStdin();

  if (!data) {
    process.stdout.write('[statusline-for-claudecode] Initializing...\n');
    return;
  }

  const config = loadConfig();
  const cwd = data.cwd || process.cwd();

  // Detect repos
  const all_repos = detectRepos(cwd);

  // Query git status for each repo
  const repos: { info: RepoInfo; status: GitStatus }[] = [];
  let primary_git_status: GitStatus | null = null;

  for (const repo of all_repos) {
    const status = queryGitStatus(repo.path);
    if (status) {
      repos.push({ info: repo, status });
      if (!primary_git_status) {
        primary_git_status = status;
      }
    }
  }

  // Filter sub-repos if disabled
  if (!config.modules.subRepos && repos.length > 1) {
    repos.splice(1);
  }

  // Load pomodoro state (may auto-advance and write file)
  const pomodoro_display = loadAndAdvancePomodoroState(config);

  // Check for updates (async, cached)
  const version_info = await checkForUpdate(config.modules.versionCheck);

  const output = render({
    data,
    config,
    repos,
    primaryGitStatus: primary_git_status,
    pomodoroDisplay: pomodoro_display,
    versionInfo: version_info,
  });

  if (output) {
    process.stdout.write(output + '\n');
  }
}

main().catch(() => {
  process.stdout.write('[statusline-for-claudecode] Error\n');
});
```

- [ ] **Step 2: Build and test**

Run: `npm run build`
Expected: SUCCESS

Run: `echo '{"model":{"display_name":"Opus"},"context_window":{"used_percentage":35},"cwd":"."}' | node dist/index.js`
Expected: Same output as before (no active pomodoro, version check may or may not show depending on network). No errors.

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: integrate pomodoro and version check into main pipeline"
```

---

## Task 8: Create Slash Commands

**Files:**
- Create: `commands/pomodoro.md`
- Create: `commands/update.md`
- Modify: `.claude-plugin/plugin.json:12-15`

- [ ] **Step 1: Create `commands/pomodoro.md`**

```markdown
---
description: Start, stop, or manage the pomodoro timer
allowed-tools: Read, Write, AskUserQuestion
---

# Pomodoro Timer

Manage the built-in pomodoro timer for statusline-for-claudecode.

## What to do

1. Find the state file location:
   - Check `CLAUDE_CONFIG_DIR` env var, otherwise `~/.claude` or `~/.claude-internal`
   - State path: `{config_dir}/plugins/statusline-for-claudecode/pomodoro.json`

2. Read the current state file (if it exists) to determine current status

3. Ask the user what they'd like to do via AskUserQuestion:
   - **Start** — Begin a new pomodoro work session (25 min default)
   - **Stop** — End the current session
   - **Skip** — Skip to the next phase (e.g., skip break to start working)
   - **Status** — Show current timer state

4. Execute the chosen action:
   - **Start:** Write a new state file:
     ```json
     {
       "phase": "work",
       "startedAt": <Date.now()>,
       "duration": 1500000,
       "completedPomodoros": 0
     }
     ```
   - **Stop:** Delete the state file
   - **Skip:** Read current state, compute next phase, write updated state with new startedAt
   - **Status:** Read and display current phase, remaining time, completed count

5. Confirm the action to the user

## Phase rotation

- work (25 min) → shortBreak (5 min) → work → shortBreak → work → shortBreak → work → longBreak (15 min) → reset count → work → ...
- Every 4th work session triggers a long break

## Example output

```
🍅 Pomodoro started! 25 minutes of focus time.
Current status will appear in your statusline on next refresh.

💡 Tip: Use /statusline-for-claudecode:pomodoro again to stop or skip phases.
```
```

- [ ] **Step 2: Create `commands/update.md`**

```markdown
---
description: Update statusline-for-claudecode to the latest version
allowed-tools: Bash, Read, Write
---

# Update Plugin

Update statusline-for-claudecode to the latest version from GitHub.

## What to do

1. Determine the plugin install directory:
   - This is the directory containing the `package.json` with `"name": "statusline-for-claudecode"`
   - Common location: `~/.claude/plugins/statusline-for-claudecode/` or `~/.claude-internal/plugins/statusline-for-claudecode/`
   - You can also check where `dist/index.js` is located relative to the current command

2. Run the update commands in the plugin directory:
   ```bash
   cd <plugin_dir>
   git pull origin main
   npm install
   npm run build
   ```

3. Clear the version cache:
   - Delete `{config_dir}/plugins/statusline-for-claudecode/version-cache.json` if it exists

4. Report the result to the user

## Example output

```
⬆️ Updating statusline-for-claudecode...

✅ Updated successfully!
  Previous: v0.1.0
  Current:  v0.2.0

Restart Claude Code for changes to take effect.
```

## Error handling

- If `git pull` fails (network error, merge conflict): report the error and suggest manual update
- If `npm run build` fails: report the TypeScript compilation error
```

- [ ] **Step 3: Register commands in plugin.json**

Update `.claude-plugin/plugin.json` commands array to include the new commands:

```json
{
  "commands": [
    "./commands/setup.md",
    "./commands/configure.md",
    "./commands/pomodoro.md",
    "./commands/update.md"
  ]
}
```

- [ ] **Step 4: Build to verify nothing broke**

Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 5: Commit**

```bash
git add commands/pomodoro.md commands/update.md .claude-plugin/plugin.json
git commit -m "feat: add pomodoro and update slash commands"
```

---

## Task 9: Final Integration Test

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: SUCCESS, no errors, no warnings.

- [ ] **Step 2: Test normal output (no pomodoro active)**

Run: `echo '{"model":{"display_name":"Opus"},"context_window":{"used_percentage":35},"cwd":"."}' | node dist/index.js`
Expected: Normal two-line output with model, context bar, git status, stats. No pomodoro segment visible.

- [ ] **Step 3: Test with pomodoro active**

Create a test pomodoro state file and run:

```bash
mkdir -p ~/.claude/plugins/statusline-for-claudecode
echo '{"phase":"work","startedAt":'$(date +%s)000',"duration":1500000,"completedPomodoros":1}' > ~/.claude/plugins/statusline-for-claudecode/pomodoro.json
echo '{"model":{"display_name":"Opus"},"context_window":{"used_percentage":35},"cwd":"."}' | node dist/index.js
```

Expected: Stats line starts with `🍅 WORK MM:SS` followed by the usual time/commit info.

- [ ] **Step 4: Clean up test state**

```bash
rm -f ~/.claude/plugins/statusline-for-claudecode/pomodoro.json
rm -f ~/.claude/plugins/statusline-for-claudecode/version-cache.json
```

- [ ] **Step 5: Final commit if any fixes were needed**

Only if adjustments were made during testing:
```bash
git add -A
git commit -m "fix: integration test adjustments"
```
