import { readStdin } from './stdin';
import { loadConfig } from './config';
import { queryGitStatus } from './git';
import { detectRepos } from './repo-detector';
import { render } from './render';
import { GitStatus, RepoInfo } from './types';
import { loadAndAdvancePomodoroState } from './pomodoro';
import { checkForUpdate } from './version';

async function main(): Promise<void> {
  const data = await readStdin();

  if (!data) {
    process.stdout.write('[statusline-for-claudecode] Initializing...\n');
    return;
  }

  const config = loadConfig();
  const cwd = data.cwd || process.cwd();

  // Detect repos
  const all_repos = detectRepos(cwd);

  // Query git status for each repo
  const repos: { info: RepoInfo; status: GitStatus }[] = [];
  let primary_git_status: GitStatus | null = null;

  for (const repo of all_repos) {
    const status = queryGitStatus(repo.path);
    if (status) {
      repos.push({ info: repo, status });
      if (!primary_git_status) {
        primary_git_status = status;
      }
    }
  }

  // Filter sub-repos if disabled
  if (!config.modules.subRepos && repos.length > 1) {
    repos.splice(1);
  }

  // Load pomodoro state (may auto-advance and write file)
  const pomodoro_display = loadAndAdvancePomodoroState(config);

  // Check for updates (async, cached)
  const version_info = await checkForUpdate(config.modules.versionCheck);

  const output = render({
    data,
    config,
    repos,
    primaryGitStatus: primary_git_status,
    pomodoroDisplay: pomodoro_display,
    versionInfo: version_info,
  });

  if (output) {
    process.stdout.write(output + '\n');
  }
}

main().catch(() => {
  process.stdout.write('[statusline-for-claudecode] Error\n');
});
