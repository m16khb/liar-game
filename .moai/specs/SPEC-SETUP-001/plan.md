# 구현 계획서 (Implementation Plan)
## SPEC-SETUP-001: Turborepo 모노레포 기반 구조 설정

---

## 1. 개요

### 1.1 목표
Turborepo 기반 모노레포 구조를 구축하여, liar-game 프로젝트의 프론트엔드(Next.js 15)와 백엔드(NestJS 11)가 효율적으로 공유 타입 및 설정을 활용할 수 있는 통합 개발 환경을 제공합니다.

### 1.2 범위
- Turborepo 워크스페이스 초기화
- pnpm 워크스페이스 설정
- apps/web (Next.js 15) 기본 구조
- apps/api (NestJS 11 + Fastify) 기본 구조
- packages/types, config, ui, constants 초기화
- 통합 빌드 파이프라인 설정
- 개발 서버 동시 실행 검증

### 1.3 전제조건
- Node.js 20.x LTS 설치
- pnpm 9.x 설치 (`npm install -g pnpm`)
- Git 저장소 초기화 완료
- .moai/config.json 존재

---

## 2. 구현 우선순위 (Priority-based Milestones)

### Phase 1: 기반 인프라 설정 (우선순위 High)

**목표**: Turborepo + pnpm 워크스페이스 초기화

**작업 항목**:
1. ✅ 루트 `package.json` 생성
   - workspaces 정의
   - 공통 devDependencies 설치
   - scripts 정의 (build, dev, test, lint)

2. ✅ `pnpm-workspace.yaml` 생성
   - apps/* 포함
   - packages/* 포함

3. ✅ `turbo.json` 생성
   - build, dev, test, lint 파이프라인 정의
   - 의존성 체인 설정 (`^build`)
   - 캐싱 전략 (outputs 정의)

4. ✅ 루트 `tsconfig.json` 생성
   - base configuration
   - paths 매핑 (@liar-game/*)

**완료 조건**:
- `pnpm install` 성공
- `turbo run build --dry-run` 파이프라인 유효성 확인
- 디렉토리 구조 준비 완료

**예상 이슈**:
- pnpm 버전 호환성 → pnpm 9.x 명시
- Turborepo 캐싱 오작동 → outputs 경로 정확히 지정

---

### Phase 2: 공유 패키지 초기화 (우선순위 High)

**목표**: packages/types, config, ui, constants 기본 구조 생성

**작업 항목**:

#### 2.1 packages/types
1. ✅ `package.json` 생성
   - name: `@liar-game/types`
   - main: `src/index.ts`
   - TypeScript 의존성

2. ✅ `tsconfig.json` 생성
   - extends: 루트 tsconfig
   - strict mode 활성화

3. ✅ `src/index.ts` 생성
   - game.ts, socket.ts, api.ts export

4. ✅ 핵심 타입 정의
   - `Player`, `GameState`, `PlayerRole`
   - Socket.IO 이벤트 타입 (ServerToClientEvents, ClientToServerEvents)
   - API 요청/응답 타입

#### 2.2 packages/config
1. ✅ `package.json` 생성
   - ESLint, TSConfig 프리셋 export

2. ✅ `eslint/base.js` 생성
   - 공통 ESLint 규칙

3. ✅ `typescript/base.json` 생성
   - 공통 TypeScript 설정

#### 2.3 packages/ui
1. ✅ `package.json` 생성
   - name: `@liar-game/ui`
   - React 의존성

2. ✅ `src/Button.tsx` 생성
   - 기본 버튼 컴포넌트 (샘플)

#### 2.4 packages/constants
1. ✅ `package.json` 생성
   - name: `@liar-game/constants`

2. ✅ `src/game-rules.ts` 생성
   - 게임 상수 (MAX_PLAYERS, ROUND_TIME 등)

3. ✅ `src/socket-events.ts` 생성
   - Socket.IO 이벤트 이름 상수

**완료 조건**:
- 각 패키지에서 `pnpm run build` 성공 (TypeScript 컴파일)
- `packages/types/src/index.ts`에서 모든 타입 export 확인

**예상 이슈**:
- TypeScript 경로 매핑 오류 → tsconfig paths 설정 확인
- 순환 참조 → madge로 검증

---

### Phase 3: apps/web (Next.js 15) 초기화 (우선순위 High)

**목표**: Next.js 15 프로젝트 생성 및 공유 패키지 통합

**작업 항목**:
1. ✅ Next.js 15 프로젝트 생성
   ```bash
   cd apps
   pnpm create next-app@latest web --typescript --app --use-pnpm
   ```

2. ✅ `package.json` 수정
   - 공유 패키지 의존성 추가
     ```json
     {
       "dependencies": {
         "@liar-game/types": "workspace:*",
         "@liar-game/ui": "workspace:*",
         "@liar-game/constants": "workspace:*"
       }
     }
     ```

3. ✅ `next.config.js` 설정
   - `transpilePackages` 추가
   - WebSocket 지원을 위한 standalone 모드

4. ✅ `src/app/page.tsx` 수정
   - `@liar-game/types`에서 타입 import 테스트
   - `@liar-game/ui` 컴포넌트 사용 테스트

5. ✅ `tsconfig.json` 확장
   - `@liar-game/*` 경로 매핑

**완료 조건**:
- `pnpm run dev` 실행 시 http://localhost:3000 접속 성공
- `@liar-game/types` import 에러 없음
- HMR 동작 확인 (파일 수정 시 자동 새로고침)

**예상 이슈**:
- transpilePackages 오류 → Next.js 15.5+ 버전 확인
- 경로 매핑 안 됨 → tsconfig.json의 paths와 next.config.js의 transpilePackages 일치 확인

---

### Phase 4: apps/api (NestJS 11 + Fastify) 초기화 (우선순위 High)

**목표**: NestJS 11 프로젝트 생성 및 Fastify 통합

**작업 항목**:
1. ✅ NestJS CLI 설치 및 프로젝트 생성
   ```bash
   pnpm add -g @nestjs/cli
   cd apps
   nest new api --package-manager pnpm
   ```

2. ✅ Fastify 어댑터 설치
   ```bash
   cd api
   pnpm add @nestjs/platform-fastify fastify
   ```

3. ✅ `src/main.ts` 수정
   - Fastify 어댑터 적용
   - CORS 설정 (http://localhost:3000 허용)
   - 포트 4000 리스닝

4. ✅ Socket.IO Gateway 생성
   ```bash
   nest generate gateway game
   ```

5. ✅ `package.json` 수정
   - 공유 패키지 의존성 추가
     ```json
     {
       "dependencies": {
         "@liar-game/types": "workspace:*",
         "@liar-game/constants": "workspace:*"
       }
     }
     ```

6. ✅ `src/game/game.gateway.ts` 수정
   - `@liar-game/types`에서 Socket.IO 이벤트 타입 import
   - 기본 이벤트 핸들러 구현 (joinRoom, gameAction)

**완료 조건**:
- `pnpm run start:dev` 실행 시 http://localhost:4000 리스닝
- `@liar-game/types` import 에러 없음
- WebSocket 연결 테스트 (curl 또는 Postman WebSocket)

**예상 이슈**:
- Fastify 어댑터 오류 → @nestjs/platform-fastify 버전 확인
- Socket.IO 연결 실패 → CORS 설정 확인

---

### Phase 5: 통합 빌드 파이프라인 검증 (우선순위 Medium)

**목표**: Turborepo 파이프라인 동작 검증

**작업 항목**:
1. ✅ 전체 빌드 테스트
   ```bash
   turbo run build
   ```

2. ✅ 의존성 순서 확인
   - 로그에서 packages/* → apps/* 순서 확인

3. ✅ 캐싱 동작 확인
   - 두 번째 build 실행 시 캐시 히트 확인
   - 로그에 "cache hit" 메시지 확인

4. ✅ 증분 빌드 테스트
   - `packages/types/src/game.ts` 수정
   - `turbo run build` 실행
   - web, api만 재빌드되는지 확인

**완료 조건**:
- `turbo run build` 성공
- 캐시 히트율 80% 이상 (두 번째 빌드 시)
- 증분 빌드 시 관련 패키지만 재빌드

**예상 이슈**:
- 캐시 무효화 → turbo.json의 outputs 경로 확인
- 의존성 체인 오류 → package.json의 dependencies 확인

---

### Phase 6: 개발 서버 동시 실행 검증 (우선순위 Medium)

**목표**: `turbo run dev`로 web, api 동시 실행

**작업 항목**:
1. ✅ `turbo run dev` 실행
   ```bash
   turbo run dev
   ```

2. ✅ 포트 리스닝 확인
   - web: http://localhost:3000
   - api: http://localhost:4000

3. ✅ HMR 동작 확인
   - web: `src/app/page.tsx` 수정 시 자동 새로고침
   - api: `src/main.ts` 수정 시 서버 재시작

4. ✅ WebSocket 연결 테스트
   - web에서 Socket.IO Client 연결
   - api Gateway에서 연결 로그 확인

**완료 조건**:
- web, api 동시 실행 성공
- HMR 동작 확인
- WebSocket 연결 성공

**예상 이슈**:
- 포트 충돌 → 다른 프로세스 종료 (lsof -i :3000, kill -9)
- WebSocket CORS 오류 → api의 CORS 설정 확인

---

### Phase 7: 순환 의존성 검증 (우선순위 Low)

**목표**: 순환 의존성 방지 확인

**작업 항목**:
1. ✅ madge 설치
   ```bash
   pnpm add -D -w madge
   ```

2. ✅ 순환 의존성 검사
   ```bash
   npx madge --circular --extensions ts,tsx,js,jsx .
   ```

3. ✅ 결과 확인
   - 순환 의존성 없으면 "No circular dependencies found" 출력

**완료 조건**:
- 순환 의존성 0건

**예상 이슈**:
- 순환 의존성 발견 → 의존성 구조 재설계

---

## 3. 기술적 접근 방법

### 3.1 Turborepo 파이프라인 설계 전략

**핵심 개념**:
- `^build`: 의존하는 패키지를 먼저 빌드
- `outputs`: 캐싱할 디렉토리 지정 (`.next/`, `dist/`)
- `persistent: true`: 개발 서버 유지 (종료 안 함)

**예시** (turbo.json):
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### 3.2 pnpm 워크스페이스 최적화

**전략**:
- `workspace:*` 프로토콜 사용 (항상 최신 버전)
- 공통 devDependencies는 루트에만 설치
- 각 패키지는 필요한 dependencies만 정의

**예시** (apps/web/package.json):
```json
{
  "dependencies": {
    "@liar-game/types": "workspace:*",
    "@liar-game/ui": "workspace:*"
  }
}
```

### 3.3 TypeScript 경로 매핑

**전략**:
- 루트 tsconfig.json에 paths 정의
- 각 패키지는 extends로 상속
- Next.js는 별도로 next.config.js에 transpilePackages 추가

**예시** (tsconfig.json):
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@liar-game/types": ["packages/types/src"],
      "@liar-game/ui": ["packages/ui/src"],
      "@liar-game/constants": ["packages/constants/src"]
    }
  }
}
```

### 3.4 Next.js 15 + WebSocket 통합

**문제**: Next.js의 serverless 배포(Vercel)는 WebSocket 미지원

**해결책**:
1. **Option A**: Custom Node.js 서버 (권장하지 않음)
   - 복잡도 증가
   - Vercel Edge Functions 미사용

2. **Option B**: WebSocket 서버 분리 (권장)
   - Next.js는 정적 페이지 + API Routes만 담당
   - NestJS API 서버가 WebSocket 전담
   - 클라이언트는 Socket.IO Client로 별도 연결

**선택**: Option B (WebSocket 서버 분리)

**이유**:
- 관심사 분리 (UI vs 실시간 통신)
- 확장성 (WebSocket 서버만 수평 확장 가능)
- 배포 유연성 (Next.js는 Vercel, API는 Railway/Fly.io)

### 3.5 NestJS + Fastify 성능 최적화

**Fastify 선택 이유**:
- Express 대비 2-3배 빠름
- JSON 스키마 기반 검증 (성능 우수)
- Pino 로거 내장 (구조화 로그)

**최적화 전략**:
1. **JSON 스키마 검증**:
   ```typescript
   @UsePipes(new ValidationPipe({ transform: true }))
   createRoom(@Body() dto: CreateRoomDto) {
     // Fastify의 JSON 스키마 자동 검증
   }
   ```

2. **Redis 캐싱**:
   - 게임 세션: Redis (hot data)
   - 히스토리: PostgreSQL (cold data)

3. **수평 확장**:
   - Kubernetes HPA (수평 파드 오토스케일러)
   - Redis Pub/Sub로 WebSocket 메시지 동기화

---

## 4. 아키텍처 설계 방향

### 4.1 레이어드 아키텍처

```
┌───────────────────────────────────────┐
│       Presentation Layer              │
│  (Next.js 15 - SSR/CSR Hybrid)       │
└───────────────────────────────────────┘
              ↓ (REST API, WebSocket)
┌───────────────────────────────────────┐
│       Application Layer               │
│  (NestJS 11 - Business Logic)        │
└───────────────────────────────────────┘
              ↓ (ORM, Redis Client)
┌───────────────────────────────────────┐
│       Data Layer                      │
│  (PostgreSQL, Redis)                 │
└───────────────────────────────────────┘
```

### 4.2 모듈 구조 (NestJS)

```
apps/api/src/
├── main.ts
├── app.module.ts
├── game/
│   ├── game.module.ts
│   ├── game.service.ts
│   ├── game.controller.ts
│   └── game.gateway.ts     # WebSocket
├── match/
│   ├── match.module.ts
│   ├── match.service.ts
│   └── match.controller.ts
├── user/
│   ├── user.module.ts
│   ├── user.service.ts
│   └── user.controller.ts
└── shared/
    ├── redis/
    ├── database/
    └── config/
```

### 4.3 상태 관리 (Next.js)

**클라이언트 상태**:
- React Context API (게임 상태)
- Zustand (글로벌 상태) - 선택적

**서버 상태**:
- TanStack Query (React Query) - API 캐싱
- Socket.IO Client - 실시간 동기화

**예시** (apps/web/src/lib/game-context.tsx):
```typescript
import { createContext, useContext, useState } from 'react';
import { GameState } from '@liar-game/types';

const GameContext = createContext<{
  gameState: GameState | null;
  setGameState: (state: GameState) => void;
} | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null);

  return (
    <GameContext.Provider value={{ gameState, setGameState }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
}
```

---

## 5. 리스크 및 대응 방안

### 5.1 기술 리스크

| 리스크 | 영향도 | 발생 확률 | 대응 방안 |
|--------|--------|-----------|-----------|
| Turborepo 캐싱 오작동 | 중 | 중 | outputs 경로 정확히 지정, `.turbo/` 캐시 초기화 |
| pnpm 호환성 문제 | 고 | 낮 | pnpm 9.x 명시, lockfile 버전 관리 |
| Next.js 15 버그 | 중 | 중 | LTS 버전 사용 (15.5+), 패치 버전 즉시 업데이트 |
| Fastify 학습 곡선 | 낮 | 중 | 공식 문서 참조, NestJS 예제 활용 |
| 순환 의존성 | 고 | 낮 | madge로 CI/CD 검증, 의존성 그래프 시각화 |

### 5.2 성능 리스크

| 리스크 | 영향도 | 발생 확률 | 대응 방안 |
|--------|--------|-----------|-----------|
| 빌드 시간 초과 | 중 | 중 | Turborepo 캐싱 최적화, 증분 빌드 활용 |
| HMR 느림 | 낮 | 낮 | Next.js Turbopack 활성화 (15.5+) |
| 개발 서버 메모리 부족 | 중 | 낮 | Node.js `--max-old-space-size=4096` 옵션 |

### 5.3 협업 리스크

| 리스크 | 영향도 | 발생 확률 | 대응 방안 |
|--------|--------|-----------|-----------|
| 패키지 버전 불일치 | 고 | 중 | pnpm-lock.yaml 커밋, 자동 업데이트 금지 |
| 타입 불일치 | 중 | 중 | `packages/types` 단일 진실 공급원, CI/CD 타입 체크 |
| 디렉토리 구조 혼란 | 낮 | 낮 | README.md에 명확히 문서화 |

---

## 6. 검증 및 테스트 전략

### 6.1 단위 테스트

**대상**:
- packages/types의 타입 유효성 (TypeScript 컴파일 성공)
- packages/constants의 상수 무결성

**도구**:
- TypeScript 컴파일러 (`tsc --noEmit`)

### 6.2 통합 테스트

**대상**:
- Turborepo 파이프라인 동작
- pnpm 워크스페이스 의존성 해결
- 증분 빌드 동작

**도구**:
- Jest (또는 Vitest)

**예시 테스트**:
```typescript
// tests/turborepo.test.ts
describe('Turborepo Pipeline', () => {
  it('should build all packages in correct order', () => {
    // turbo run build --dry-run 실행
    // 의존성 순서 확인 (packages/* → apps/*)
  });

  it('should cache build outputs', () => {
    // 첫 번째 빌드
    // 두 번째 빌드
    // 캐시 히트 확인
  });
});
```

### 6.3 E2E 테스트 (추후)

**대상**:
- Next.js 페이지 렌더링
- API 엔드포인트 응답
- WebSocket 연결

**도구**:
- Playwright (웹)
- Jest + Supertest (API)

---

## 7. 참조 문서 및 리소스

### 7.1 공식 문서
- [Turborepo 공식 문서](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Next.js 15 문서](https://nextjs.org/docs)
- [NestJS + Fastify](https://docs.nestjs.com/techniques/performance#fastify)

### 7.2 내부 문서
- `.moai/memory/development-guide.md` - TRUST 원칙
- `docs/liar_game_proposal.md` - 기술 스택 (섹션 8)
- `.moai/project/tech.md` - 기술 스택 상세

### 7.3 코드 예시
- [Turborepo Examples](https://github.com/vercel/turbo/tree/main/examples)
- [NestJS Socket.IO](https://github.com/nestjs/nest/tree/master/sample/02-gateways)

---

## 8. 다음 단계

### 8.1 즉시 진행
- `/alfred:2-build SPEC-SETUP-001` 실행
- TDD 단계 진입 (RED → GREEN → REFACTOR)

### 8.2 후속 SPEC 작성
- **GAME-001**: 게임 로직 (역할 배정, 토론, 투표)
- **AUTH-001**: 사용자 인증 (세션, JWT)
- **MATCH-001**: 매칭 시스템 (빠른 매칭, 코드 입력)
- **DEPLOY-001**: Kubernetes 배포 (K3s on Mac mini M4)

### 8.3 문서 동기화
- `/alfred:3-sync` 실행
- TAG 체인 검증
- Living Document 업데이트

---

**작성일**: 2025-10-11
**작성자**: @Goos (via spec-builder 🏗️)
**상태**: Draft (v0.0.1)
