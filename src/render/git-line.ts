import { GitStatus, DashboardConfig, RepoInfo } from '../types';
import { c, colors, SEP } from './colors';

/**
 * Render the git status line for a single repo.
 * Example: Branch:master │ ~3 +1 -0 │ ↑2 ↓0
 */
export function renderGitLine(
  git_status: GitStatus,
  config: DashboardConfig,
  repo_name?: string,
): string | null {
  if (!config.modules.git) return null;

  const parts: string[] = [];

  // Repo name prefix (for multi-repo mode)
  if (repo_name) {
    parts.push(c(colors.magenta, repo_name));
  }

  // Branch
  const branch_color = git_status.branch === 'main' || git_status.branch === 'master'
    ? colors.green
    : colors.yellow;
  parts.push(`${c(colors.dim, 'Branch:')}${c(branch_color, git_status.branch)}`);

  // File stats
  if (config.git.showFileStats) {
    const { modified, added, deleted } = git_status.fileStats;
    const file_parts: string[] = [];
    file_parts.push(c(colors.yellow, `~${modified}`));
    file_parts.push(c(colors.green, `+${added}`));
    file_parts.push(c(colors.red, `-${deleted}`));
    parts.push(file_parts.join(' '));
  }

  // Ahead/behind
  if (config.git.showAheadBehind && git_status.aheadBehind) {
    const { ahead, behind } = git_status.aheadBehind;
    const ab_parts: string[] = [];
    ab_parts.push(c(ahead > 0 ? colors.green : colors.gray, `↑${ahead}`));
    ab_parts.push(c(behind > 0 ? colors.red : colors.gray, `↓${behind}`));
    parts.push(ab_parts.join(' '));
  }

  return parts.join(SEP);
}

/**
 * Render git lines for multiple repos.
 * Returns one line per repo, or a single line for single-repo mode.
 */
export function renderGitLines(
  repos: { info: RepoInfo; status: GitStatus }[],
  config: DashboardConfig,
): string[] {
  if (!config.modules.git || repos.length === 0) return [];

  // Single repo: no prefix needed
  if (repos.length === 1) {
    const line = renderGitLine(repos[0].status, config);
    return line ? [line] : [];
  }

  // Multi repo: show name prefix
  const lines: string[] = [];
  for (const { info, status } of repos) {
    const line = renderGitLine(status, config, info.name);
    if (line) lines.push(line);
  }
  return lines;
}
