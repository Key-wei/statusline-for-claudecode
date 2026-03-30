"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryGitStatus = queryGitStatus;
const child_process_1 = require("child_process");
const EXEC_OPTS = { timeout: 5000, encoding: 'utf8', windowsHide: true };
function git(cmd, cwd) {
    return (0, child_process_1.execSync)(`git ${cmd}`, { ...EXEC_OPTS, cwd }).toString().trim();
}
function getBranch(cwd) {
    try {
        return git('rev-parse --abbrev-ref HEAD', cwd);
    }
    catch {
        return 'unknown';
    }
}
function getFileStats(cwd) {
    const stats = { modified: 0, added: 0, deleted: 0 };
    try {
        const output = git('--no-optional-locks status --porcelain', cwd);
        if (!output)
            return stats;
        for (const line of output.split('\n')) {
            if (!line || line.length < 2)
                continue;
            const x = line[0];
            const y = line[1];
            // Untracked files
            if (x === '?' && y === '?') {
                stats.added++;
                continue;
            }
            // Check index (x) and worktree (y)
            if (x === 'A' || y === 'A')
                stats.added++;
            else if (x === 'D' || y === 'D')
                stats.deleted++;
            else if (x === 'M' || y === 'M' || x === 'R' || x === 'C')
                stats.modified++;
        }
    }
    catch {
        // Not a git repo or git not available
    }
    return stats;
}
function getAheadBehind(cwd) {
    try {
        const output = git('rev-list --left-right --count @{upstream}...HEAD', cwd);
        const parts = output.split(/\s+/);
        if (parts.length >= 2) {
            return {
                behind: parseInt(parts[0], 10) || 0,
                ahead: parseInt(parts[1], 10) || 0,
            };
        }
    }
    catch {
        // No upstream configured
    }
    return null;
}
function getGitUserEmail(cwd) {
    try {
        return git('config user.email', cwd);
    }
    catch {
        return '';
    }
}
function getTodayCommits(cwd) {
    try {
        const email = getGitUserEmail(cwd);
        const author_filter = email ? ` --author="${email}"` : '';
        const output = git(`rev-list --count --since="00:00"${author_filter} HEAD`, cwd);
        return parseInt(output, 10) || 0;
    }
    catch {
        return 0;
    }
}
function getLastCommit(cwd) {
    try {
        const subject = git('log -1 --format=%s', cwd);
        const relative_time = git('log -1 --format=%cr', cwd);
        if (subject) {
            return { subject, relativeTime: relative_time };
        }
    }
    catch {
        // No commits yet
    }
    return null;
}
/**
 * Query full Git status for a repository path.
 * Returns null if the path is not a git repository.
 */
function queryGitStatus(cwd) {
    try {
        // Verify this is a git repo
        git('rev-parse --is-inside-work-tree', cwd);
    }
    catch {
        return null;
    }
    return {
        branch: getBranch(cwd),
        fileStats: getFileStats(cwd),
        aheadBehind: getAheadBehind(cwd),
        todayCommits: getTodayCommits(cwd),
        lastCommit: getLastCommit(cwd),
    };
}
