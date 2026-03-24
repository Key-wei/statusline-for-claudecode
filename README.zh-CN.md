# statusline-for-claudecode

**[English](README.md)** | **[中文](README.zh-CN.md)** | **[日本語](README.ja.md)** | **[한국어](README.ko.md)** | **[Español](README.es.md)**

通用仓库状态仪表盘 —— [Claude Code](https://claude.ai/code) 状态栏插件。

自动检测项目的 Git 结构（单仓库或多子仓库），在 Claude Code 会话中直接显示丰富、可配置的状态信息。

## 预览

```
Opus │ ████░░░░░░ 35% │ Branch:master │ ~3 +1 -0 │ ↑2 ↓0
⏱ 16:56 │ 📝 Today 5 commits │ Latest: fix: update login flow... (3 min ago)
```

多仓库模式（自动检测）：
```
Opus │ ████░░░░░░ 35% │ AClient │ Branch:master │ ~0 +0 -0 │ ↑0 ↓0
Source │ Branch:dev │ ~3 +1 -0 │ ↑2 ↓0
⏱ 16:56 │ 📝 Today 5 commits │ Latest: fix: update login flow... (3 min ago)
```

番茄钟模式：
```
Opus │ ████░░░░░░ 35% │ Branch:master │ ~3 +1 -0 │ ↑2 ↓0
🍅 WORK 18:32 │ ⏱ 16:56 │ 📝 Today 5 commits │ Latest: fix: update login flow... (3 min ago)
```

## 安装

**第 1 步：** 添加 marketplace
```
/plugin marketplace add Key-wei/statusline-for-claudecode
```

**第 2 步：** 安装插件
```
/plugin install statusline-for-claudecode
```

**第 3 步：** 配置状态栏
```
/statusline-for-claudecode:setup
```

## 功能模块

| 模块 | 默认 | 说明 |
|------|------|------|
| `context` | ✅ 开启 | 模型名称 + 上下文窗口进度条 |
| `git` | ✅ 开启 | 分支、文件变更（修改/新增/删除）、领先/落后 |
| `stats` | ✅ 开启 | 当前时间、今日提交数、最近一次提交信息 |
| `subRepos` | ✅ 开启 | 自动检测并显示子仓库 |
| `pomodoro` | ✅ 开启 | 内置番茄钟计时器（25分钟工作 / 5分钟休息） |
| `versionCheck` | ✅ 开启 | 自动检测新版本并显示更新提示 |

### 自动检测

- 工作目录本身是 git 仓库 → 单仓库模式
- 子目录包含 `.git` → 多仓库模式（如 monorepo、子模块）
- 非 git 目录 → 优雅降级（仅显示模型 + 上下文信息）

## 番茄钟计时器

内置番茄工作法计时器，显示在状态栏中。

启动番茄钟会话：
```
/statusline-for-claudecode:pomodoro
```

| 阶段 | 时长 | 显示 |
|------|------|------|
| 工作 | 25 分钟 | 🍅 WORK 24:59 |
| 短休息 | 5 分钟 | ☕ REST 4:59 |
| 长休息 | 15 分钟 | ☕ LONG REST 14:59 |

循环：工作 → 短休息 → 工作 → 短休息 → 工作 → 短休息 → 工作 → **长休息** → 重复

每完成 4 个工作阶段后，会获得 15 分钟的长休息。所有时长均可配置。

## 更新

插件每天自动检查一次新版本，并在状态栏中显示通知：
```
⬆ v0.2.0 available
```

执行更新：
```
/statusline-for-claudecode:update
```

## 配置

使用 `/statusline-for-claudecode:configure` 命令自定义显示，或直接编辑配置文件：

**配置文件路径：** `~/.claude/plugins/statusline-for-claudecode/config.json`

```json
{
  "modules": {
    "context": true,
    "git": true,
    "stats": true,
    "subRepos": true,
    "pomodoro": true,
    "versionCheck": true
  },
  "git": {
    "showFileStats": true,
    "showAheadBehind": true
  },
  "stats": {
    "showTime": true,
    "showTodayCommits": true,
    "showLastCommit": true,
    "lastCommitMaxLen": 40
  },
  "contextBar": {
    "length": 10
  },
  "pomodoro": {
    "workDuration": 25,
    "shortBreakDuration": 5,
    "longBreakDuration": 15,
    "longBreakInterval": 4
  }
}
```

所有字段均为可选 —— 未设置的字段使用默认值。

## 手动设置

如果你倾向手动配置，将以下内容添加到 Claude Code 的 `settings.json`：

```json
{
  "statusLine": {
    "enabled": true,
    "command": "node /path/to/statusline-for-claudecode/dist/index.js"
  }
}
```

## 开发

```bash
git clone https://github.com/Key-wei/statusline-for-claudecode.git
cd statusline-for-claudecode
npm install
npm run build

# 本地测试
echo '{"model":{"display_name":"Opus"},"context_window":{"used_percentage":35},"cwd":"."}' | node dist/index.js
```

## 工作原理

这是一个遵循 Claude Code 状态栏协议的无状态 CLI 工具：

1. Claude Code 通过 stdin 传入 JSON 上下文（模型信息、上下文窗口、工作目录）
2. 插件读取 stdin，检测 git 仓库，查询 git 状态
3. 渲染 ANSI 格式化文本输出到 stdout
4. Claude Code 在状态栏区域显示输出内容

所有 git 命令设有 5 秒超时，避免阻塞。

## 许可证

MIT
