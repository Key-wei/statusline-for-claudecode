import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DashboardConfig } from './types';

const DEFAULT_CONFIG: DashboardConfig = {
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

function getConfigDir(): string {
  const envDir = process.env.CLAUDE_CONFIG_DIR;
  if (envDir) return envDir;

  const home = os.homedir();
  // Check .claude first, then .claude-internal
  const claudeDir = path.join(home, '.claude');
  const claudeInternalDir = path.join(home, '.claude-internal');

  if (fs.existsSync(claudeDir)) return claudeDir;
  if (fs.existsSync(claudeInternalDir)) return claudeInternalDir;
  return claudeDir; // default
}

export function getPluginDataDir(): string {
  return path.join(getConfigDir(), 'plugins', 'statusline-for-claudecode');
}

function getConfigPath(): string {
  return path.join(getPluginDataDir(), 'config.json');
}

/** Deep merge source into target (non-destructive) */
function deepMerge(target: any, source: any): any {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];
    if (
      sv !== null &&
      sv !== undefined &&
      typeof sv === 'object' &&
      !Array.isArray(sv) &&
      typeof tv === 'object' &&
      tv !== null &&
      !Array.isArray(tv)
    ) {
      result[key] = deepMerge(tv, sv);
    } else if (sv !== undefined) {
      result[key] = sv;
    }
  }
  return result;
}

export function loadConfig(): DashboardConfig {
  const config_path = getConfigPath();
  try {
    if (fs.existsSync(config_path)) {
      const raw = fs.readFileSync(config_path, 'utf8');
      const user_config = JSON.parse(raw);
      return deepMerge(DEFAULT_CONFIG, user_config);
    }
  } catch {
    // Ignore parse errors, use defaults
  }
  return { ...DEFAULT_CONFIG };
}

export function getDefaultConfig(): DashboardConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

export { getConfigPath };
