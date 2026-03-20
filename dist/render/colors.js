"use strict";
// ANSI color helpers
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEP = exports.colors = void 0;
exports.c = c;
exports.progressBar = progressBar;
const ESC = '\x1b[';
exports.colors = {
    reset: `${ESC}0m`,
    // Foreground
    gray: `${ESC}90m`,
    red: `${ESC}31m`,
    green: `${ESC}32m`,
    yellow: `${ESC}33m`,
    blue: `${ESC}34m`,
    magenta: `${ESC}35m`,
    cyan: `${ESC}36m`,
    white: `${ESC}37m`,
    brightWhite: `${ESC}97m`,
    brightCyan: `${ESC}96m`,
    brightGreen: `${ESC}92m`,
    brightYellow: `${ESC}93m`,
    brightRed: `${ESC}91m`,
    // Bold
    bold: `${ESC}1m`,
    dim: `${ESC}2m`,
};
function c(color, text) {
    return `${color}${text}${exports.colors.reset}`;
}
/** Separator character */
exports.SEP = c(exports.colors.gray, ' │ ');
/**
 * Render a progress bar.
 * @param pct  Percentage 0-100
 * @param len  Total bar length in characters
 */
function progressBar(pct, len) {
    const clamped = Math.max(0, Math.min(100, pct));
    const filled = Math.round((clamped / 100) * len);
    const empty = len - filled;
    let fill_color = exports.colors.green;
    if (clamped > 80)
        fill_color = exports.colors.red;
    else if (clamped > 60)
        fill_color = exports.colors.yellow;
    const bar = `${fill_color}${'█'.repeat(filled)}${exports.colors.gray}${'░'.repeat(empty)}${exports.colors.reset}`;
    return bar;
}
