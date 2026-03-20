"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderStatsLine = renderStatsLine;
const colors_1 = require("./colors");
const utils_1 = require("../utils");
/**
 * Render the stats line.
 * Example: ⏱ 16:56 │ 📝 今日5次提交 │ 最近: fix: xxx... (3 min ago)
 */
function renderStatsLine(git_status, config) {
    if (!config.modules.stats)
        return null;
    const parts = [];
    // Current time
    if (config.stats.showTime) {
        parts.push(`${(0, colors_1.c)(colors_1.colors.dim, '⏱')} ${(0, colors_1.c)(colors_1.colors.white, (0, utils_1.formatTime)())}`);
    }
    if (git_status) {
        // Today's commits
        if (config.stats.showTodayCommits) {
            const count = git_status.todayCommits;
            const count_color = count > 0 ? colors_1.colors.brightGreen : colors_1.colors.gray;
            parts.push(`${(0, colors_1.c)(colors_1.colors.dim, '📝')} ${(0, colors_1.c)(count_color, `Today ${count} commits`)}`);
        }
        // Last commit
        if (config.stats.showLastCommit && git_status.lastCommit) {
            const subject = (0, utils_1.truncate)(git_status.lastCommit.subject, config.stats.lastCommitMaxLen);
            const time_ago = git_status.lastCommit.relativeTime;
            parts.push(`${(0, colors_1.c)(colors_1.colors.dim, 'Latest:')} ${(0, colors_1.c)(colors_1.colors.white, subject)} ${(0, colors_1.c)(colors_1.colors.gray, `(${time_ago})`)}`);
        }
    }
    return parts.length > 0 ? parts.join(colors_1.SEP) : null;
}
