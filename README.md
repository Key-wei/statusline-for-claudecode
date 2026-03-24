# statusline-for-claudecode

**[English](README.md)** | **[中文](README.zh-CN.md)** | **[日本語](README.ja.md)** | **[한국어](README.ko.md)** | **[Español](README.es.md)**

Universal repository status dashboard for [Claude Code](https://claude.ai/code) statusline.

Automatically detects your project's Git structure (single repo or multiple sub-repos) and displays a rich, configurable status dashboard directly in your Claude Code session.

## Preview

```
Opus │ ████░░░░░░ 35% │ Branch:master │ ~3 +1 -0 │ ↑2 ↓0
⏱ 16:56 │ 📝 Today 5 commits │ Latest: fix: update login flow... (3 min ago)
```

Multi-repo mode (auto-detected):
```
Opus │ ████░░░░░░ 35% │ AClient │ Branch:master │ ~0 +0 -0 │ ↑0 ↓0
Source │ Branch:dev │ ~3 +1 -0 │ ↑2 ↓0
⏱ 16:56 │ 📝 Today 5 commits │ Latest: fix: update login flow... (3 min ago)
```

Pomodoro mode:
```
Opus │ ████░░░░░░ 35% │ Branch:master │ ~3 +1 -0 │ ↑2 ↓0
🍅 WORK 18:32 │ ⏱ 16:56 │ 📝 Today 5 commits │ Latest: fix: update login flow... (3 min ago)
```

## Installation

**Step 1:** Add the marketplace
```
/plugin marketplace add Key-wei/statusline-for-claudecode
```

**Step 2:** Install the plugin
```
/plugin install statusline-for-claudecode
```

**Step 3:** Configure the statusline
```
/statusline-for-claudecode:setup
```

## Features

| Module | Default | Description |
|--------|---------|-------------|
| `context` | ✅ on | Model name + context window progress bar |
| `git` | ✅ on | Branch, file changes (modified/added/deleted), ahead/behind |
| `stats` | ✅ on | Current time, today's commit count, latest commit message |
| `subRepos` | ✅ on | Auto-detect and display sub-repositories |
| `pomodoro` | ✅ on | Built-in Pomodoro timer (25min work / 5min break) |
| `versionCheck` | ✅ on | Auto-detect new versions and show update prompt |

### Auto-detection

- If your working directory is a git repo → single-repo mode
- If subdirectories contain `.git` → multi-repo mode (e.g., monorepo with submodules)
- Non-git directories → graceful degradation (only shows model + context)

## Pomodoro Timer

Built-in Pomodoro technique timer displayed in the statusline.

Start a pomodoro session:
```
/statusline-for-claudecode:pomodoro
```

| Phase | Duration | Display |
|-------|----------|---------|
| Work | 25 min | 🍅 WORK 24:59 |
| Short Break | 5 min | ☕ REST 4:59 |
| Long Break | 15 min | ☕ LONG REST 14:59 |

Cycle: work → short break → work → short break → work → short break → work → **long break** → repeat

After every 4th work session, you get a 15-minute long break. All durations are configurable.

## Update

The plugin automatically checks for new versions once per day and displays a notification in the statusline:
```
⬆ v0.2.0 available
```

To update:
```
/statusline-for-claudecode:update
```

## Configuration

Customize the display with `/statusline-for-claudecode:configure` or edit the config file directly:

**Config location:** `~/.claude/plugins/statusline-for-claudecode/config.json`

```json
{
  "modules": {
    "context": true,
    "git": true,
    "stats": true,
    "subRepos": true,
    "pomodoro": true,
    "versionCheck": true
  },
  "git": {
    "showFileStats": true,
    "showAheadBehind": true
  },
  "stats": {
    "showTime": true,
    "showTodayCommits": true,
    "showLastCommit": true,
    "lastCommitMaxLen": 40
  },
  "contextBar": {
    "length": 10
  },
  "pomodoro": {
    "workDuration": 25,
    "shortBreakDuration": 5,
    "longBreakDuration": 15,
    "longBreakInterval": 4
  }
}
```

All fields are optional — unset fields use defaults.

## Manual Setup

If you prefer manual configuration, add this to your Claude Code `settings.json`:

```json
{
  "statusLine": {
    "enabled": true,
    "command": "node /path/to/statusline-for-claudecode/dist/index.js"
  }
}
```

## Development

```bash
git clone https://github.com/Key-wei/statusline-for-claudecode.git
cd statusline-for-claudecode
npm install
npm run build

# Test locally
echo '{"model":{"display_name":"Opus"},"context_window":{"used_percentage":35},"cwd":"."}' | node dist/index.js
```

## How It Works

This is a stateless CLI tool following the Claude Code statusline protocol:

1. Claude Code pipes a JSON context via stdin (model info, context window, cwd)
2. The plugin reads stdin, detects git repos, queries git status
3. Renders ANSI-formatted text to stdout
4. Claude Code displays the output in the statusline area

All git commands run with a 5-second timeout to avoid blocking.

## License

MIT
