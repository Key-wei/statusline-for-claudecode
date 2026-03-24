"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAndAdvancePomodoroState = loadAndAdvancePomodoroState;
exports.startPomodoro = startPomodoro;
exports.stopPomodoro = stopPomodoro;
exports.skipPhase = skipPhase;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = require("./config");
function getStatePath() {
    return path.join((0, config_1.getPluginDataDir)(), 'pomodoro.json');
}
function readState() {
    const state_path = getStatePath();
    if (!fs.existsSync(state_path))
        return null;
    try {
        const raw = fs.readFileSync(state_path, 'utf8');
        const state = JSON.parse(raw);
        // Validate required fields
        if (!state.phase || !state.startedAt || !state.duration) {
            fs.unlinkSync(state_path);
            return null;
        }
        return state;
    }
    catch {
        // Corrupted file — delete and treat as idle
        try {
            fs.unlinkSync(state_path);
        }
        catch { /* ignore */ }
        return null;
    }
}
function writeState(state) {
    const dir = path.dirname(getStatePath());
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(getStatePath(), JSON.stringify(state, null, 2), 'utf8');
}
function getNextPhase(state, config) {
    if (state.phase === 'work') {
        const completed = state.completedPomodoros + 1;
        if (completed >= config.pomodoro.longBreakInterval) {
            return {
                phase: 'longBreak',
                duration: config.pomodoro.longBreakDuration * 60 * 1000,
                completedPomodoros: completed,
            };
        }
        return {
            phase: 'shortBreak',
            duration: config.pomodoro.shortBreakDuration * 60 * 1000,
            completedPomodoros: completed,
        };
    }
    // After any break → work
    const reset = state.phase === 'longBreak' ? 0 : state.completedPomodoros;
    return {
        phase: 'work',
        duration: config.pomodoro.workDuration * 60 * 1000,
        completedPomodoros: reset,
    };
}
/**
 * Load pomodoro state, auto-advance if phase elapsed.
 * Called from main() — may write to file as a side effect.
 * Returns display-ready data or null if idle.
 */
function loadAndAdvancePomodoroState(config) {
    if (!config.modules.pomodoro)
        return null;
    const state = readState();
    if (!state)
        return null;
    const elapsed = Date.now() - state.startedAt;
    const remaining = state.duration - elapsed;
    if (remaining <= 0) {
        // Phase elapsed — advance to next
        const next = getNextPhase(state, config);
        const new_state = {
            phase: next.phase,
            startedAt: Date.now(),
            duration: next.duration,
            completedPomodoros: next.completedPomodoros,
        };
        writeState(new_state);
        return {
            phase: state.phase,
            remainingMs: 0,
            completedPomodoros: next.completedPomodoros,
            justCompleted: true,
        };
    }
    return {
        phase: state.phase,
        remainingMs: remaining,
        completedPomodoros: state.completedPomodoros,
        justCompleted: false,
    };
}
/** Start a new pomodoro work session. */
function startPomodoro(config) {
    const state = {
        phase: 'work',
        startedAt: Date.now(),
        duration: config.pomodoro.workDuration * 60 * 1000,
        completedPomodoros: 0,
    };
    writeState(state);
}
/** Stop the current pomodoro session. */
function stopPomodoro() {
    try {
        fs.unlinkSync(getStatePath());
    }
    catch { /* ignore */ }
}
/** Skip current phase, advance to next. */
function skipPhase(config) {
    const state = readState();
    if (!state)
        return null;
    const next = getNextPhase(state, config);
    const new_state = {
        phase: next.phase,
        startedAt: Date.now(),
        duration: next.duration,
        completedPomodoros: next.completedPomodoros,
    };
    writeState(new_state);
    return next.phase;
}
