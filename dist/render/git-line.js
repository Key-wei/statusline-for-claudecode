"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderGitLine = renderGitLine;
exports.renderGitLines = renderGitLines;
const colors_1 = require("./colors");
/**
 * Render the git status line for a single repo.
 * Example: Branch:master │ ~3 +1 -0 │ ↑2 ↓0
 */
function renderGitLine(git_status, config, repo_name) {
    if (!config.modules.git)
        return null;
    const parts = [];
    // Repo name prefix (for multi-repo mode)
    if (repo_name) {
        parts.push((0, colors_1.c)(colors_1.colors.magenta, repo_name));
    }
    // Branch
    const branch_color = git_status.branch === 'main' || git_status.branch === 'master'
        ? colors_1.colors.green
        : colors_1.colors.yellow;
    parts.push(`${(0, colors_1.c)(colors_1.colors.dim, 'Branch:')}${(0, colors_1.c)(branch_color, git_status.branch)}`);
    // File stats
    if (config.git.showFileStats) {
        const { modified, added, deleted } = git_status.fileStats;
        const file_parts = [];
        file_parts.push((0, colors_1.c)(colors_1.colors.yellow, `~${modified}`));
        file_parts.push((0, colors_1.c)(colors_1.colors.green, `+${added}`));
        file_parts.push((0, colors_1.c)(colors_1.colors.red, `-${deleted}`));
        parts.push(file_parts.join(' '));
    }
    // Ahead/behind
    if (config.git.showAheadBehind && git_status.aheadBehind) {
        const { ahead, behind } = git_status.aheadBehind;
        const ab_parts = [];
        ab_parts.push((0, colors_1.c)(ahead > 0 ? colors_1.colors.green : colors_1.colors.gray, `↑${ahead}`));
        ab_parts.push((0, colors_1.c)(behind > 0 ? colors_1.colors.red : colors_1.colors.gray, `↓${behind}`));
        parts.push(ab_parts.join(' '));
    }
    return parts.join(colors_1.SEP);
}
/**
 * Render git lines for multiple repos.
 * Returns one line per repo, or a single line for single-repo mode.
 */
function renderGitLines(repos, config) {
    if (!config.modules.git || repos.length === 0)
        return [];
    // Single repo: no prefix needed
    if (repos.length === 1) {
        const line = renderGitLine(repos[0].status, config);
        return line ? [line] : [];
    }
    // Multi repo: show name prefix
    const lines = [];
    for (const { info, status } of repos) {
        const line = renderGitLine(status, config, info.name);
        if (line)
            lines.push(line);
    }
    return lines;
}
