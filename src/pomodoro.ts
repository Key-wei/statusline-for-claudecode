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
