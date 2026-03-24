"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPomodoroSegment = renderPomodoroSegment;
const colors_1 = require("./colors");
function formatCountdown(ms) {
    const total_seconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(total_seconds / 60);
    const seconds = total_seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
/**
 * Render pomodoro segment for the stats line.
 * Returns a string segment or null if idle/disabled.
 */
function renderPomodoroSegment(display, config) {
    if (!display)
        return null;
    if (display.justCompleted) {
        const count = display.completedPomodoros;
        return `${(0, colors_1.c)(colors_1.colors.brightYellow, '✅ DONE!')} ${(0, colors_1.c)(colors_1.colors.yellow, `${count}/${config.pomodoro.longBreakInterval} 🍅`)}`;
    }
    const countdown = formatCountdown(display.remainingMs);
    switch (display.phase) {
        case 'work':
            return `${(0, colors_1.c)(colors_1.colors.red, '🍅 WORK')} ${(0, colors_1.c)(colors_1.colors.brightRed, countdown)}`;
        case 'shortBreak':
            return `${(0, colors_1.c)(colors_1.colors.green, '☕ REST')} ${(0, colors_1.c)(colors_1.colors.brightGreen, countdown)}`;
        case 'longBreak':
            return `${(0, colors_1.c)(colors_1.colors.green, '☕ LONG REST')} ${(0, colors_1.c)(colors_1.colors.brightGreen, countdown)}`;
        default:
            return null;
    }
}
