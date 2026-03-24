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
