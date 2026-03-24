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
