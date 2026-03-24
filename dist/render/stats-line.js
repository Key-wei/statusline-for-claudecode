"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderStatsLine = renderStatsLine;
const colors_1 = require("./colors");
const utils_1 = require("../utils");
const pomodoro_segment_1 = require("./pomodoro-segment");
/**
 * Render the stats line.
 * Example: 🍅 WORK 18:32 │ ⏱ 16:56 │ 📝 Today 5 commits │ Latest: fix: xxx... (3 min ago) │ ⬆ v0.2.0 available
 */
function renderStatsLine(git_status, config, pomodoro_display = null, version_info = null) {
    if (!config.modules.stats)
        return null;
    const parts = [];
    // Pomodoro segment (prepend)
    const pomodoro_part = (0, pomodoro_segment_1.renderPomodoroSegment)(pomodoro_display, config);
    if (pomodoro_part) {
        parts.push(pomodoro_part);
    }
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
    // Version update indicator (append)
    if (version_info && version_info.hasUpdate) {
        parts.push(`${(0, colors_1.c)(colors_1.colors.brightCyan, '⬆')} ${(0, colors_1.c)(colors_1.colors.cyan, `v${version_info.latestVersion} available`)}`);
    }
    return parts.length > 0 ? parts.join(colors_1.SEP) : null;
}
