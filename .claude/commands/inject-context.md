---
name: inject-context
description: "파일을 분할 로딩 후 continue-task 커맨드로 작업 이어서 실행"
argument-hint: <파일 경로> [작업 지시]
allowed-tools:
  - Read
  - Bash
  - Glob
  - SlashCommand
model: haiku
---

# 파일 컨텍스트 주입 커맨드

> 파일을 안전하게 분할 로딩한 후, Opus 모델로 후속 작업을 자동 실행합니다.

**입력**: $ARGUMENTS

**파싱 규칙**:
- 첫 번째 인자: 파일 경로 (필수)
- 나머지 인자: 후속 작업 지시 (선택, 없으면 기본 분석)

예시:
- `/inject-context file.txt` → 파일 로딩 후 기본 분석
- `/inject-context file.txt 이 코드의 보안 취약점을 찾아줘` → 파일 로딩 후 보안 분석

---

## 핵심 제약 조건

- **Read 도구 토큰 제한**: 25,000 토큰
- **안전 라인 수**: 800줄 (라인당 평균 ~25 토큰 가정)
- **적응형 분할**: 오류 발생 시 청크 크기 자동 축소

---

## 실행 지침

### Step 1: 인자 파싱

$ARGUMENTS에서 파일 경로와 작업 지시를 분리합니다:

```
전체 인자: "$ARGUMENTS"

파일 경로 = 첫 번째 공백 전까지의 문자열 (또는 따옴표로 감싸진 경로)
작업 지시 = 나머지 문자열 (없으면 "파일 내용을 분석하고 주요 구조와 핵심 로직을 설명해줘")
```

### Step 2: 파일 존재 및 정보 확인

```bash
ls -la "{파일 경로}" && wc -l "{파일 경로}"
```

파일이 존재하지 않으면 오류 메시지를 출력하고 종료합니다.

### Step 3: 분할 로딩 실행

800줄 단위로 파일을 분할 로딩합니다:

```
총 라인 수 = N
청크 수 = ceil(N / 800)

FOR chunk = 0 TO (청크 수 - 1):
    offset = chunk * 800 + 1
    limit = 800

    Read(file_path="{파일 경로}", offset=offset, limit=limit)

    IF 토큰 초과 오류 발생:
        limit = 400
        Read(file_path="{파일 경로}", offset=offset, limit=limit)
        offset = offset + 400
        Read(file_path="{파일 경로}", offset=offset, limit=limit)
    END IF
END FOR
```

### Step 4: 로딩 결과 보고

```
파일 로딩 완료

파일: {파일명}
총 라인 수: {N}줄
로딩된 청크: {청크 수}개
상태: 컨텍스트 주입 완료

Opus 모델로 후속 작업을 실행합니다...
```

### Step 5: continue-task 커맨드 호출

SlashCommand 도구를 사용하여 후속 작업을 Opus 모델로 실행합니다:

```
SlashCommand(command="/continue-task {작업 지시}")
```

**중요**: 반드시 SlashCommand 도구를 사용하여 /continue-task를 호출하세요.

---

## ⚡ 실행 지시

**지금 바로 아래 단계를 순서대로 실행하세요:**

1. $ARGUMENTS에서 파일 경로와 작업 지시 분리
2. `ls -la && wc -l`로 파일 정보 확인
3. Read 도구로 800줄씩 분할 로딩 (offset, limit 파라미터 사용)
4. 토큰 초과 시 400줄로 축소하여 재시도
5. 로딩 완료 메시지 출력
6. **SlashCommand 도구로 `/continue-task {작업 지시}` 실행**
