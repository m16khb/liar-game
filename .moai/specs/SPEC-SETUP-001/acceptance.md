# 인수 기준 (Acceptance Criteria)
## SPEC-SETUP-001: Turborepo 모노레포 기반 구조 설정

---

## 1. 개요

### 1.1 목적
이 문서는 SPEC-SETUP-001의 구현이 완료되었을 때 충족해야 하는 명확한 인수 기준을 정의합니다. 모든 기준은 Given-When-Then 형식의 시나리오로 작성되어 있으며, 자동화된 테스트 또는 수동 검증을 통해 확인할 수 있습니다.

### 1.2 범위
- Turborepo 워크스페이스 동작 검증
- pnpm 워크스페이스 의존성 해결 검증
- 공유 패키지 통합 검증
- 빌드 파이프라인 검증
- 개발 서버 동작 검증
- 성능 기준 검증

### 1.3 검증 방법
- ✅ **자동 테스트**: Jest/Vitest 단위 테스트
- 🔍 **수동 검증**: 명령어 실행 및 출력 확인
- 📊 **성능 측정**: 빌드 시간, 메모리 사용량

---

## 2. 인수 기준 (Acceptance Criteria)

### AC-001: Turborepo 워크스페이스 초기화

**우선순위**: Critical

#### 시나리오 1: Turborepo 설정 파일 유효성
```gherkin
Given Turborepo가 설치되어 있고
When 개발자가 프로젝트 루트에서 turbo.json을 확인하면
Then turbo.json 파일이 존재해야 한다
And 파일 내용이 유효한 JSON 형식이어야 한다
And pipeline 섹션이 정의되어 있어야 한다
And build, dev, test, lint 태스크가 포함되어 있어야 한다
```

**검증 방법**:
```bash
# 1. 파일 존재 확인
test -f turbo.json && echo "✅ turbo.json exists"

# 2. JSON 유효성 검증
cat turbo.json | jq . > /dev/null && echo "✅ Valid JSON"

# 3. 필수 태스크 확인
jq '.pipeline | keys | contains(["build", "dev", "test", "lint"])' turbo.json
```

**예상 출력**:
```
✅ turbo.json exists
✅ Valid JSON
true
```

#### 시나리오 2: pnpm 워크스페이스 의존성 해결
```gherkin
Given pnpm-workspace.yaml이 존재하고
When 개발자가 `pnpm install`을 실행하면
Then 모든 워크스페이스 패키지가 올바르게 링크되어야 한다
And node_modules/.pnpm/node_modules/@liar-game/types 심볼릭 링크가 생성되어야 한다
And pnpm-lock.yaml이 생성/업데이트되어야 한다
And 에러 없이 완료되어야 한다
```

**검증 방법**:
```bash
# 1. pnpm install 실행
pnpm install

# 2. 공유 패키지 링크 확인
test -L node_modules/@liar-game/types && echo "✅ types linked"
test -L node_modules/@liar-game/ui && echo "✅ ui linked"
test -L node_modules/@liar-game/constants && echo "✅ constants linked"

# 3. lockfile 확인
test -f pnpm-lock.yaml && echo "✅ lockfile created"
```

**예상 출력**:
```
✅ types linked
✅ ui linked
✅ constants linked
✅ lockfile created
```

---

### AC-002: 공유 타입 패키지

**우선순위**: Critical

#### 시나리오 1: TypeScript 타입 정의 유효성
```gherkin
Given packages/types에 공유 타입이 정의되어 있고
When 개발자가 `pnpm run build --filter=@liar-game/types`를 실행하면
Then TypeScript 컴파일이 성공해야 한다
And dist/ 디렉토리가 생성되어야 한다
And .d.ts 선언 파일이 생성되어야 한다
And 에러 없이 완료되어야 한다
```

**검증 방법**:
```bash
# 1. 빌드 실행
cd packages/types
pnpm run build

# 2. 결과 확인
test -d dist && echo "✅ dist/ created"
test -f dist/index.d.ts && echo "✅ type declarations generated"
```

**예상 출력**:
```
✅ dist/ created
✅ type declarations generated
```

#### 시나리오 2: apps에서 타입 import 성공
```gherkin
Given packages/types가 빌드되어 있고
When apps/web 또는 apps/api에서 타입을 import하면
Then TypeScript 타입 체크가 정상적으로 동작해야 한다
And IDE 자동완성이 제공되어야 한다
And 런타임 에러가 발생하지 않아야 한다
```

**검증 방법**:
```typescript
// apps/web/src/app/page.tsx
import { Player, GameState } from '@liar-game/types';

const testPlayer: Player = {
  id: '123',
  username: 'test',
  role: 'CITIZEN',
  isReady: true,
  votedFor: null
};

// TypeScript 컴파일 성공 = 타입 import 성공
```

**검증 명령**:
```bash
cd apps/web
pnpm run type-check  # tsc --noEmit
```

**예상 출력**:
```
No errors found
```

---

### AC-003: 통합 빌드 파이프라인

**우선순위**: High

#### 시나리오 1: 의존성 순서대로 빌드
```gherkin
Given 모든 워크스페이스가 설정되어 있고
When 개발자가 `turbo run build`를 실행하면
Then 의존성 순서대로 빌드가 진행되어야 한다
And packages/types → apps/web 순서가 지켜져야 한다
And packages/types → apps/api 순서가 지켜져야 한다
And 최종적으로 모든 패키지 빌드가 성공해야 한다
```

**검증 방법**:
```bash
# 1. 빌드 실행 (verbose 모드)
turbo run build --verbose

# 2. 로그에서 순서 확인
# 예상 순서:
# - @liar-game/types:build
# - @liar-game/config:build
# - @liar-game/constants:build
# - @liar-game/ui:build
# - web:build
# - api:build
```

**예상 로그**:
```
• Packages in scope: @liar-game/types, @liar-game/ui, @liar-game/constants, web, api
• Running build in 6 packages
• Remote caching disabled

@liar-game/types:build: cache miss, executing...
@liar-game/types:build: > tsc
@liar-game/types:build: ✓ Built in 1.2s

@liar-game/ui:build: cache miss, executing...
@liar-game/ui:build: ✓ Built in 2.3s

web:build: cache miss, executing...
web:build: > next build
web:build: ✓ Built in 8.5s

api:build: cache miss, executing...
api:build: > nest build
api:build: ✓ Built in 5.1s
```

#### 시나리오 2: 변경되지 않은 패키지 캐시 사용
```gherkin
Given 첫 번째 빌드가 완료되어 있고
When 개발자가 아무 파일도 수정하지 않고 `turbo run build`를 다시 실행하면
Then 모든 패키지가 캐시에서 재사용되어야 한다
And 로그에 "cache hit" 메시지가 표시되어야 한다
And 빌드 시간이 첫 번째 빌드 대비 90% 이상 단축되어야 한다
```

**검증 방법**:
```bash
# 1. 첫 번째 빌드
time turbo run build

# 2. 두 번째 빌드 (캐시)
time turbo run build
```

**예상 출력** (두 번째 빌드):
```
@liar-game/types:build: cache hit, replaying output...
@liar-game/ui:build: cache hit, replaying output...
web:build: cache hit, replaying output...
api:build: cache hit, replaying output...

 Tasks:    6 successful, 6 total
Cached:    6 cached, 6 total
  Time:    0.5s >>> FULL TURBO
```

#### 시나리오 3: 증분 빌드 (Incremental Build)
```gherkin
Given packages/types가 빌드되어 있고
When 개발자가 `packages/types/src/game.ts`를 수정하면
And `turbo run build`를 실행하면
Then packages/types만 재빌드되어야 한다
And apps/web과 apps/api는 캐시에서 재사용되어야 한다
And 빌드 시간이 전체 빌드 대비 70% 이상 단축되어야 한다
```

**검증 방법**:
```bash
# 1. 첫 번째 빌드
turbo run build

# 2. packages/types 수정
echo "// comment" >> packages/types/src/game.ts

# 3. 증분 빌드
time turbo run build
```

**예상 출력**:
```
@liar-game/types:build: cache miss, executing...
@liar-game/types:build: ✓ Built in 1.3s

@liar-game/ui:build: cache hit, replaying output...
web:build: cache hit, replaying output...
api:build: cache hit, replaying output...
```

---

### AC-004: 개발 서버 동시 실행

**우선순위**: High

#### 시나리오 1: web과 api 서버 동시 실행
```gherkin
Given 모든 워크스페이스가 설정되어 있고
When 개발자가 `turbo run dev`를 실행하면
Then web 서버가 http://localhost:3000에서 리스닝해야 한다
And api 서버가 http://localhost:4000에서 리스닝해야 한다
And 두 서버가 동시에 실행되어야 한다
And 종료 전까지 프로세스가 유지되어야 한다
```

**검증 방법**:
```bash
# 1. 개발 서버 실행 (백그라운드)
turbo run dev &

# 2. 10초 대기 (서버 시작 시간)
sleep 10

# 3. 포트 리스닝 확인
lsof -i :3000 | grep LISTEN && echo "✅ web server running"
lsof -i :4000 | grep LISTEN && echo "✅ api server running"

# 4. HTTP 요청 테스트
curl -s http://localhost:3000 | grep "<!DOCTYPE html>" && echo "✅ web accessible"
curl -s http://localhost:4000/health | grep "ok" && echo "✅ api accessible"
```

**예상 출력**:
```
✅ web server running
✅ api server running
✅ web accessible
✅ api accessible
```

#### 시나리오 2: Hot Module Replacement (HMR) 동작
```gherkin
Given 개발 서버가 실행 중이고
When 개발자가 `apps/web/src/app/page.tsx`를 수정하면
Then 브라우저가 자동으로 새로고침되어야 한다
And 수정 사항이 즉시 반영되어야 한다
And 서버 재시작 없이 변경되어야 한다
```

**검증 방법** (수동):
```bash
# 1. 개발 서버 실행
turbo run dev

# 2. 브라우저에서 http://localhost:3000 접속

# 3. apps/web/src/app/page.tsx 수정
echo "<h1>HMR Test</h1>" >> apps/web/src/app/page.tsx

# 4. 브라우저 자동 새로고침 확인 (3초 이내)
```

**예상 동작**:
- Next.js 개발 서버 콘솔: `⚡ Fast Refresh`
- 브라우저: 자동 새로고침 (페이지 깜박임 없음)

#### 시나리오 3: API 서버 자동 재시작
```gherkin
Given 개발 서버가 실행 중이고
When 개발자가 `apps/api/src/main.ts`를 수정하면
Then 서버가 자동으로 재시작되어야 한다
And 재시작 시간이 5초 이내여야 한다
And 재시작 후 HTTP 요청이 정상 동작해야 한다
```

**검증 방법**:
```bash
# 1. 개발 서버 실행
turbo run dev

# 2. API 파일 수정
echo "// comment" >> apps/api/src/main.ts

# 3. 재시작 로그 확인 (nest start --watch)
# 예상 로그: "File change detected. Starting incremental compilation..."
# 예상 로그: "Nest application successfully started"

# 4. API 요청 테스트
curl http://localhost:4000/health
```

---

### AC-005: 성능 기준 충족

**우선순위**: Medium

#### 시나리오 1: 빌드 시간 제약
```gherkin
Given 모든 워크스페이스가 설정되어 있고
When 개발자가 `turbo run build`를 실행하면
Then 개발 모드 빌드 시간이 10초를 초과하지 않아야 한다
And 프로덕션 모드 빌드 시간이 3분을 초과하지 않아야 한다
```

**검증 방법**:
```bash
# 1. 개발 모드 빌드 시간 측정
time turbo run build

# 2. 프로덕션 빌드 시간 측정
NODE_ENV=production time turbo run build
```

**예상 출력**:
```bash
# 개발 모드
real    0m8.5s  # < 10초 ✅

# 프로덕션 모드
real    2m15.3s  # < 3분 ✅
```

#### 시나리오 2: 순환 의존성 없음
```gherkin
Given 모든 워크스페이스가 설정되어 있고
When 개발자가 `npx madge --circular`를 실행하면
Then 순환 의존성이 발견되지 않아야 한다
And "No circular dependencies found" 메시지가 출력되어야 한다
```

**검증 방법**:
```bash
# 1. madge 설치
pnpm add -D -w madge

# 2. 순환 의존성 검사
npx madge --circular --extensions ts,tsx,js,jsx .
```

**예상 출력**:
```
✅ No circular dependencies found!
```

#### 시나리오 3: TypeScript strict mode 적용
```gherkin
Given 모든 워크스페이스가 설정되어 있고
When 개발자가 각 패키지의 tsconfig.json을 확인하면
Then 모든 tsconfig.json에 "strict": true가 설정되어 있어야 한다
And `pnpm run type-check` 실행 시 에러가 없어야 한다
```

**검증 방법**:
```bash
# 1. strict mode 확인
grep -r '"strict": true' packages/*/tsconfig.json apps/*/tsconfig.json

# 2. 타입 체크
turbo run type-check
```

**예상 출력**:
```bash
# 1. grep 결과
packages/types/tsconfig.json:    "strict": true,
packages/ui/tsconfig.json:    "strict": true,
apps/web/tsconfig.json:    "strict": true,
apps/api/tsconfig.json:    "strict": true,

# 2. type-check 결과
✓ @liar-game/types:type-check (1.2s)
✓ web:type-check (3.5s)
✓ api:type-check (2.1s)
```

---

### AC-006: WebSocket 통합 검증

**우선순위**: High

#### 시나리오 1: Socket.IO 서버 연결
```gherkin
Given api 서버가 실행 중이고
When 클라이언트가 Socket.IO로 연결을 시도하면
Then 연결이 성공해야 한다
And 서버 로그에 "Client connected: {id}" 메시지가 출력되어야 한다
And 연결 상태가 "connected"여야 한다
```

**검증 방법** (수동 - Socket.IO Client 테스트):
```typescript
// apps/web/src/test-socket.ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('❌ Connection failed:', err.message);
});
```

**검증 명령**:
```bash
# 1. api 서버 실행
cd apps/api && pnpm run start:dev

# 2. 테스트 클라이언트 실행
cd apps/web && node -r esbuild-register src/test-socket.ts
```

**예상 출력**:
```bash
# 클라이언트
✅ Connected: abc123

# 서버 로그
Client connected: abc123
```

#### 시나리오 2: 공유 타입을 사용한 이벤트 타입 안정성
```gherkin
Given @liar-game/types에 Socket.IO 이벤트 타입이 정의되어 있고
When api 서버의 Gateway에서 타입을 import하면
Then TypeScript 타입 체크가 정상 동작해야 한다
And 이벤트 핸들러의 payload 타입이 자동완성되어야 한다
And 잘못된 이벤트명 사용 시 컴파일 에러가 발생해야 한다
```

**검증 방법**:
```typescript
// apps/api/src/game/game.gateway.ts
import { ServerToClientEvents, ClientToServerEvents } from '@liar-game/types';

@WebSocketGateway()
export class GameGateway {
  @WebSocketServer()
  server: Server<ClientToServerEvents, ServerToClientEvents>;

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, payload: { roomId: string; player: Player }) {
    // TypeScript가 payload 타입을 자동으로 체크
    this.server.to(payload.roomId).emit('playerJoined', payload.player);
  }
}
```

**검증 명령**:
```bash
cd apps/api
pnpm run type-check
```

**예상 결과**: 에러 없음

---

## 3. 성능 및 품질 게이트

### 3.1 빌드 성능

| 항목 | 기준 | 측정 방법 |
|------|------|----------|
| 초기 빌드 시간 | < 3분 | `time turbo run build` |
| 증분 빌드 시간 | < 30초 | types 수정 후 빌드 |
| 캐시 히트율 | > 80% | 두 번째 빌드 시 |
| 메모리 사용량 | < 2GB | `ps aux | grep node` |

### 3.2 개발 경험

| 항목 | 기준 | 측정 방법 |
|------|------|----------|
| HMR 속도 | < 3초 | 파일 수정 후 브라우저 반영 시간 |
| 타입 체크 속도 | < 5초 | `turbo run type-check` |
| 린트 속도 | < 10초 | `turbo run lint` |
| 개발 서버 시작 시간 | < 15초 | `turbo run dev` 후 리스닝까지 |

### 3.3 코드 품질

| 항목 | 기준 | 측정 방법 |
|------|------|----------|
| TypeScript strict mode | 100% | 모든 tsconfig.json |
| 순환 의존성 | 0건 | `madge --circular` |
| 린트 에러 | 0건 | `turbo run lint` |
| 타입 에러 | 0건 | `turbo run type-check` |

---

## 4. 회귀 테스트 (Regression Tests)

### 4.1 자동화된 검증 스크립트

**파일**: `scripts/verify-setup.sh`

```bash
#!/bin/bash
set -e

echo "🔍 Verifying SPEC-SETUP-001..."

# AC-001: Turborepo 설정
echo "✓ Checking turbo.json..."
test -f turbo.json || exit 1
jq . turbo.json > /dev/null || exit 1

# AC-002: pnpm 워크스페이스
echo "✓ Checking pnpm workspace..."
pnpm install
test -L node_modules/@liar-game/types || exit 1

# AC-003: 빌드 파이프라인
echo "✓ Building all packages..."
turbo run build

# AC-004: 타입 체크
echo "✓ Type checking..."
turbo run type-check

# AC-005: 순환 의존성
echo "✓ Checking circular dependencies..."
npx madge --circular --extensions ts,tsx,js,jsx . | grep "No circular" || exit 1

echo "✅ All checks passed!"
```

**사용 방법**:
```bash
chmod +x scripts/verify-setup.sh
./scripts/verify-setup.sh
```

### 4.2 CI/CD 통합

**GitHub Actions 예시**:
```yaml
name: Verify Setup

on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: turbo run build
      - run: turbo run type-check
      - run: turbo run lint
      - run: npx madge --circular --extensions ts,tsx,js,jsx .
```

---

## 5. 예외 상황 및 제약사항

### 5.1 알려진 제약사항

| 제약사항 | 영향 | 회피 방법 |
|---------|------|----------|
| Vercel 배포 불가 | WebSocket 미지원 | Railway/Fly.io 사용 |
| pnpm 7.x 미지원 | 워크스페이스 오류 | pnpm 9.x 명시 |
| macOS 로컬 개발 | 메모리 부족 (8GB) | Node.js heap 옵션 조정 |

### 5.2 제외된 시나리오

다음 시나리오는 별도 SPEC에서 다룹니다:
- **게임 로직 구현** → SPEC-GAME-001
- **데이터베이스 설정** → SPEC-DB-001
- **Kubernetes 배포** → SPEC-DEPLOY-001
- **인증 시스템** → SPEC-AUTH-001

---

## 6. Definition of Done (DoD)

SPEC-SETUP-001이 완료되었다고 판단하는 기준:

### 필수 조건 (Must Have)
- ✅ 모든 AC (AC-001 ~ AC-006) 시나리오 통과
- ✅ `turbo run build` 성공 (< 3분)
- ✅ `turbo run dev` 실행 시 web(3000), api(4000) 리스닝
- ✅ `turbo run type-check` 에러 없음
- ✅ 순환 의존성 0건
- ✅ 스크립트 `verify-setup.sh` 전체 통과

### 권장 조건 (Should Have)
- ✅ README.md에 모노레포 구조 문서화
- ✅ CI/CD 파이프라인 설정 (GitHub Actions)
- ✅ 개발자 온보딩 가이드 작성

### 선택 조건 (Nice to Have)
- ⚪ Turborepo 의존성 그래프 시각화 (turbo run build --graph)
- ⚪ 성능 벤치마크 결과 문서화
- ⚪ Storybook 설정 (packages/ui)

---

## 7. 다음 단계

### 7.1 TDD 구현 단계
```bash
/alfred:2-build SPEC-SETUP-001
```

**진행 순서**:
1. RED: 인수 기준을 테스트 코드로 작성
2. GREEN: 최소 구현으로 테스트 통과
3. REFACTOR: 코드 품질 개선, 중복 제거

### 7.2 문서 동기화
```bash
/alfred:3-sync
```

**작업 내용**:
- Living Document 업데이트
- TAG 체인 검증 (@SPEC → @TEST → @CODE)
- PR Ready 전환

### 7.3 후속 SPEC 작성
- **SPEC-GAME-001**: 게임 로직 (역할 배정, 토론, 투표)
- **SPEC-AUTH-001**: 사용자 인증 (세션, JWT)
- **SPEC-MATCH-001**: 매칭 시스템

---

**작성일**: 2025-10-11
**작성자**: @Goos (via spec-builder 🏗️)
**상태**: Draft (v0.0.1)
**검증자**: (TBD)
