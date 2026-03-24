import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { VersionInfo } from './types';
import { getPluginDataDir } from './config';

const GITHUB_TAGS_URL = 'https://api.github.com/repos/Key-wei/statusline-for-claudecode/tags';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const REQUEST_TIMEOUT_MS = 3000;

interface VersionCache {
  checkedAt: number;
  latestVersion: string;
  currentVersion: string;
}

function getCachePath(): string {
  return path.join(getPluginDataDir(), 'version-cache.json');
}

function getCurrentVersion(): string {
  try {
    const pkg_path = path.join(__dirname, '..', 'package.json');
    const raw = fs.readFileSync(pkg_path, 'utf8');
    return JSON.parse(raw).version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function readCache(): VersionCache | null {
  try {
    const raw = fs.readFileSync(getCachePath(), 'utf8');
    return JSON.parse(raw) as VersionCache;
  } catch {
    return null;
  }
}

function writeCache(cache: VersionCache): void {
  const dir = path.dirname(getCachePath());
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(getCachePath(), JSON.stringify(cache, null, 2), 'utf8');
}

function fetchLatestTag(): Promise<string | null> {
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
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString('utf8');
          const tags = JSON.parse(body);
          if (Array.isArray(tags) && tags.length > 0 && tags[0].name) {
            const tag_name: string = tags[0].name;
            // Strip 'v' prefix if present
            resolve(tag_name.startsWith('v') ? tag_name.slice(1) : tag_name);
          } else {
            resolve(null);
          }
        } catch {
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
export async function checkForUpdate(enabled: boolean): Promise<VersionInfo | null> {
  if (!enabled) return null;

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
  if (!latest) return null;

  // Update cache
  const new_cache: VersionCache = {
    checkedAt: Date.now(),
    latestVersion: latest,
    currentVersion: current_version,
  };
  try { writeCache(new_cache); } catch { /* ignore */ }

  return {
    hasUpdate: latest !== current_version,
    latestVersion: latest,
  };
}

/** Clear the version cache file. */
export function clearVersionCache(): void {
  try { fs.unlinkSync(getCachePath()); } catch { /* ignore */ }
}
