# repo-dashboard

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

## 安装

```bash
/plugin install github:keywei/repo-dashboard
```

然后运行设置命令：
```
/repo-dashboard:setup
```

## 功能模块

| 模块 | 默认 | 说明 |
|------|------|------|
| `context` | ✅ 开启 | 模型名称 + 上下文窗口进度条 |
| `git` | ✅ 开启 | 分支、文件变更（修改/新增/删除）、领先/落后 |
| `stats` | ✅ 开启 | 当前时间、今日提交数、最近一次提交信息 |
| `subRepos` | ✅ 开启 | 自动检测并显示子仓库 |

### 自动检测

- 工作目录本身是 git 仓库 → 单仓库模式
- 子目录包含 `.git` → 多仓库模式（如 monorepo、子模块）
- 非 git 目录 → 优雅降级（仅显示模型 + 上下文信息）

## 配置

使用 `/repo-dashboard:configure` 命令自定义显示，或直接编辑配置文件：

**配置文件路径：** `~/.claude/plugins/repo-dashboard/config.json`

```json
{
  "modules": {
    "context": true,
    "git": true,
    "stats": true,
    "subRepos": true
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
    "command": "node /path/to/repo-dashboard/dist/index.js"
  }
}
```

## 开发

```bash
git clone https://github.com/keywei/repo-dashboard.git
cd repo-dashboard
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
