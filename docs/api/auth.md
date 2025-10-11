# @DOC:AUTH-001:API - 인증 시스템 API 문서

**SPEC**: [SPEC-AUTH-001](../../.moai/specs/SPEC-AUTH-001/spec.md)
**구현**: [auth.controller.ts](../../apps/api/src/auth/auth.controller.ts)
**테스트**: [apps/api/test/auth/](../../apps/api/test/auth/)
**최종 수정**: 2025-10-11

---

## 개요

Liar Game 인증 시스템은 **게스트 인증**과 **회원 인증** 2단계 전략을 사용합니다.

### 인증 플로우

```
1. 게스트 진입 (제로 프릭션)
   닉네임만 입력 → 임시 JWT 발급 → 즉시 게임 시작

2. 회원 전환 (선택적)
   이메일+비밀번호 등록 → 데이터 영속성 확보 → 크로스 디바이스 지원

3. 토큰 갱신
   액세스 토큰 만료(15분) → 리프레시 토큰 검증 → 새 토큰 발급
```

### 보안 특징

- **bcrypt 해싱**: Salt rounds 12 (OWASP 권장)
- **JWT 토큰**: 액세스(15분) + 리프레시(7일) 쌍 발급
- **Redis 세션**: Hot Data 캐싱 (<10ms 조회)
- **Rate Limiting**: 엔드포인트별 차등 제한

---

## API 엔드포인트

### 1. POST /api/auth/guest - 게스트 인증

**요구사항**: REQ-001, REQ-005
**Rate Limit**: 10회/60초

#### 요청

```typescript
{
  username: string; // 3-20자, 특수문자 제외
}
```

**예시**:
```bash
curl -X POST http://localhost:4000/api/auth/guest \
  -H "Content-Type: application/json" \
  -d '{"username": "플레이어123"}'
```

#### 응답

```typescript
{
  sessionId: string;       // UUID v4 (예: "a1b2c3d4-...")
  accessToken: string;     // JWT (15분)
  refreshToken: string;    // JWT (7일)
  user: {
    id: string;           // 세션 ID와 동일
    username: string;     // "플레이어123"
    isGuest: true;
    role: "GUEST";
  }
}
```

#### 에러

| 상태 코드 | 에러 코드 | 설명 |
|---------|---------|------|
| 400 | INVALID_USERNAME | 닉네임 형식 오류 (길이/특수문자) |
| 409 | USERNAME_IN_USE | 이미 사용 중인 닉네임 (Redis 세션) |
| 429 | TOO_MANY_REQUESTS | Rate Limit 초과 |

---

### 2. POST /api/auth/register - 회원가입

**요구사항**: REQ-002, REQ-008
**Rate Limit**: 3회/60초

#### 요청

```typescript
{
  email: string;           // 유효한 이메일 형식
  password: string;        // 8자 이상, 영문+숫자 포함
  username: string;        // 3-20자
  guestSessionId?: string; // 게스트 전환 시 세션 ID
}
```

**예시**:
```bash
# 신규 회원가입
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure123",
    "username": "플레이어123"
  }'

# 게스트 전환 (프로그레스 유지)
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure123",
    "username": "플레이어123",
    "guestSessionId": "a1b2c3d4-..."
  }'
```

#### 응답

```typescript
{
  userId: string;          // UUID v4
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    isGuest: false;
    role: "USER";
    level: number;         // 게스트 전환 시 레벨 유지
  }
}
```

#### 에러

| 상태 코드 | 에러 코드 | 설명 |
|---------|---------|------|
| 400 | INVALID_EMAIL | 이메일 형식 오류 |
| 400 | WEAK_PASSWORD | 비밀번호 정책 미달 (8자 미만) |
| 409 | EMAIL_IN_USE | 이미 등록된 이메일 |
| 404 | GUEST_SESSION_NOT_FOUND | 게스트 세션 ID 없음 |

---

### 3. POST /api/auth/login - 로그인

**요구사항**: REQ-006
**Rate Limit**: 5회/60초 (무차별 대입 공격 방어)

#### 요청

```typescript
{
  email: string;
  password: string;
}
```

**예시**:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure123"
  }'
```

#### 응답

```typescript
{
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    isGuest: false;
    role: "USER";
    level: number;
  }
}
```

#### 에러

| 상태 코드 | 에러 코드 | 설명 |
|---------|---------|------|
| 401 | INVALID_CREDENTIALS | 이메일 또는 비밀번호 오류 |
| 429 | TOO_MANY_REQUESTS | Rate Limit 초과 (5회/60초) |

---

### 4. POST /api/auth/refresh - 토큰 갱신

**요구사항**: REQ-007
**Rate Limit**: 10회/60초

#### 요청

```typescript
{
  refreshToken: string; // JWT 리프레시 토큰
}
```

**예시**:
```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'
```

#### 응답

```typescript
{
  accessToken: string;  // 새 액세스 토큰 (15분)
  refreshToken: string; // 새 리프레시 토큰 (일회용)
}
```

**중요**: 리프레시 토큰은 **일회용**입니다. 사용 후 새 토큰이 발급되며, 기존 토큰은 자동 무효화됩니다.

#### 에러

| 상태 코드 | 에러 코드 | 설명 |
|---------|---------|------|
| 401 | INVALID_REFRESH_TOKEN | 토큰 서명 오류/만료 |
| 404 | TOKEN_NOT_FOUND | PostgreSQL에 토큰 없음 (무효화됨) |

---

### 5. POST /api/auth/logout - 로그아웃

**요구사항**: REQ-011
**인증 필요**: JWT

#### 요청

```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 응답

```typescript
{
  success: true;
}
```

**동작**:
1. Redis 세션 삭제 (`session:{userId}`)
2. PostgreSQL 리프레시 토큰 무효화
3. 액세스 토큰은 만료될 때까지 유효 (15분)

#### 에러

| 상태 코드 | 에러 코드 | 설명 |
|---------|---------|------|
| 401 | UNAUTHORIZED | JWT 토큰 없음/만료 |

---

### 6. GET /api/auth/me - 현재 사용자 정보

**요구사항**: REQ-009
**인증 필요**: JWT

#### 요청

```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 응답

```typescript
{
  id: string;
  username: string;
  email?: string;    // 게스트는 null
  isGuest: boolean;
  role: "GUEST" | "USER";
  level: number;
  createdAt: string; // ISO 8601
}
```

#### 에러

| 상태 코드 | 에러 코드 | 설명 |
|---------|---------|------|
| 401 | UNAUTHORIZED | JWT 토큰 없음/만료 |

---

### 7. POST /api/auth/verify - JWT 검증 (내부 API)

**사용처**: WebSocket Gateway, 마이크로서비스 간 인증

#### 요청

```typescript
{
  token: string; // JWT 액세스 토큰
}
```

#### 응답

```typescript
{
  valid: boolean;
  user?: {
    id: string;
    username: string;
    role: "GUEST" | "USER";
  }
}
```

---

## WebSocket 인증

**Socket.IO 연결 시 JWT 검증 (REQ-010)**:

### 클라이언트 (apps/web)

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: {
    token: accessToken // JWT
  }
});

socket.on('connect', () => {
  console.log('인증 성공, 게임 입장 가능');
});

socket.on('connect_error', (error) => {
  console.error('인증 실패:', error.message);
  // → 재로그인 또는 토큰 갱신 필요
});
```

### 서버 (apps/api/src/gateway/game.gateway.ts)

```typescript
@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection {
  constructor(private authService: AuthService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    const user = await this.authService.verifyJWT(token);

    if (!user) {
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
      return;
    }

    client.data.user = user; // 소켓에 사용자 정보 첨부
    console.log(`User ${user.username} connected`);
  }
}
```

---

## 인증 헤더 형식

### REST API

```
Authorization: Bearer <accessToken>
```

### WebSocket

```typescript
{
  auth: {
    token: "<accessToken>"
  }
}
```

---

## 세션 관리

### Redis 키 구조

```
# 등록 유저
session:{userId} → JSON {
  id: string,
  username: string,
  role: 'USER',
  lastActivity: timestamp,
  currentRoomId?: string
}

# 게스트 유저
guest:session:{sessionId} → JSON {
  username: string,
  createdAt: timestamp
}
```

### TTL (Time To Live)

| 타입 | TTL | 자동 갱신 |
|-----|-----|---------|
| 게스트 세션 | 7일 | 게임 활동 시 |
| 등록 유저 세션 | 30일 | API 요청 시 |
| 액세스 토큰 | 15분 | 없음 (리프레시 필요) |
| 리프레시 토큰 | 7일 | 갱신 시 재발급 |

---

## 보안 고려사항

### 1. HTTPS 전송 (프로덕션)

```typescript
// Fastify 설정 (apps/api/src/main.ts)
const httpsOptions = {
  key: fs.readFileSync('./secrets/server.key'),
  cert: fs.readFileSync('./secrets/server.cert')
};

await app.listen(4000, '0.0.0.0', { https: httpsOptions });
```

### 2. Secure 쿠키 (선택적)

```typescript
// 리프레시 토큰을 HttpOnly 쿠키로 저장
@Post('login')
async login(@Res() res: FastifyReply, @Body() dto: LoginDto) {
  const { accessToken, refreshToken } = await this.authService.login(...);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true, // HTTPS만
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
  });

  return res.send({ accessToken });
}
```

### 3. CORS 설정

```typescript
// apps/api/src/main.ts
app.enableCors({
  origin: ['http://localhost:3000', 'https://liar-game.app'],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

---

## 테스트

### 테스트 프레임워크

- **API (apps/api)**: Jest (jest.config.js)
- **Web (apps/web)**: Playwright (향후 추가 예정)

### E2E 테스트 실행

```bash
cd apps/api
pnpm test        # Jest 단위 테스트
pnpm test:e2e    # Jest E2E 테스트
pnpm test:cov    # 커버리지 리포트
```

### 테스트 커버리지 (Jest 기반)

| 모듈 | 커버리지 | 상태 |
|-----|---------|------|
| AuthController | 100% | ✅ |
| AuthService | 92% | ✅ |
| JwtStrategy | 100% | ✅ |
| SessionService | 88% | ✅ |

---

---

## Supabase 소셜 로그인 (AUTH-002)

@DOC:AUTH-002:API | SPEC: SPEC-AUTH-002.md

### OAuth 프로바이더

지원되는 소셜 로그인:
- **Google OAuth 2.0**: Gmail 계정 로그인
- **GitHub OAuth 2.0**: GitHub 계정 로그인
- **Discord OAuth 2.0**: Discord 계정 로그인

### 프론트엔드 통합

#### 소셜 로그인 시작

```typescript
// @CODE:AUTH-002:UI | SPEC: SPEC-AUTH-002.md

import { supabase } from '@/lib/supabase';

// Google 로그인
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});

// GitHub 로그인
await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});

// Discord 로그인
await supabase.auth.signInWithOAuth({
  provider: 'discord',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

#### Anonymous 인증

```typescript
// 익명 로그인 (게스트 플레이)
const { data, error } = await supabase.auth.signInAnonymously();

if (!error) {
  console.log('게스트 세션 ID:', data.session?.user.id);
  // 게임 입장 가능
}
```

### API 엔드포인트

#### GET /auth/callback

OAuth 콜백 처리 (프론트엔드 Route Handler)

**Parameters**:
- `code`: OAuth 인증 코드 (query)

**Response**:
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "v1.MR5m...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": {
      "username": "플레이어123",
      "avatar_url": "https://..."
    }
  }
}
```

**구현 예시**:
```typescript
// @CODE:AUTH-002:UI | SPEC: SPEC-AUTH-002.md

// apps/web/src/app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${requestUrl.origin}/game`);
}
```

#### POST /api/auth/session (백엔드)

현재 세션 조회 (Supabase JWT 검증)

**Request**:
```bash
curl -X GET http://localhost:4000/api/auth/session \
  -H "Authorization: Bearer <supabase_access_token>"
```

**Response**:
```typescript
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": {
      "username": "플레이어123",
      "level": 5
    },
    "app_metadata": {
      "provider": "google",
      "providers": ["google"]
    }
  },
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "v1.MR5m...",
    "expires_in": 3600
  }
}
```

### Supabase JWT 검증 (백엔드)

```typescript
// @CODE:AUTH-002:API | SPEC: SPEC-AUTH-002.md

// apps/api/src/auth/supabase-jwt.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { SupabaseAuthService } from './supabase-auth.service';

@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  constructor(private authService: SupabaseAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) return false;

    try {
      const user = await this.authService.verifyToken(token);
      request.user = user;
      return true;
    } catch {
      return false;
    }
  }
}
```

**사용 예시**:
```typescript
@UseGuards(SupabaseJwtGuard)
@Get('profile')
async getProfile(@Request() req) {
  return req.user; // Supabase 사용자 정보
}
```

### Anonymous → 소셜 계정 연동

Anonymous 사용자를 소셜 계정으로 업그레이드:

```typescript
// 게스트 상태에서 Google 계정 연동
const { data, error } = await supabase.auth.updateUser({
  email: 'user@example.com',
  password: 'new_password' // 선택적
});

// 또는 linkIdentity 사용 (Supabase v2.x)
await supabase.auth.linkIdentity({
  provider: 'google'
});
```

**중요**: 기존 게임 프로그레스는 자동으로 유지됩니다.

---

## 다음 단계

- **AUTH-003**: 비밀번호 재설정 (이메일 인증)
- **AUTH-004**: 다중 기기 세션 관리
- **AUTH-005**: 2FA (이중 인증)
- **AUTH-006**: Apple Sign-In 추가

---

**작성자**: @Goos (doc-syncer 📖)
**리뷰어**: (TBD)
**승인일**: (TBD)
