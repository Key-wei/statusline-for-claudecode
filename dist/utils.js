"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.truncate = truncate;
exports.formatTime = formatTime;
exports.safeExec = safeExec;
/**
 * Truncate a string to maxLen, appending "..." if truncated.
 */
function truncate(str, max_len) {
    if (str.length <= max_len)
        return str;
    return str.slice(0, max_len - 3) + '...';
}
/**
 * Format current local time as HH:MM.
 */
function formatTime() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}
/**
 * Safely execute a function, returning fallback on error.
 */
function safeExec(fn, fallback) {
    try {
        return fn();
    }
    catch {
        return fallback;
    }
}
