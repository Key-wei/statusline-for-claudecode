# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

statusline-for-claudecode is a Claude Code statusline plugin that displays a rich, configurable Git status dashboard. It's a stateless CLI tool: Claude Code pipes JSON context via stdin, the tool queries Git, and renders ANSI-formatted output to stdout.

## Build & Test Commands

```bash
npm run build        # Compile TypeScript (tsc) → dist/
npm run dev          # Watch mode (tsc --watch)
npm run test         # Pipe sample JSON stdin into dist/index.js
```

There is no test framework — the only test is the manual stdin pipe in `npm run test`. After any change, run `npm run build` to verify compilation succeeds.

## Architecture

**Data flow:** `stdin JSON → readStdin() → detectRepos() → queryGitStatus() → render() → stdout`

### Source layout (`src/`)

- **index.ts** — Entry point. Orchestrates the pipeline: read stdin → load config → detect repos → query git → render → write stdout.
- **stdin.ts** — Reads and parses the JSON that Claude Code pipes via stdin. Has a 1-second timeout for safety.
- **types.ts** — All TypeScript interfaces: `StdinData` (Claude Code input), `GitStatus`, `RepoInfo`, `DashboardConfig`.
- **config.ts** — Loads user config from `~/.claude/plugins/statusline-for-claudecode/config.json`, deep-merges with defaults. Respects `CLAUDE_CONFIG_DIR` env var.
- **repo-detector.ts** — Detects git repos: checks if cwd is a git repo, then scans one level of subdirectories for additional `.git` dirs (multi-repo/monorepo support).
- **git.ts** — Runs git commands via `execSync` with 5-second timeout. Queries branch, file stats (porcelain status), ahead/behind, today's commits, last commit.
- **utils.ts** — Small helpers: `truncate()`, `formatTime()`, `safeExec()`.

### Render modules (`src/render/`)

Each module renders one section of the dashboard output:
- **colors.ts** — ANSI escape codes, `c()` color wrapper, `SEP` separator (`│`), `progressBar()`.
- **context-line.ts** — Model name + context window progress bar.
- **git-line.ts** — Branch, file stats, ahead/behind. Handles single-repo (no prefix) vs multi-repo (name prefix) modes.
- **stats-line.ts** — Time, today's commit count, latest commit message.
- **index.ts** — Assembles module outputs into final multi-line string. Line 1 combines context + first git line; additional repos get their own lines; stats line goes last.

### Plugin metadata (`.claude-plugin/`)

- **plugin.json** — Plugin manifest for Claude Code plugin system.
- **marketplace.json** — Marketplace listing metadata.

### Slash commands (`commands/`)

- **setup.md** — `/statusline-for-claudecode:setup` — Configures the statusline in Claude Code's `settings.json`.
- **configure.md** — `/statusline-for-claudecode:configure` — Interactive config editor for module toggles and display options.

## Key Conventions

- All git commands use `--no-optional-locks` where applicable and have 5-second timeouts to avoid blocking Claude Code.
- Config uses deep merge — users only need to specify overridden fields, unset fields use defaults.
- The plugin handles non-git directories gracefully (shows only model + context info).
- Variable naming uses `snake_case` throughout the TypeScript source.
- No external runtime dependencies — only Node.js built-ins (`fs`, `path`, `os`, `child_process`).
