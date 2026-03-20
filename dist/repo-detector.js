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
exports.detectRepos = detectRepos;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Detect git repositories at cwd and one level deep.
 *
 * - If cwd itself is a git repo → returns it as the primary repo
 * - Scans immediate subdirectories for .git → returns them as sub-repos
 * - Max one level deep to avoid performance issues
 */
function detectRepos(cwd) {
    const repos = [];
    // Check if cwd itself is a git repo
    const cwd_git = path.join(cwd, '.git');
    if (fs.existsSync(cwd_git)) {
        repos.push({
            name: path.basename(cwd),
            path: cwd,
        });
    }
    // Scan immediate subdirectories
    try {
        const entries = fs.readdirSync(cwd, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory())
                continue;
            // Skip hidden dirs and common non-project dirs
            if (entry.name.startsWith('.') || entry.name === 'node_modules')
                continue;
            const sub_path = path.join(cwd, entry.name);
            const sub_git = path.join(sub_path, '.git');
            if (fs.existsSync(sub_git)) {
                // Only add if it's not the same as cwd (avoid duplicates)
                if (sub_path !== cwd) {
                    repos.push({
                        name: entry.name,
                        path: sub_path,
                    });
                }
            }
        }
    }
    catch {
        // Permission errors, etc.
    }
    return repos;
}
