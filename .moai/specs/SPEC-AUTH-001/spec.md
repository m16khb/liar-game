---
# 필수 필드 (7개)
id: AUTH-001
version: 0.0.1
status: draft
created: 2025-10-11
updated: 2025-10-11
author: @Goos
priority: high

# 선택 필드 - 분류/메타
category: security
labels:
  - authentication
  - jwt
  - session
  - oauth
  - redis

# 선택 필드 - 관계
depends_on:
  - SETUP-001

# 선택 필드 - 범위
scope:
  packages:
    - apps/api/src/auth
    - packages/types/src/auth.ts
    - packages/constants/src/auth-constants.ts
  files:
    - auth.service.ts
    - auth.controller.ts
    - jwt.strategy.ts
    - session.service.ts
---

# @SPEC:AUTH-001: 사용자 인증 및 세션 관리

## HISTORY

### v0.0.1 (2025-10-11)
- **INITIAL**: 사용자 인증 및 세션 관리 명세 최초 작성
- **AUTHOR**: @Goos
- **SCOPE**: 게스트 인증, 회원가입/로그인, JWT 토큰, Redis 세션, OAuth 통합
- **CONTEXT**: 라이어 게임의 제로 프릭션 진입을 위한 인증 시스템 구축

---

## 1. 개요

### 1.1 목적
웹 기반 라이어 게임에서 **제로 프릭션 진입**을 실현하기 위해, 게스트 인증부터 본격적인 회원가입/로그인까지 단계적 인증 시스템을 구축합니다. URL 클릭 후 3초 만에 게임 시작 가능한 UX를 제공하면서, 사용자 데이터 영속성과 보안을 보장합니다.

### 1.2 범위
- **게스트 인증**: 닉네임만으로 임시 세션 생성 (Redis 기반)
- **회원가입/로그인**: 이메일+비밀번호 인증 (PostgreSQL 영구 저장)
- **JWT 토큰 관리**: 액세스/리프레시 토큰 쌍 발급 및 갱신
- **세션 관리**: Redis 기반 Hot Data 저장 (TTL 관리)
- **게스트 전환**: 게스트 유저가 등록 유저로 전환 (프로그레스 유지)
- **OAuth 통합** (Phase 2): Google, Kakao, Discord 소셜 로그인

### 1.3 제외사항
- **비밀번호 재설정**: 별도 SPEC (AUTH-002)
- **다중 기기 세션 관리**: 별도 SPEC (AUTH-003)
- **2FA (이중 인증)**: 별도 SPEC (AUTH-004)

---

## 2. EARS 요구사항

### 2.1 Environment (환경 및 전제조건)

**개발 환경**:
- NestJS 11.x + Fastify (백엔드)
- PostgreSQL 16.x (영구 저장)
- Redis 7.x (세션 캐싱)
- Passport.js (인증 전략)
- bcrypt (비밀번호 해싱)

**시스템 요구사항**:
- HTTPS 필수 (프로덕션)
- Redis 가용성 99.9% (세션 유실 방지)
- PostgreSQL 가용성 99.95%

**기술 스택 제약**:
- bcrypt salt rounds ≥12
- JWT 액세스 토큰 TTL: 15분
- JWT 리프레시 토큰 TTL: 7일
- 게스트 세션 TTL: 7일

### 2.2 Assumptions (가정사항)

1. **게스트 플레이어 비율**: 초기 사용자의 80%가 게스트로 시작
2. **전환율**: 게스트 → 등록 전환율 15-20% 목표
3. **동시 접속**: 피크 시간대 동접 1,000명 처리 가능
4. **네트워크**: HTTPS TLS 1.2+ 지원 브라우저

### 2.3 Requirements (기능 요구사항)

#### Ubiquitous (보편적 요구사항)

**REQ-001**: 시스템은 게스트 인증 기능을 제공해야 한다.
- **근거**: 제로 프릭션 진입, 앱 다운로드 장벽 제거
- **검증**: 닉네임 입력 시 임시 세션 ID 생성 및 JWT 발급

**REQ-002**: 시스템은 이메일+비밀번호 회원가입 기능을 제공해야 한다.
- **근거**: 사용자 데이터 영속성, 크로스 디바이스 지원
- **검증**: 유효한 이메일 형식, 비밀번호 8자 이상, bcrypt 해싱

**REQ-003**: 시스템은 JWT 기반 인증 토큰을 발급해야 한다.
- **근거**: Stateless 인증, 수평 확장 가능
- **검증**: 액세스 토큰(15분) + 리프레시 토큰(7일) 쌍 생성

**REQ-004**: 시스템은 Redis 기반 세션 관리를 제공해야 한다.
- **근거**: 빠른 조회 (<10ms), Hot Data 최적화
- **검증**: 세션 키 `session:{userId}` 조회 성공, TTL 자동 갱신

#### Event-driven (이벤트 기반 요구사항)

**REQ-005**: WHEN 게스트 유저가 게임에 입장하면, 시스템은 임시 세션을 생성해야 한다.
- **근거**: 빠른 게임 시작, 사용자 식별
- **검증**: 닉네임 → UUID 생성 → Redis 세션 저장 → JWT 발급

**REQ-006**: WHEN 등록 유저가 로그인하면, 시스템은 자격증명을 검증하고 토큰을 발급해야 한다.
- **근거**: 보안, 사용자 인증
- **검증**: bcrypt 비밀번호 검증 → PostgreSQL 조회 → JWT 발급

**REQ-007**: WHEN 액세스 토큰이 만료되면, 시스템은 리프레시 토큰으로 갱신해야 한다.
- **근거**: 사용자 재로그인 불필요, UX 향상
- **검증**: 리프레시 토큰 유효성 검증 → 새 액세스 토큰 발급

**REQ-008**: WHEN 게스트 유저가 회원가입하면, 시스템은 기존 프로그레스를 유지하며 전환해야 한다.
- **근거**: 데이터 유실 방지, 전환율 향상
- **검증**: 게스트 세션 ID → 등록 유저 ID 매핑, 게임 히스토리 이관

#### State-driven (상태 기반 요구사항)

**REQ-009**: WHILE 인증된 상태일 때, 시스템은 모든 API 요청에 JWT를 첨부해야 한다.
- **근거**: 인증 상태 유지, 보안
- **검증**: Authorization 헤더 `Bearer <token>` 존재

**REQ-010**: WHILE WebSocket 연결 시, 시스템은 JWT를 검증하고 세션을 동기화해야 한다.
- **근거**: Socket.IO 보안, 실시간 인증
- **검증**: 핸드셰이크 시 JWT 검증 → `socket.data.user` 설정

**REQ-011**: WHILE 비활성 세션일 때, 시스템은 자동으로 정리해야 한다.
- **근거**: 리소스 절약, 보안 (좀비 세션 방지)
- **검증**: Redis TTL 만료 시 세션 삭제, 재접속 시 재인증

### 2.4 Constraints (제약사항)

**CON-001**: 비밀번호는 bcrypt salt rounds 12 이상으로 해싱해야 한다.
- **이유**: OWASP 권장 사항, 무차별 대입 공격 방어
- **구현**: `bcrypt.hash(password, 12)`

**CON-002**: JWT 토큰은 HTTPS로만 전송되어야 한다 (프로덕션).
- **이유**: 중간자 공격 방지
- **검증**: Secure 쿠키 플래그, HSTS 헤더

**CON-003**: 세션 ID는 UUID v4 형식이어야 한다.
- **이유**: 충돌 방지, 예측 불가능성
- **구현**: `crypto.randomUUID()`

**CON-004**: 동시에 5개 이상의 세션을 허용하지 않아야 한다.
- **이유**: 어뷰징 방지, 리소스 보호
- **검증**: Redis 세션 개수 확인 후 제한

---

## 3. 상세 명세 (Specifications)

### 3.1 데이터 모델

#### PostgreSQL (영구 저장)

**users 테이블**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(50) NOT NULL,
  is_guest BOOLEAN DEFAULT false,
  guest_session_id UUID, -- 게스트 전환 시 매핑
  level INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_guest_session ON users(guest_session_id);
```

**refresh_tokens 테이블**:
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
```

#### Redis (Hot Data)

**세션 키 구조**:
```
session:{userId} → JSON {
  id: string,
  username: string,
  role: 'GUEST' | 'USER',
  lastActivity: timestamp,
  currentRoomId?: string
}

guest:session:{sessionId} → JSON {
  username: string,
  createdAt: timestamp
}
```

**TTL 설정**:
- 게스트 세션: 7일 (604800초)
- 등록 유저 세션: 30일 (2592000초)

### 3.2 API 설계

#### REST API 엔드포인트

**1. POST /api/auth/guest** - 게스트 인증
```typescript
// Request
{
  username: string; // 3-20자, 특수문자 제외
}

// Response
{
  sessionId: string;       // UUID v4
  accessToken: string;     // JWT (15분)
  refreshToken: string;    // JWT (7일)
  user: {
    id: string;
    username: string;
    isGuest: true;
  }
}
```

**2. POST /api/auth/register** - 회원가입
```typescript
// Request
{
  email: string;           // 유효한 이메일 형식
  password: string;        // 8자 이상, 영문+숫자 포함
  username: string;        // 3-20자
  guestSessionId?: string; // 게스트 전환 시
}

// Response
{
  userId: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    isGuest: false;
  }
}
```

**3. POST /api/auth/login** - 로그인
```typescript
// Request
{
  email: string;
  password: string;
}

// Response (동일한 토큰 구조)
```

**4. POST /api/auth/refresh** - 토큰 갱신
```typescript
// Request
{
  refreshToken: string;
}

// Response
{
  accessToken: string;  // 새 액세스 토큰
  refreshToken: string; // 새 리프레시 토큰 (일회용)
}
```

**5. POST /api/auth/logout** - 로그아웃
```typescript
// Request
Authorization: Bearer <accessToken>

// Response
{
  success: true;
}

// 동작: Redis 세션 삭제, 리프레시 토큰 무효화
```

**6. GET /api/auth/me** - 현재 사용자 정보
```typescript
// Request
Authorization: Bearer <accessToken>

// Response
{
  id: string;
  username: string;
  email?: string; // 게스트는 null
  isGuest: boolean;
  level: number;
}
```

**7. POST /api/auth/convert-guest** - 게스트 전환
```typescript
// Request
Authorization: Bearer <guestAccessToken>
{
  email: string;
  password: string;
}

// Response (등록 유저 토큰)
```

#### WebSocket 통합

**Socket.IO 연결 시 JWT 검증**:
```typescript
// 클라이언트 (apps/web)
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: {
    token: accessToken // JWT
  }
});

// 서버 (apps/api/src/gateway/game.gateway.ts)
@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection {
  constructor(private authService: AuthService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    const user = await this.authService.verifyJWT(token);

    if (!user) {
      client.disconnect();
      return;
    }

    client.data.user = user; // 소켓에 사용자 정보 첨부
    console.log(`User ${user.username} connected`);
  }
}
```

### 3.3 공유 타입 정의

**packages/types/src/auth.ts**:
```typescript
export enum UserRole {
  GUEST = 'GUEST',
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  isGuest: boolean;
  level: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  guestSessionId?: string;
}

export interface GuestAuthRequest {
  username: string;
}

export interface JWTPayload {
  sub: string;      // User ID
  username: string;
  role: UserRole;
  iat: number;      // Issued At
  exp: number;      // Expiration
}
```

### 3.4 보안 설계

**1. 비밀번호 해싱 (bcrypt)**:
```typescript
import * as bcrypt from 'bcrypt';

// 회원가입 시
const saltRounds = 12;
const passwordHash = await bcrypt.hash(password, saltRounds);

// 로그인 시
const isValid = await bcrypt.compare(password, user.passwordHash);
```

**2. JWT 서명 및 검증**:
```typescript
import { JwtService } from '@nestjs/jwt';

// 토큰 생성
const accessToken = this.jwtService.sign(
  { sub: user.id, username: user.username, role: user.role },
  { expiresIn: '15m', secret: process.env.JWT_ACCESS_SECRET }
);

const refreshToken = this.jwtService.sign(
  { sub: user.id },
  { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET }
);

// 토큰 검증
const payload = await this.jwtService.verifyAsync(token, {
  secret: process.env.JWT_ACCESS_SECRET
});
```

**3. HTTPS 전송**:
- 프로덕션 환경에서 HTTPS 강제
- Secure 쿠키 플래그 설정
- HSTS 헤더 추가 (`Strict-Transport-Security: max-age=31536000`)

**4. Rate Limiting**:
```typescript
// NestJS Throttler
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 1분에 5회
@Post('login')
async login(@Body() loginDto: LoginRequest) {
  // ...
}
```

---

## 4. 기술적 제약사항 및 고려사항

### 4.1 성능 요구사항

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 세션 생성 응답 시간 | <50ms (P95) | New Relic, Datadog |
| JWT 검증 시간 | <10ms (P95) | 로그 분석 |
| Redis 세션 조회 | <10ms (P95) | Redis Monitor |
| 동시 로그인 처리 | 1,000 req/s | k6, Artillery |

### 4.2 보안 요구사항

**1. 비밀번호 정책**:
- 최소 8자, 영문+숫자 조합
- 흔한 비밀번호 차단 (Have I Been Pwned API 연동 권장)
- 비밀번호 변경 주기 미강제 (NIST 권장 사항)

**2. JWT 토큰 보안**:
- 액세스 토큰: 짧은 TTL (15분)
- 리프레시 토큰: 일회용 (사용 시 새 토큰 발급, 기존 토큰 무효화)
- XSS 방지: HttpOnly 쿠키 저장 (선택적)

**3. 세션 하이재킹 방지**:
- Redis 세션에 IP 주소, User-Agent 저장
- 변경 감지 시 재인증 요구

### 4.3 확장성 고려사항

**1. 수평 확장 (Horizontal Scaling)**:
- Stateless JWT 기반 인증 (여러 API 서버 간 세션 공유 불필요)
- Redis 클러스터 모드 (샤딩)

**2. Redis 고가용성**:
- Redis Sentinel (자동 장애 조치)
- 백업: RDB + AOF 하이브리드

**3. PostgreSQL 복제**:
- Primary-Replica 구조
- 읽기는 Replica, 쓰기는 Primary

---

## 5. Traceability (추적성)

### 5.1 TAG 체인

- **@SPEC:AUTH-001**: 이 문서
- **@TEST:AUTH-001**: TDD 단계에서 작성 예정
  - `tests/auth/guest.test.ts` - 게스트 인증 테스트
  - `tests/auth/register.test.ts` - 회원가입 테스트
  - `tests/auth/login.test.ts` - 로그인 테스트
  - `tests/auth/jwt.test.ts` - JWT 토큰 갱신 테스트
  - `tests/auth/session.test.ts` - Redis 세션 관리 테스트
- **@CODE:AUTH-001**: TDD 구현 단계에서 작성 예정
  - `apps/api/src/auth/auth.service.ts` - 인증 비즈니스 로직
  - `apps/api/src/auth/auth.controller.ts` - REST API 엔드포인트
  - `apps/api/src/auth/jwt.strategy.ts` - Passport JWT 전략
  - `apps/api/src/auth/session.service.ts` - Redis 세션 관리
  - `packages/types/src/auth.ts` - 공유 타입 정의
  - `packages/constants/src/auth-constants.ts` - 인증 상수
- **@DOC:AUTH-001**: 문서 동기화 단계에서 작성 예정
  - `docs/api/auth.md` - API 문서
  - `docs/architecture/authentication.md` - 인증 아키텍처

### 5.2 참조 문서

- `docs/liar_game_proposal.md` - 프로젝트 기획서 (섹션 6.1 "사용자 인증")
- `.moai/specs/SPEC-SETUP-001/spec.md` - 모노레포 기반 구조 (완료)
- `.moai/memory/development-guide.md` - TRUST 원칙, @TAG 시스템

### 5.3 의존성 SPEC

- **SETUP-001**: 모노레포 기반 구조 (완료) - NestJS, PostgreSQL, Redis 설정

### 5.4 차단하는 SPEC

- **GAME-001**: 게임 로직 (인증 없이 게임 시작 불가)
- **ROOM-001**: 방 생성/관리 (세션 없이 방 참여 불가)
- **MATCH-001**: 매칭 시스템 (사용자 식별 필요)

---

## 6. 검증 및 인수 기준

상세한 인수 기준은 `acceptance.md`를 참조하세요.

**핵심 검증 항목**:
1. ✅ 게스트 인증 성공률 ≥99% (닉네임 입력 → JWT 발급)
2. ✅ 회원가입 → 로그인 플로우 성공률 ≥95%
3. ✅ JWT 토큰 갱신 실패율 <1% (리프레시 토큰 유효성)
4. ✅ 세션 생성 응답 시간 <50ms (P95)
5. ✅ Redis 세션 조회 <10ms (P95)
6. ✅ bcrypt 해싱 시간 <200ms (saltRounds=12)
7. ✅ 비밀번호 평문 저장 0건 (보안 감사)
8. ✅ 게스트 전환 시 프로그레스 100% 유지

---

## 7. 다음 단계

1. **TDD 구현** (`/alfred:2-build SPEC-AUTH-001`)
   - RED: 테스트 케이스 작성 (5개 파일)
   - GREEN: 최소 구현 (AuthService, JWT Strategy, SessionService)
   - REFACTOR: 코드 품질 개선, 보안 강화

2. **문서 동기화** (`/alfred:3-sync`)
   - Living Document 업데이트
   - TAG 체인 검증
   - API 문서 자동 생성

3. **후속 SPEC 작성**
   - AUTH-002: 비밀번호 재설정
   - AUTH-003: 다중 기기 세션 관리
   - GAME-001: 게임 로직 (역할 배정, 토론, 투표)

---

**문서 메타데이터**:
- **작성일**: 2025-10-11
- **최종 수정일**: 2025-10-11
- **작성자**: @Goos (via spec-builder 🏗️)
- **리뷰어**: (TBD)
- **승인자**: (TBD)
