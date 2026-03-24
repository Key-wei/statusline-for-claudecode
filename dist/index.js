"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stdin_1 = require("./stdin");
const config_1 = require("./config");
const git_1 = require("./git");
const repo_detector_1 = require("./repo-detector");
const render_1 = require("./render");
const pomodoro_1 = require("./pomodoro");
const version_1 = require("./version");
async function main() {
    const data = await (0, stdin_1.readStdin)();
    if (!data) {
        process.stdout.write('[statusline-for-claudecode] Initializing...\n');
        return;
    }
    const config = (0, config_1.loadConfig)();
    const cwd = data.cwd || process.cwd();
    // Detect repos
    const all_repos = (0, repo_detector_1.detectRepos)(cwd);
    // Query git status for each repo
    const repos = [];
    let primary_git_status = null;
    for (const repo of all_repos) {
        const status = (0, git_1.queryGitStatus)(repo.path);
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
    const pomodoro_display = (0, pomodoro_1.loadAndAdvancePomodoroState)(config);
    // Check for updates (async, cached)
    const version_info = await (0, version_1.checkForUpdate)(config.modules.versionCheck);
    const output = (0, render_1.render)({
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
