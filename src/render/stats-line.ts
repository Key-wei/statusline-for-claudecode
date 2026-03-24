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
