# statusline-for-claudecode

**[English](README.md)** | **[中文](README.zh-CN.md)** | **[日本語](README.ja.md)** | **[한국어](README.ko.md)** | **[Español](README.es.md)**

[Claude Code](https://claude.ai/code) ステータスライン用の汎用リポジトリステータスダッシュボード。

プロジェクトの Git 構造（単一リポジトリまたは複数サブリポジトリ）を自動検出し、Claude Code セッション内にリッチで設定可能なステータスダッシュボードを表示します。

## プレビュー

```
Opus │ ████░░░░░░ 35% │ Branch:master │ ~3 +1 -0 │ ↑2 ↓0
⏱ 16:56 │ 📝 Today 5 commits │ Latest: fix: update login flow... (3 min ago)
```

マルチリポジトリモード（自動検出）：
```
Opus │ ████░░░░░░ 35% │ AClient │ Branch:master │ ~0 +0 -0 │ ↑0 ↓0
Source │ Branch:dev │ ~3 +1 -0 │ ↑2 ↓0
⏱ 16:56 │ 📝 Today 5 commits │ Latest: fix: update login flow... (3 min ago)
```

ポモドーロモード：
```
Opus │ ████░░░░░░ 35% │ Branch:master │ ~3 +1 -0 │ ↑2 ↓0
🍅 WORK 18:32 │ ⏱ 16:56 │ 📝 Today 5 commits │ Latest: fix: update login flow... (3 min ago)
```

## インストール

**ステップ 1：** マーケットプレイスを追加
```
/plugin marketplace add Key-wei/statusline-for-claudecode
```

**ステップ 2：** プラグインをインストール
```
/plugin install statusline-for-claudecode
```

**ステップ 3：** ステータスラインを設定
```
/statusline-for-claudecode:setup
```

## 機能モジュール

| モジュール | デフォルト | 説明 |
|-----------|-----------|------|
| `context` | ✅ オン | モデル名 + コンテキストウィンドウプログレスバー |
| `git` | ✅ オン | ブランチ、ファイル変更（変更/追加/削除）、ahead/behind |
| `stats` | ✅ オン | 現在時刻、本日のコミット数、最新コミットメッセージ |
| `subRepos` | ✅ オン | サブリポジトリの自動検出・表示 |
| `pomodoro` | ✅ オン | 内蔵ポモドーロタイマー（25分作業 / 5分休憩） |
| `versionCheck` | ✅ オン | 新バージョンの自動検出と更新通知の表示 |

### 自動検出

- 作業ディレクトリが git リポジトリ → 単一リポジトリモード
- サブディレクトリに `.git` が存在 → マルチリポジトリモード（monorepo、サブモジュール等）
- 非 git ディレクトリ → グレースフルデグラデーション（モデル + コンテキストのみ表示）

## ポモドーロタイマー

ステータスラインに表示される内蔵ポモドーロテクニックタイマーです。

ポモドーロセッションを開始：
```
/statusline-for-claudecode:pomodoro
```

| フェーズ | 時間 | 表示 |
|---------|------|------|
| 作業 | 25 分 | 🍅 WORK 24:59 |
| 短い休憩 | 5 分 | ☕ REST 4:59 |
| 長い休憩 | 15 分 | ☕ LONG REST 14:59 |

サイクル：作業 → 短い休憩 → 作業 → 短い休憩 → 作業 → 短い休憩 → 作業 → **長い休憩** → 繰り返し

4回目の作業セッション終了後に15分の長い休憩が入ります。すべての時間は設定可能です。

## アップデート

プラグインは1日1回自動的に新バージョンをチェックし、ステータスラインに通知を表示します：
```
⬆ v0.2.0 available
```

アップデートを実行：
```
/statusline-for-claudecode:update
```

## 設定

`/statusline-for-claudecode:configure` コマンドで表示をカスタマイズするか、設定ファイルを直接編集：

**設定ファイルパス：** `~/.claude/plugins/statusline-for-claudecode/config.json`

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

すべてのフィールドはオプションです。未設定のフィールドはデフォルト値が使用されます。

## 手動設定

手動設定を希望する場合、Claude Code の `settings.json` に以下を追加：

```json
{
  "statusLine": {
    "enabled": true,
    "command": "node /path/to/statusline-for-claudecode/dist/index.js"
  }
}
```

## 開発

```bash
git clone https://github.com/Key-wei/statusline-for-claudecode.git
cd statusline-for-claudecode
npm install
npm run build

# ローカルテスト
echo '{"model":{"display_name":"Opus"},"context_window":{"used_percentage":35},"cwd":"."}' | node dist/index.js
```

## 動作原理

Claude Code ステータスラインプロトコルに準拠したステートレス CLI ツールです：

1. Claude Code が stdin 経由で JSON コンテキストを渡す（モデル情報、コンテキストウィンドウ、作業ディレクトリ）
2. プラグインが stdin を読み取り、git リポジトリを検出し、git ステータスを照会
3. ANSI フォーマットテキストを stdout にレンダリング
4. Claude Code がステータスライン領域に出力を表示

すべての git コマンドは 5 秒のタイムアウト付きで実行され、ブロッキングを防止します。

## ライセンス

MIT
