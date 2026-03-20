---
description: Configure repo-dashboard as your Claude Code statusline
allowed-tools: Bash, Read, Edit, Write, AskUserQuestion
---

# repo-dashboard Setup

Configure `repo-dashboard` as your Claude Code statusline display.

## What to do

1. Detect the user's platform (Windows/macOS/Linux) and shell
2. Find the settings.json location:
   - Check `CLAUDE_CONFIG_DIR` env var first
   - Otherwise use `~/.claude/settings.json` or `~/.claude-internal/settings.json`
3. Read the current settings.json (if it exists)
4. Add or update the `statusLine` configuration:

```json
{
  "statusLine": {
    "enabled": true,
    "command": "node \"{plugin_install_path}/dist/index.js\""
  }
}
```

Where `{plugin_install_path}` is the absolute path to where repo-dashboard is installed.

5. Preserve all existing settings — only add/update the `statusLine` key
6. Write the updated settings.json back
7. Tell the user to restart Claude Code for changes to take effect

## Platform Notes

- **Windows**: Use forward slashes or escaped backslashes in the path
- **All platforms**: Ensure `node` is available in PATH

## Example output to user

```
✅ repo-dashboard configured as your statusline!

Settings updated: ~/.claude/settings.json
Command: node /path/to/repo-dashboard/dist/index.js

Restart Claude Code to see your new statusline.

💡 Tip: Use /repo-dashboard:configure to customize which modules are displayed.
```
