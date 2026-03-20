# repo-dashboard

**[English](README.md)** | **[中文](README.zh-CN.md)** | **[日本語](README.ja.md)** | **[한국어](README.ko.md)** | **[Español](README.es.md)**

[Claude Code](https://claude.ai/code) 상태 표시줄용 범용 리포지토리 상태 대시보드.

프로젝트의 Git 구조(단일 저장소 또는 다중 하위 저장소)를 자동 감지하고, Claude Code 세션에서 풍부하고 설정 가능한 상태 대시보드를 직접 표시합니다.

## 미리보기

```
Opus │ ████░░░░░░ 35% │ Branch:master │ ~3 +1 -0 │ ↑2 ↓0
⏱ 16:56 │ 📝 Today 5 commits │ Latest: fix: update login flow... (3 min ago)
```

다중 저장소 모드 (자동 감지):
```
Opus │ ████░░░░░░ 35% │ AClient │ Branch:master │ ~0 +0 -0 │ ↑0 ↓0
Source │ Branch:dev │ ~3 +1 -0 │ ↑2 ↓0
⏱ 16:56 │ 📝 Today 5 commits │ Latest: fix: update login flow... (3 min ago)
```

## 설치

```bash
/plugin install github:Key-wei/repo-dashboard
```

설정 명령어 실행:
```
/repo-dashboard:setup
```

## 기능 모듈

| 모듈 | 기본값 | 설명 |
|------|--------|------|
| `context` | ✅ 활성 | 모델명 + 컨텍스트 윈도우 진행률 표시줄 |
| `git` | ✅ 활성 | 브랜치, 파일 변경 (수정/추가/삭제), ahead/behind |
| `stats` | ✅ 활성 | 현재 시간, 오늘 커밋 수, 최근 커밋 메시지 |
| `subRepos` | ✅ 활성 | 하위 저장소 자동 감지 및 표시 |

### 자동 감지

- 작업 디렉토리가 git 저장소 → 단일 저장소 모드
- 하위 디렉토리에 `.git` 존재 → 다중 저장소 모드 (모노레포, 서브모듈 등)
- git이 아닌 디렉토리 → 우아한 성능 저하 (모델 + 컨텍스트만 표시)

## 설정

`/repo-dashboard:configure` 명령어로 표시를 사용자 정의하거나, 설정 파일을 직접 편집:

**설정 파일 경로:** `~/.claude/plugins/repo-dashboard/config.json`

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

모든 필드는 선택 사항입니다. 설정되지 않은 필드는 기본값이 사용됩니다.

## 수동 설정

수동 설정을 선호하는 경우, Claude Code의 `settings.json`에 다음을 추가:

```json
{
  "statusLine": {
    "enabled": true,
    "command": "node /path/to/repo-dashboard/dist/index.js"
  }
}
```

## 개발

```bash
git clone https://github.com/Key-wei/repo-dashboard.git
cd repo-dashboard
npm install
npm run build

# 로컬 테스트
echo '{"model":{"display_name":"Opus"},"context_window":{"used_percentage":35},"cwd":"."}' | node dist/index.js
```

## 작동 원리

Claude Code 상태 표시줄 프로토콜을 따르는 무상태 CLI 도구입니다:

1. Claude Code가 stdin을 통해 JSON 컨텍스트 전달 (모델 정보, 컨텍스트 윈도우, 작업 디렉토리)
2. 플러그인이 stdin을 읽고, git 저장소를 감지하고, git 상태를 조회
3. ANSI 포맷 텍스트를 stdout으로 렌더링
4. Claude Code가 상태 표시줄 영역에 출력을 표시

모든 git 명령어는 5초 타임아웃으로 실행되어 차단을 방지합니다.

## 라이선스

MIT
