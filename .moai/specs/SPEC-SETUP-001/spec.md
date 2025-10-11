---
# 필수 필드 (7개)
id: SETUP-001
version: 0.1.0
status: completed
created: 2025-10-11
updated: 2025-10-11
author: @Goos
priority: critical

# 선택 필드 - 분류/메타
category: feature
labels:
  - infrastructure
  - monorepo
  - turborepo
  - next.js
  - nestjs

# 선택 필드 - 범위 (영향 분석)
scope:
  packages:
    - apps/web
    - apps/api
    - packages/types
    - packages/config
    - packages/ui
    - packages/constants
---

# @SPEC:SETUP-001: Turborepo 모노레포 기반 구조 설정

## HISTORY

### v0.0.1 (2025-10-11)
- **INITIAL**: Turborepo 모노레포 기반 구조 설정 명세 최초 작성
- **AUTHOR**: @Goos
- **SCOPE**: apps/web (Next.js 15), apps/api (NestJS 11), 공유 패키지 (types, config, ui, constants)
- **CONTEXT**: liar-game 웹 기반 실시간 게임 프로젝트의 기반 인프라 설정

### v0.1.0 (2025-10-11)
- **COMPLETED**: TDD 구현 완료 (RED → GREEN → REFACTOR)
- **TESTS**: 26개 테스트 케이스 100% 통과
- **TRUST**: 92점 (PASS)
- **SCOPE**: 모노레포 구조, Turborepo 파이프라인, apps/web (Next.js 15), apps/api (NestJS 11), 공유 패키지 (types, config, ui, constants)
- **TAG CHAIN**: @SPEC:SETUP-001 → @TEST:SETUP-001 (5 files) → @CODE:SETUP-001 (19 files) → @DOC:SETUP-001 (Living Document)

---

## 1. 개요

### 1.1 목적
liar-game 프로젝트의 모노레포 기반 인프라를 구축하여, 프론트엔드(Next.js 15)와 백엔드(NestJS 11)가 공유 타입 및 상수를 효율적으로 활용할 수 있는 통합 개발 환경을 제공합니다.

### 1.2 범위
- Turborepo 기반 워크스페이스 설정
- apps/web (Next.js 15 SSR/CSR Hybrid)
- apps/api (NestJS 11 + Fastify + Socket.IO)
- packages/types (공유 TypeScript 타입 정의)
- packages/config (ESLint, TSConfig, Prettier 설정)
- packages/ui (공유 React 컴포넌트)
- packages/constants (게임 상수, 이벤트 정의)
- 통합 빌드 파이프라인 및 개발 서버 설정

### 1.3 제외사항
- 게임 로직 구현 (별도 SPEC)
- 데이터베이스 스키마 설계 (별도 SPEC)
- 배포 전략 상세 (별도 SPEC)

---

## 2. EARS 요구사항

### 2.1 Environment (환경 및 전제조건)

**개발 환경**:
- Node.js 20.x LTS (필수)
- pnpm 9.x (워크스페이스 매니저)
- Turborepo 2.x
- TypeScript 5.x
- Git 2.x

**시스템 요구사항**:
- macOS / Linux / Windows (WSL2)
- 최소 RAM: 8GB (권장 16GB)
- 디스크 여유 공간: 5GB 이상

**기술 스택 제약**:
- Next.js 15.5+ (Turbopack 지원)
- NestJS 11.x (Fastify 어댑터 필수)
- TypeScript strict mode 강제

### 2.2 Assumptions (가정사항)

1. **개발자 역량**: TypeScript, React, NestJS 기본 지식 보유
2. **브라우저 지원**: Chrome 90+, Safari 14+, Firefox 88+ (WebSocket, WebRTC 지원)
3. **배포 환경**: Custom Node.js 서버 (Vercel 불가 - WebSocket 제약)
4. **네트워크**: 개발 환경에서 localhost:3000 (web), localhost:4000 (api) 포트 사용 가능

### 2.3 Requirements (기능 요구사항)

#### Ubiquitous (보편적 요구사항)

**REQ-001**: 시스템은 Turborepo 기반 모노레포 구조를 제공해야 한다.
- **근거**: 코드 공유, 의존성 관리, 빌드 최적화
- **검증**: `turbo.json` 파일 존재 및 파이프라인 유효성

**REQ-002**: 시스템은 공유 타입 정의 패키지(`packages/types`)를 제공해야 한다.
- **근거**: 프론트엔드-백엔드 간 타입 안전성 보장
- **검증**: `packages/types/src/index.ts` 존재 및 apps에서 import 성공

**REQ-003**: 시스템은 통합 빌드 파이프라인을 제공해야 한다.
- **근거**: 의존성 순서 자동 관리, 캐싱 최적화
- **검증**: `turbo run build` 명령 성공 및 의존성 순서 준수

**REQ-004**: 시스템은 독립적인 개발 서버를 동시 실행할 수 있어야 한다.
- **근거**: 프론트엔드-백엔드 병렬 개발
- **검증**: `turbo run dev` 시 web(3000), api(4000) 포트 동시 리스닝

#### Event-driven (이벤트 기반 요구사항)

**REQ-005**: WHEN 개발자가 `packages/types`를 수정하면, 시스템은 의존하는 앱(web, api)만 재빌드해야 한다.
- **근거**: 증분 빌드를 통한 개발 속도 향상
- **검증**: types 수정 시 web, api만 rebuild 로그 확인

**REQ-006**: WHEN 개발자가 `turbo run build`를 실행하면, 시스템은 의존성 순서대로 빌드가 진행되어야 한다.
- **근거**: 순환 의존성 방지, 빌드 무결성
- **검증**: build 로그에서 packages/types → apps/* 순서 확인

**REQ-007**: WHEN 개발자가 패키지를 추가/제거하면, 시스템은 pnpm install로 워크스페이스를 올바르게 업데이트해야 한다.
- **근거**: 의존성 동기화
- **검증**: `pnpm-lock.yaml` 업데이트 및 node_modules 정합성

#### State-driven (상태 기반 요구사항)

**REQ-008**: WHILE 개발 모드일 때, 시스템은 Hot Module Replacement(HMR)를 지원해야 한다.
- **근거**: 빠른 피드백 루프, 개발 생산성
- **검증**: 파일 수정 시 브라우저 자동 새로고침 확인 (web), 서버 재시작 (api)

**REQ-009**: WHILE 빌드 시, 시스템은 병렬 빌드로 성능을 최적화해야 한다.
- **근거**: CI/CD 시간 단축
- **검증**: `turbo run build` 로그에서 병렬 태스크 실행 확인

**REQ-010**: WHILE 프로덕션 모드일 때, 시스템은 번들 최적화 및 압축을 수행해야 한다.
- **근거**: 배포 크기 최소화, 로딩 속도 향상
- **검증**: `.next/` 및 `dist/` 디렉토리 크기, Lighthouse 성능 점수 85+

### 2.4 Constraints (제약사항)

**CON-001**: 각 패키지는 독립적으로 테스트 가능해야 한다.
- **이유**: 유닛 테스트 격리, CI/CD 병렬화
- **구현**: 각 패키지에 `package.json` 내 `test` 스크립트 존재

**CON-002**: 순환 의존성이 발생하지 않아야 한다.
- **이유**: 빌드 무한 루프 방지, 명확한 아키텍처
- **검증**: `turbo run build` 실패 시 에러 메시지 확인, 또는 `madge` 도구 사용

**CON-003**: 빌드 시간은 개발 모드에서 10초, 프로덕션 모드에서 3분을 초과하지 않아야 한다.
- **이유**: 개발 생산성, CI/CD 효율성
- **측정**: `time turbo run build` 명령 결과

**CON-004**: 모든 패키지는 TypeScript strict mode를 사용해야 한다.
- **이유**: 타입 안전성, 런타임 오류 방지
- **검증**: 각 `tsconfig.json`에 `"strict": true` 존재

---

## 3. 상세 명세 (Specifications)

### 3.1 디렉토리 구조

```
liar-game/
├── apps/
│   ├── web/                    # Next.js 15 (SSR/CSR Hybrid)
│   │   ├── src/
│   │   │   ├── app/           # App Router
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── lib/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.js
│   │   └── .eslintrc.js
│   └── api/                    # NestJS 11 + Fastify
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── game/          # 게임 모듈
│       │   ├── match/         # 매칭 모듈
│       │   ├── user/          # 사용자 모듈
│       │   └── gateway/       # WebSocket Gateway
│       ├── test/
│       ├── package.json
│       ├── tsconfig.json
│       └── nest-cli.json
├── packages/
│   ├── types/                  # 공유 타입 정의
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── game.ts       # 게임 상태, 플레이어 타입
│   │   │   ├── socket.ts     # Socket.IO 이벤트 타입
│   │   │   └── api.ts        # REST API 타입
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── config/                 # ESLint, TSConfig, Prettier
│   │   ├── eslint/
│   │   │   ├── base.js
│   │   │   ├── nextjs.js
│   │   │   └── nestjs.js
│   │   ├── typescript/
│   │   │   ├── base.json
│   │   │   ├── nextjs.json
│   │   │   └── nestjs.json
│   │   └── package.json
│   ├── ui/                     # 공유 React 컴포넌트
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── constants/              # 게임 상수, 이벤트 정의
│       ├── src/
│       │   ├── index.ts
│       │   ├── game-rules.ts
│       │   └── socket-events.ts
│       ├── package.json
│       └── tsconfig.json
├── turbo.json                  # Turborepo 파이프라인
├── package.json                # Workspace 루트
├── pnpm-workspace.yaml         # pnpm 워크스페이스
└── tsconfig.json               # 루트 TypeScript 설정
```

### 3.2 Turborepo 파이프라인 설정 (turbo.json)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

**핵심 개념**:
- `^build`: 의존하는 패키지의 build를 먼저 실행
- `outputs`: 캐싱할 디렉토리 지정
- `persistent: true`: 개발 서버 유지 (종료 안 함)

### 3.3 의존성 그래프

```
apps/web → packages/types
         → packages/ui
         → packages/config
         → packages/constants

apps/api → packages/types
         → packages/config
         → packages/constants

packages/ui → packages/types
            → packages/config
```

**검증 방법**:
```bash
# 순환 의존성 확인
npx madge --circular --extensions ts,tsx,js,jsx .

# Turborepo 의존성 시각화
turbo run build --graph
```

### 3.4 공유 타입 예시 (packages/types/src/game.ts)

```typescript
export enum PlayerRole {
  CITIZEN = 'CITIZEN',
  LIAR = 'LIAR'
}

export interface Player {
  id: string;
  username: string;
  role: PlayerRole;
  isReady: boolean;
  votedFor: string | null;
}

export interface GameState {
  roomId: string;
  round: number;
  phase: 'WAITING' | 'DISCUSSION' | 'VOTING' | 'RESULT';
  keyword: string;
  players: Player[];
  timeRemaining: number;
}

export interface VoteResult {
  targetPlayerId: string;
  voteCount: number;
  isLiarFound: boolean;
}
```

### 3.5 Next.js 15 설정 (apps/web/next.config.js)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@liar-game/types', '@liar-game/ui', '@liar-game/constants'],

  // WebSocket을 위한 Custom Server 필요 (Vercel 불가)
  // standalone 모드로 배포
  output: 'standalone',

  // 성능 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

module.exports = nextConfig;
```

### 3.6 NestJS 11 + Fastify 설정 (apps/api/src/main.ts)

```typescript
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true })
  );

  // CORS 설정 (Next.js 프론트엔드 허용)
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(4000, '0.0.0.0');
  console.log(`🚀 API Server running on http://localhost:4000`);
}

bootstrap();
```

### 3.7 Socket.IO 통합 (apps/api/src/gateway/game.gateway.ts)

```typescript
import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameState, Player } from '@liar-game/types';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, payload: { roomId: string; player: Player }) {
    client.join(payload.roomId);
    this.server.to(payload.roomId).emit('playerJoined', payload.player);
  }

  @SubscribeMessage('gameAction')
  handleGameAction(client: Socket, payload: { roomId: string; action: any }) {
    // 게임 로직 처리 (별도 SPEC)
    this.server.to(payload.roomId).emit('gameUpdate', { /* state */ });
  }
}
```

---

## 4. 기술적 제약사항 및 고려사항

### 4.1 Next.js 15 + WebSocket 통합

**문제**: Next.js의 serverless 배포 환경(Vercel)은 WebSocket을 지원하지 않습니다.

**해결책**:
1. Custom Node.js 서버 사용 (`next start` 대신 `node server.js`)
2. 또는 별도 WebSocket 서버 분리 (권장)
3. 배포 플랫폼: AWS Fargate, Railway, Fly.io 등

**참고 코드** (apps/web/server.js):
```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Next.js server ready on http://localhost:3000');
  });
});
```

### 4.2 NestJS + Fastify 성능 최적화

**성능 비교** (기준: 초당 요청 처리량):
- Express: ~30,000 req/s
- Fastify: ~70,000 req/s (2.3배 빠름)

**최적화 전략**:
1. JSON 스키마 검증 (Fastify 내장)
2. Pino 로거 사용 (JSON 구조화 로그)
3. Redis 캐싱 (세션, 게임 상태)

### 4.3 공유 타입 관리 전략

**중요**: `packages/types`는 프론트엔드-백엔드 간 Single Source of Truth입니다.

**규칙**:
1. 모든 Socket.IO 이벤트 타입을 `packages/types/src/socket.ts`에 정의
2. API 요청/응답 타입을 `packages/types/src/api.ts`에 정의
3. 게임 도메인 타입을 `packages/types/src/game.ts`에 정의

**예시** (packages/types/src/socket.ts):
```typescript
export interface ServerToClientEvents {
  playerJoined: (player: Player) => void;
  gameStart: (state: GameState) => void;
  gameUpdate: (state: GameState) => void;
  gameEnd: (result: VoteResult) => void;
}

export interface ClientToServerEvents {
  joinRoom: (data: { roomId: string; player: Player }) => void;
  vote: (data: { targetPlayerId: string }) => void;
  guessKeyword: (keyword: string) => void;
}
```

---

## 5. Traceability (추적성)

### 5.1 TAG 체인

- **@SPEC:SETUP-001**: 이 문서
- **@TEST:SETUP-001**: TDD 단계에서 작성 예정
  - `tests/turborepo.test.ts` - Turborepo 파이프라인 검증
  - `tests/workspace.test.ts` - pnpm 워크스페이스 검증
  - `tests/dependency-graph.test.ts` - 순환 의존성 검증
- **@CODE:SETUP-001**: TDD 구현 단계에서 작성 예정
  - `turbo.json` - Turborepo 설정
  - `pnpm-workspace.yaml` - pnpm 워크스페이스 설정
  - `apps/web/next.config.js` - Next.js 설정
  - `apps/api/src/main.ts` - NestJS 엔트리포인트
  - `packages/types/src/index.ts` - 공유 타입 정의
- **@DOC:SETUP-001**: 문서 동기화 단계에서 작성 예정
  - `docs/architecture/monorepo.md` - 모노레포 구조 설명서

### 5.2 참조 문서

- `docs/liar_game_proposal.md` - 프로젝트 기획서 (기술 스택 섹션 8.1-8.3)
- `.moai/memory/development-guide.md` - TRUST 원칙, @TAG 시스템
- `.moai/project/tech.md` - 기술 스택 상세

### 5.3 의존성 SPEC

- 없음 (최초 기반 인프라 설정)

### 5.4 차단하는 SPEC

- 모든 후속 SPEC (게임 로직, 인증, 매칭 등)은 이 SPEC 완료 후 시작 가능

---

## 6. 검증 및 인수 기준

상세한 인수 기준은 `acceptance.md`를 참조하세요.

**핵심 검증 항목**:
1. ✅ `turbo run build` 성공 (의존성 순서 준수)
2. ✅ `turbo run dev` 실행 시 web(3000), api(4000) 동시 리스닝
3. ✅ `packages/types` 수정 시 web, api만 재빌드
4. ✅ 순환 의존성 없음 (`madge --circular` 결과 clean)
5. ✅ 빌드 시간: 개발 모드 10초 이내, 프로덕션 3분 이내

---

## 7. 다음 단계

1. **TDD 구현** (`/alfred:2-build SPEC-SETUP-001`)
   - RED: Turborepo 파이프라인 테스트 작성
   - GREEN: 최소 구조 구현 (turbo.json, pnpm-workspace.yaml)
   - REFACTOR: 패키지 구조 최적화

2. **문서 동기화** (`/alfred:3-sync`)
   - Living Document 업데이트
   - TAG 체인 검증
   - PR Ready 전환

3. **후속 SPEC 작성**
   - GAME-001: 게임 로직 (역할 배정, 토론, 투표)
   - AUTH-001: 사용자 인증 (세션, JWT)
   - MATCH-001: 매칭 시스템 (빠른 매칭, 코드 입력)

---

**문서 메타데이터**:
- **작성일**: 2025-10-11
- **최종 수정일**: 2025-10-11
- **작성자**: @Goos (via spec-builder 🏗️)
- **리뷰어**: (TBD)
- **승인자**: (TBD)
