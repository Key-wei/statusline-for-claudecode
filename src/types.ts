// ── Claude Code stdin context ──

export interface StdinModel {
  display_name?: string;
  api_name?: string;
}

export interface StdinContextWindow {
  used_percentage?: number;
  total_tokens?: number;
  used_tokens?: number;
}

export interface StdinConversation {
  total_turns?: number;
  model?: string;
}

export interface StdinData {
  model?: StdinModel;
  context_window?: StdinContextWindow;
  conversation?: StdinConversation;
  cwd?: string;
}

// ── Git data ──

export interface GitFileStats {
  modified: number;
  added: number;
  deleted: number;
}

export interface GitAheadBehind {
  ahead: number;
  behind: number;
}

export interface GitLastCommit {
  subject: string;
  relativeTime: string;
}

export interface GitStatus {
  branch: string;
  fileStats: GitFileStats;
  aheadBehind: GitAheadBehind | null;
  todayCommits: number;
  lastCommit: GitLastCommit | null;
}

// ── Repo detection ──

export interface RepoInfo {
  name: string;
  path: string;
}

// ── Config ──

export interface DashboardConfig {
  modules: {
    context: boolean;
    git: boolean;
    stats: boolean;
    subRepos: boolean;
  };
  git: {
    showFileStats: boolean;
    showAheadBehind: boolean;
  };
  stats: {
    showTime: boolean;
    showTodayCommits: boolean;
    showLastCommit: boolean;
    lastCommitMaxLen: number;
  };
  contextBar: {
    length: number;
  };
}
