# statusline-for-claudecode

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

뽀모도로 모드:
```
Opus │ ████░░░░░░ 35% │ Branch:master │ ~3 +1 -0 │ ↑2 ↓0
🍅 WORK 18:32 │ ⏱ 16:56 │ 📝 Today 5 commits │ Latest: fix: update login flow... (3 min ago)
```

## 설치

**1단계:** 마켓플레이스 추가
```
/plugin marketplace add Key-wei/statusline-for-claudecode
```

**2단계:** 플러그인 설치
```
/plugin install statusline-for-claudecode
```

**3단계:** 상태 표시줄 설정
```
/statusline-for-claudecode:setup
```

## 기능 모듈

| 모듈 | 기본값 | 설명 |
|------|--------|------|
| `context` | ✅ 활성 | 모델명 + 컨텍스트 윈도우 진행률 표시줄 |
| `git` | ✅ 활성 | 브랜치, 파일 변경 (수정/추가/삭제), ahead/behind |
| `stats` | ✅ 활성 | 현재 시간, 오늘 커밋 수, 최근 커밋 메시지 |
| `subRepos` | ✅ 활성 | 하위 저장소 자동 감지 및 표시 |
| `pomodoro` | ✅ 활성 | 내장 뽀모도로 타이머 (25분 작업 / 5분 휴식) |
| `versionCheck` | ✅ 활성 | 새 버전 자동 감지 및 업데이트 알림 표시 |

### 자동 감지

- 작업 디렉토리가 git 저장소 → 단일 저장소 모드
- 하위 디렉토리에 `.git` 존재 → 다중 저장소 모드 (모노레포, 서브모듈 등)
- git이 아닌 디렉토리 → 우아한 성능 저하 (모델 + 컨텍스트만 표시)

## 뽀모도로 타이머

상태 표시줄에 표시되는 내장 뽀모도로 기법 타이머입니다.

뽀모도로 세션 시작:
```
/statusline-for-claudecode:pomodoro
```

| 단계 | 시간 | 표시 |
|------|------|------|
| 작업 | 25 분 | 🍅 WORK 24:59 |
| 짧은 휴식 | 5 분 | ☕ REST 4:59 |
| 긴 휴식 | 15 분 | ☕ LONG REST 14:59 |

사이클: 작업 → 짧은 휴식 → 작업 → 짧은 휴식 → 작업 → 짧은 휴식 → 작업 → **긴 휴식** → 반복

4번째 작업 세션 후 15분의 긴 휴식이 주어집니다. 모든 시간은 설정 가능합니다.

## 업데이트

플러그인은 하루에 한 번 자동으로 새 버전을 확인하고 상태 표시줄에 알림을 표시합니다:
```
⬆ v0.2.0 available
```

업데이트 실행:
```
/statusline-for-claudecode:update
```

## 설정

`/statusline-for-claudecode:configure` 명령어로 표시를 사용자 정의하거나, 설정 파일을 직접 편집:

**설정 파일 경로:** `~/.claude/plugins/statusline-for-claudecode/config.json`

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

모든 필드는 선택 사항입니다. 설정되지 않은 필드는 기본값이 사용됩니다.

## 수동 설정

수동 설정을 선호하는 경우, Claude Code의 `settings.json`에 다음을 추가:

```json
{
  "statusLine": {
    "enabled": true,
    "command": "node /path/to/statusline-for-claudecode/dist/index.js"
  }
}
```

## 개발

```bash
git clone https://github.com/Key-wei/statusline-for-claudecode.git
cd statusline-for-claudecode
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
