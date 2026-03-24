"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = render;
const context_line_1 = require("./context-line");
const git_line_1 = require("./git-line");
const stats_line_1 = require("./stats-line");
/**
 * Assemble all module outputs into final lines for stdout.
 */
function render(input) {
    const { data, config, repos, primaryGitStatus, pomodoroDisplay, versionInfo } = input;
    const lines = [];
    // Line 1 parts: context + git (combined on one line for compact display)
    const context_part = (0, context_line_1.renderContextLine)(data, config);
    const git_lines = (0, git_line_1.renderGitLines)(repos, config);
    if (context_part && git_lines.length > 0) {
        const { SEP } = require('./colors');
        lines.push(context_part + SEP + git_lines[0]);
        for (let i = 1; i < git_lines.length; i++) {
            lines.push(git_lines[i]);
        }
    }
    else if (context_part) {
        lines.push(context_part);
    }
    else if (git_lines.length > 0) {
        lines.push(...git_lines);
    }
    // Stats line (now includes pomodoro and version info)
    const stats_line = (0, stats_line_1.renderStatsLine)(primaryGitStatus, config, pomodoroDisplay, versionInfo);
    if (stats_line) {
        lines.push(stats_line);
    }
    return lines.join('\n');
}
