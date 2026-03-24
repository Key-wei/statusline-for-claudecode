import { StdinData, DashboardConfig, GitStatus, RepoInfo, PomodoroDisplay, VersionInfo } from '../types';
import { renderContextLine } from './context-line';
import { renderGitLines } from './git-line';
import { renderStatsLine } from './stats-line';

export interface RenderInput {
  data: StdinData;
  config: DashboardConfig;
  repos: { info: RepoInfo; status: GitStatus }[];
  primaryGitStatus: GitStatus | null;
  pomodoroDisplay: PomodoroDisplay | null;
  versionInfo: VersionInfo | null;
}

/**
 * Assemble all module outputs into final lines for stdout.
 */
export function render(input: RenderInput): string {
  const { data, config, repos, primaryGitStatus, pomodoroDisplay, versionInfo } = input;
  const lines: string[] = [];

  // Line 1 parts: context + git (combined on one line for compact display)
  const context_part = renderContextLine(data, config);
  const git_lines = renderGitLines(repos, config);

  if (context_part && git_lines.length > 0) {
    const { SEP } = require('./colors');
    lines.push(context_part + SEP + git_lines[0]);
    for (let i = 1; i < git_lines.length; i++) {
      lines.push(git_lines[i]);
    }
  } else if (context_part) {
    lines.push(context_part);
  } else if (git_lines.length > 0) {
    lines.push(...git_lines);
  }

  // Stats line (now includes pomodoro and version info)
  const stats_line = renderStatsLine(primaryGitStatus, config, pomodoroDisplay, versionInfo);
  if (stats_line) {
    lines.push(stats_line);
  }

  return lines.join('\n');
}
