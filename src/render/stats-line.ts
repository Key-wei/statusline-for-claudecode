import { GitStatus, DashboardConfig } from '../types';
import { c, colors, SEP } from './colors';
import { formatTime, truncate } from '../utils';

/**
 * Render the stats line.
 * Example: ⏱ 16:56 │ 📝 今日5次提交 │ 最近: fix: xxx... (3 min ago)
 */
export function renderStatsLine(
  git_status: GitStatus | null,
  config: DashboardConfig,
): string | null {
  if (!config.modules.stats) return null;

  const parts: string[] = [];

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

  return parts.length > 0 ? parts.join(SEP) : null;
}
