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
    return `${c(colors.brightYellow, '✅ DONE!')} ${c(colors.yellow, `${count}/${config.pomodoro.longBreakInterval} 🍅`)}`;
  }

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
