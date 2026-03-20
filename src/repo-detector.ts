import * as fs from 'fs';
import * as path from 'path';
import { RepoInfo } from './types';

/**
 * Detect git repositories at cwd and one level deep.
 *
 * - If cwd itself is a git repo → returns it as the primary repo
 * - Scans immediate subdirectories for .git → returns them as sub-repos
 * - Max one level deep to avoid performance issues
 */
export function detectRepos(cwd: string): RepoInfo[] {
  const repos: RepoInfo[] = [];

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
      if (!entry.isDirectory()) continue;
      // Skip hidden dirs and common non-project dirs
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

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
  } catch {
    // Permission errors, etc.
  }

  return repos;
}
