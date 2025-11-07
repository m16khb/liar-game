# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## 언어 및 커뮤니케이션 규칙

**모든 사고 과정과 응답은 한글로 작성합니다.**

- 코드 주석, 커밋 메시지, 문서 작성 시 한글 우선 사용
- 기술 용어는 번역이 어색한 경우 영어 그대로 사용 (API, WebSocket, DTO 등)
- 변수명, 함수명, 클래스명은 영어 사용

## 개발 환경 설정

```bash
# 의존성 설치
pnpm install

# 인프라 시작 (PostgreSQL, Redis, Nginx, MinIO)
docker compose up -d

# 데이터베이스 마이그레이션
cd apps/api && pnpm migration:run
```

## 핵심 개발 명령어

```bash
# 전체 개발 서버 실행
pnpm turbo dev
# → API: http://localhost:4000 (Swagger: /api/docs)
# → Web: http://localhost:3000

# 빌드
pnpm turbo build

# 테스트 (unit test only)
pnpm turbo test
pnpm turbo test -- --coverage

# 개별 패키지 테스트
pnpm --filter @liar-game/api test

# 코드 품질 검사
pnpm turbo lint
pnpm turbo type-check
```

## 아키텍처 개요

### 기술 스택
- **모노레포**: Turborepo + pnpm
- **백엔드**: NestJS 11 + Fastify (Socket.IO는 향후 확장 예정)
- **데이터베이스**: MySQL v8 LTS + TypeORM (영속 데이터) + Redis v8 LTS (세션/캐시)
- **인증**: Supabase 기반 소셜 로그인 + Email 로그인

### 핵심 모듈 구조
- **auth**: Supabase 인증 시스템 (Google, GitHub, Discord OAuth + Email/Password)
- **room**: 게임 방 관리 및 실시간 WebSocket 통신
- **게임 로직**: 서버 권한 방식의 실시간 게임 상태 관리

### 데이터베이스 아키텍처 (TypeORM)
- **Entity 기반**: `apps/api/src/auth/entities/` - User, RefreshToken 등
- **Repository Pattern**: TypeORM Repository 추상화 계층
- **Migration 관리**: MySQL 스키마 버전 관리
- **연결 풀링**: 동시 게임 세션 대비 최적화

### 인증 시스템 (Supabase)
- **소셜 로그인**: Google, GitHub, Discord OAuth 2.0
- **Email 로그인**: 비밀번호 기반 전통 인증
- **JWT 토큰**: Supabase에서 발급/관리
- **세션 관리**: Redis 기반 세션 저장소
- **보안**: Row Level Security (RLS) + PKCE flow

### 실시간 통신 아키텍처
- **Socket.IO Gateway**: 방 기반 격리 통신 채널
- **서버 권한 모델**: 게임 상태는 서버에서 관리
- **Optimistic Updates**: 낙관적 업데이트와 롤백 지원

## 테스트 전략 (Unit Test Only)

**프로젝트 헌법**: 단위 테스트만 허용, 통합 테스트는 WebSocket 시나리오로 제한

### NestJS 단위 테스트 모범 사례

**Service Layer 테스트**:
```typescript
// apps/api/test/auth/auth.service.test.ts
describe('AuthService', () => {
  let service: AuthService;
  let mockRepository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockRepository }
      ]
    }).compile();

    service = module.get(AuthService);
  });

  describe('validateUser', () => {
    it('유효한 자격증명 시 사용자 반환', async () => {
      // 🔴 RED: 실패하는 테스트 작성
      // 🟢 GREEN: 최소한의 통과 코드 작성
      // ♻️ REFACTOR: 코드 품질 개선
    });
  });
});
```

**Controller 테스트 (Fastify)**:
```typescript
// apps/api/test/auth/auth.controller.test.ts
describe('AuthController', () => {
  let controller: AuthController;
  let mockService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    controller = new AuthController(mockService);
  });

  it('POST /auth/login - JWT 반환', async () => {
    const mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn()
    } as any;

    await controller.login(mockLoginDto, mockReply);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({ access_token: expect.any(String) })
    );
  });
});
```

**Gateway 테스트**:
```typescript
// apps/api/test/room/room.gateway.test.ts
describe('RoomGateway', () => {
  let gateway: RoomGateway;
  let mockService: jest.Mocked<RoomService>;

  beforeEach(async () => {
    gateway = new RoomGateway(mockService);
  });

  it('handleJoinRoom - 방 참가 처리', async () => {
    const mockClient = {
      join: jest.fn(),
      emit: jest.fn()
    } as any;

    await gateway.handleJoinRoom(mockClient, { roomCode: 'ABC123' });
    expect(mockClient.join).toHaveBeenCalledWith('ABC123');
  });
});
```

### 테스트 설정 가이드라인
- **위치**: `apps/api/test/**/*.test.ts`
- **프레임워크**: Jest + ts-jest
- **목 패턴**: `jest.Mocked<T>` 사용
- **데이터베이스**: SQLite 메모리 또는 Repository 모킹
- **커버리지 목표**: 85%+

## 주요 패턴

### Service Layer Pattern
- `apps/api/src/auth/auth.service.ts`: JWT + Supabase 이중 인증
- `apps/api/src/auth/session.service.ts`: Redis 세션 관리
- `apps/api/src/room/room.service.ts`: 게임 방 생명주기

### Repository Pattern
- Entity: `apps/api/src/auth/entities/`
- TypeORM Repository 추상화

### Gateway Pattern
- `apps/api/src/room/room.gateway.ts`: WebSocket 이벤트 처리
- 방 기반 메시징 격리

### DTO Pattern
- `apps/api/src/auth/dto/`, `apps/api/src/room/dto/`
- class-validator 자동 검증

## 성능 요구사항
- API 응답시간: <50ms
- WebSocket 지연시간: <10ms
- 메모리 제한: MySQL 1GB, Redis 512MB

## 환경 변수 필수 설정
```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=liaruser
DB_PASSWORD=change-this-password
DB_NAME=liardb

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=change-this-redis-password

# JWT
JWT_SECRET=your-jwt-secret

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Active Technologies
- TypeScript 5.7.x (Node.js 25.1.0) + React 18 + Compiler, NestJS 11.x + Fastify, Socket.IO, Supabase Auth (001-project-foundation)
- MySQL v8 LTS (영구 저장), Redis v8 LTS (세션/캐싱) (001-project-foundation)
- TypeScript 5.7.x (Node.js 25.1.0) + React 18 + Compiler, NestJS 11.x + Fastify, Socket.IO, Supabase Auth, TypeORM (FK 제약 조건 없음, 마이그레이션 필수) (001-supabase-auth)

## Recent Changes
- 001-project-foundation: Added TypeScript 5.7.x (Node.js 25.1.0) + React 18 + Compiler, NestJS 11.x + Fastify, Socket.IO, Supabase Auth
