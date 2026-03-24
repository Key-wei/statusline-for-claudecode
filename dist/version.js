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
exports.checkForUpdate = checkForUpdate;
exports.clearVersionCache = clearVersionCache;
const https = __importStar(require("https"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = require("./config");
const GITHUB_TAGS_URL = 'https://api.github.com/repos/Key-wei/statusline-for-claudecode/tags';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const REQUEST_TIMEOUT_MS = 3000;
function getCachePath() {
    return path.join((0, config_1.getPluginDataDir)(), 'version-cache.json');
}
function getCurrentVersion() {
    try {
        const pkg_path = path.join(__dirname, '..', 'package.json');
        const raw = fs.readFileSync(pkg_path, 'utf8');
        return JSON.parse(raw).version || '0.0.0';
    }
    catch {
        return '0.0.0';
    }
}
function readCache() {
    try {
        const raw = fs.readFileSync(getCachePath(), 'utf8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
function writeCache(cache) {
    const dir = path.dirname(getCachePath());
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(getCachePath(), JSON.stringify(cache, null, 2), 'utf8');
}
function fetchLatestTag() {
    return new Promise((resolve) => {
        const req = https.get(GITHUB_TAGS_URL, {
            headers: { 'User-Agent': 'statusline-for-claudecode' },
            timeout: REQUEST_TIMEOUT_MS,
        }, (res) => {
            if (res.statusCode !== 200) {
                res.resume();
                resolve(null);
                return;
            }
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                try {
                    const body = Buffer.concat(chunks).toString('utf8');
                    const tags = JSON.parse(body);
                    if (Array.isArray(tags) && tags.length > 0 && tags[0].name) {
                        const tag_name = tags[0].name;
                        // Strip 'v' prefix if present
                        resolve(tag_name.startsWith('v') ? tag_name.slice(1) : tag_name);
                    }
                    else {
                        resolve(null);
                    }
                }
                catch {
                    resolve(null);
                }
            });
            res.on('error', () => resolve(null));
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
    });
}
/**
 * Check for updates. Uses cache to avoid frequent network requests.
 * Returns version info or null on failure.
 */
async function checkForUpdate(enabled) {
    if (!enabled)
        return null;
    const current_version = getCurrentVersion();
    const cache = readCache();
    // Use cache if still fresh and current version matches
    if (cache && cache.currentVersion === current_version) {
        const age = Date.now() - cache.checkedAt;
        if (age < CACHE_TTL_MS) {
            return {
                hasUpdate: cache.latestVersion !== current_version,
                latestVersion: cache.latestVersion,
            };
        }
    }
    // Fetch from GitHub
    const latest = await fetchLatestTag();
    if (!latest)
        return null;
    // Update cache
    const new_cache = {
        checkedAt: Date.now(),
        latestVersion: latest,
        currentVersion: current_version,
    };
    try {
        writeCache(new_cache);
    }
    catch { /* ignore */ }
    return {
        hasUpdate: latest !== current_version,
        latestVersion: latest,
    };
}
/** Clear the version cache file. */
function clearVersionCache() {
    try {
        fs.unlinkSync(getCachePath());
    }
    catch { /* ignore */ }
}
