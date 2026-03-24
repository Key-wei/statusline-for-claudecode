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
exports.getPluginDataDir = getPluginDataDir;
exports.loadConfig = loadConfig;
exports.getDefaultConfig = getDefaultConfig;
exports.getConfigPath = getConfigPath;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const DEFAULT_CONFIG = {
    modules: {
        context: true,
        git: true,
        stats: true,
        subRepos: true,
        pomodoro: true,
        versionCheck: true,
    },
    git: {
        showFileStats: true,
        showAheadBehind: true,
    },
    stats: {
        showTime: true,
        showTodayCommits: true,
        showLastCommit: true,
        lastCommitMaxLen: 40,
    },
    contextBar: {
        length: 10,
    },
    pomodoro: {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
    },
};
function getConfigDir() {
    const envDir = process.env.CLAUDE_CONFIG_DIR;
    if (envDir)
        return envDir;
    const home = os.homedir();
    // Check .claude first, then .claude-internal
    const claudeDir = path.join(home, '.claude');
    const claudeInternalDir = path.join(home, '.claude-internal');
    if (fs.existsSync(claudeDir))
        return claudeDir;
    if (fs.existsSync(claudeInternalDir))
        return claudeInternalDir;
    return claudeDir; // default
}
function getPluginDataDir() {
    return path.join(getConfigDir(), 'plugins', 'statusline-for-claudecode');
}
function getConfigPath() {
    return path.join(getPluginDataDir(), 'config.json');
}
/** Deep merge source into target (non-destructive) */
function deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
        const sv = source[key];
        const tv = target[key];
        if (sv !== null &&
            sv !== undefined &&
            typeof sv === 'object' &&
            !Array.isArray(sv) &&
            typeof tv === 'object' &&
            tv !== null &&
            !Array.isArray(tv)) {
            result[key] = deepMerge(tv, sv);
        }
        else if (sv !== undefined) {
            result[key] = sv;
        }
    }
    return result;
}
function loadConfig() {
    const config_path = getConfigPath();
    try {
        if (fs.existsSync(config_path)) {
            const raw = fs.readFileSync(config_path, 'utf8');
            const user_config = JSON.parse(raw);
            return deepMerge(DEFAULT_CONFIG, user_config);
        }
    }
    catch {
        // Ignore parse errors, use defaults
    }
    return { ...DEFAULT_CONFIG };
}
function getDefaultConfig() {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}
