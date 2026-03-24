---
description: Customize which modules and options statusline-for-claudecode displays
allowed-tools: Read, Write, Edit, AskUserQuestion
---

# statusline-for-claudecode Configure

Help the user customize their statusline-for-claudecode display by editing the config file.

## What to do

1. Find the config file location:
   - Check `CLAUDE_CONFIG_DIR` env var, otherwise `~/.claude` or `~/.claude-internal`
   - Config path: `{config_dir}/plugins/statusline-for-claudecode/config.json`

2. Read the current config (if it exists) and show the user what's currently configured

3. Ask the user what they'd like to change. Available options:

### Modules (on/off)
- `context` — Model name + context window progress bar (default: on)
- `git` — Branch, file changes, ahead/behind (default: on)
- `stats` — Time, today's commits, last commit (default: on)
- `subRepos` — Auto-detect and show sub-repositories (default: on)

### Git Options
- `showFileStats` — Show ~modified +added -deleted counts (default: on)
- `showAheadBehind` — Show ↑ahead ↓behind counts (default: on)

### Stats Options
- `showTime` — Show current time (default: on)
- `showTodayCommits` — Show today's commit count (default: on)
- `showLastCommit` — Show most recent commit message (default: on)
- `lastCommitMaxLen` — Max length for commit message (default: 40)

### Context Bar Options
- `length` — Progress bar character length (default: 10)

4. Create the config directory if needed: `mkdir -p {config_dir}/plugins/statusline-for-claudecode/`
5. Write the updated config.json
6. Tell the user the change takes effect on the next statusline refresh (no restart needed)

## Config Schema

```json
{
  "modules": {
    "context": true,
    "git": true,
    "stats": true,
    "subRepos": true
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
  }
}
```

## Example interaction

```
Current config: (defaults — no custom config found)

What would you like to change?
- Toggle modules on/off
- Adjust git display options
- Adjust stats display options
- Change progress bar length

After the user chooses, update the config file and confirm:

✅ Config updated: ~/.claude/plugins/statusline-for-claudecode/config.json
Changes take effect on next statusline refresh.
```
