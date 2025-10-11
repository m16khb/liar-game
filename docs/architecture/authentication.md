# @DOC:AUTH-001:ARCHITECTURE - 인증 시스템 아키텍처

**SPEC**: [SPEC-AUTH-001](../../.moai/specs/SPEC-AUTH-001/spec.md)
**API 문서**: [auth.md](../api/auth.md)
**최종 수정**: 2025-10-11

---

## 개요

Liar Game 인증 시스템은 **제로 프릭션 진입**과 **점진적 사용자 전환** 전략을 기반으로 설계되었습니다.

### 핵심 설계 원칙

1. **단계적 인증**: 게스트 → 등록 유저 자연스러운 전환
2. **Stateless JWT**: 수평 확장 가능, 여러 API 서버 간 세션 공유 불필요
3. **Redis Hot Data**: 빠른 세션 조회 (<10ms), TTL 자동 관리
4. **보안 우선**: bcrypt 해싱, Rate Limiting, HTTPS 강제

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     클라이언트 (apps/web)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 게스트 진입  │  │  회원가입    │  │   로그인      │      │
│  │ (닉네임만)   │  │ (이메일+PW)  │  │ (자격증명)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   NestJS API (apps/api)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │             AuthController (REST API)                │   │
│  │  /auth/guest | /auth/register | /auth/login         │   │
│  │  /auth/refresh | /auth/logout | /auth/me            │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  AuthService                         │   │
│  │  createGuestToken() | register() | login()          │   │
│  │  refreshToken() | logout() | verifyJWT()            │   │
│  └──────┬──────────────────────────────────┬───────────┘   │
│         │                                   │                │
│         ▼                                   ▼                │
│  ┌──────────────┐                    ┌─────────────┐       │
│  │ JwtStrategy  │                    │SessionService│       │
│  │ (Passport)   │                    │ (Redis 연동) │       │
│  └──────────────┘                    └─────────────┘       │
└─────────┼──────────────────────────────────┼───────────────┘
          │                                   │
          ▼                                   ▼
┌─────────────────────┐          ┌────────────────────────┐
│  PostgreSQL 16.x    │          │     Redis 7.x          │
│  ┌───────────────┐  │          │  ┌──────────────────┐  │
│  │ users 테이블  │  │          │  │ session:{userId} │  │
│  │ - id          │  │          │  │ guest:session:ID │  │
│  │ - email       │  │          │  │ TTL 관리         │  │
│  │ - password_hash│ │          │  └──────────────────┘  │
│  │ - username    │  │          │                        │
│  └───────────────┘  │          │                        │
│  ┌───────────────┐  │          └────────────────────────┘
│  │refresh_tokens │  │
│  │ - token_hash  │  │
│  │ - expires_at  │  │
│  └───────────────┘  │
└─────────────────────┘
```

---

## 인증 플로우

### 1. 게스트 인증 (제로 프릭션)

```
사용자 행동: URL 클릭 → 닉네임 입력 (3초)
        ↓
[클라이언트]
  POST /api/auth/guest { username: "플레이어123" }
        ↓
[AuthService]
  1. 닉네임 중복 확인 (Redis)
  2. UUID 생성 (crypto.randomUUID())
  3. Redis 세션 저장: guest:session:{sessionId}
        ↓
[JwtService]
  4. JWT 발급
     - Payload: { sub: sessionId, role: 'GUEST', ... }
     - 액세스 토큰: 15분
     - 리프레시 토큰: 7일
        ↓
[응답]
  { sessionId, accessToken, refreshToken, user }
        ↓
[클라이언트]
  localStorage에 토큰 저장 → 게임 입장
```

**소요 시간**: <50ms (P95 목표)

---

### 2. 회원가입 (게스트 전환 포함)

#### 신규 회원가입

```
사용자 행동: 이메일 + 비밀번호 입력
        ↓
[클라이언트]
  POST /api/auth/register {
    email: "user@example.com",
    password: "secure123",
    username: "플레이어123"
  }
        ↓
[AuthService]
  1. 이메일 중복 확인 (PostgreSQL)
  2. 비밀번호 검증 (8자 이상, 영문+숫자)
  3. bcrypt 해싱 (saltRounds=12)
        ↓
[PostgreSQL]
  4. users 테이블에 INSERT
     - id: UUID
     - email: 암호화 불필요 (인덱싱)
     - password_hash: bcrypt 결과
     - is_guest: false
        ↓
[SessionService]
  5. Redis 세션 생성: session:{userId}
        ↓
[JwtService]
  6. JWT 발급 (액세스 + 리프레시)
        ↓
[응답]
  { userId, accessToken, refreshToken, user }
```

#### 게스트 전환 (프로그레스 유지)

```
사용자 행동: 게스트 상태에서 회원가입 클릭
        ↓
[클라이언트]
  POST /api/auth/register {
    email: "user@example.com",
    password: "secure123",
    username: "플레이어123",
    guestSessionId: "a1b2c3d4-..." // 기존 게스트 세션 ID
  }
        ↓
[AuthService]
  1. 게스트 세션 검증 (Redis: guest:session:{sessionId})
  2. 게임 히스토리 조회 (PostgreSQL: game_history 테이블)
  3. 회원가입 처리 (위와 동일)
        ↓
[PostgreSQL]
  4. users 테이블 INSERT
     - guest_session_id: "a1b2c3d4-..." (매핑)
  5. game_history 테이블 업데이트
     - guest_session_id → user_id 매핑
     - 레벨, 전적, 통계 이관
        ↓
[SessionService]
  6. Redis 게스트 세션 삭제
  7. Redis 유저 세션 생성 (레벨 유지)
        ↓
[응답]
  { userId, accessToken, refreshToken, user: { level: 이전_레벨 } }
```

**핵심**: `guest_session_id` 컬럼으로 게스트 데이터를 등록 유저에게 연결

---

### 3. 로그인

```
사용자 행동: 이메일 + 비밀번호 입력
        ↓
[클라이언트]
  POST /api/auth/login {
    email: "user@example.com",
    password: "secure123"
  }
        ↓
[AuthService]
  1. 이메일로 사용자 조회 (PostgreSQL)
        ↓
[bcrypt]
  2. 비밀번호 검증
     await bcrypt.compare(password, user.password_hash)
        ↓
  검증 실패 → 401 Unauthorized
  검증 성공 ↓
        ↓
[SessionService]
  3. 기존 세션 확인 (Redis: session:{userId})
  4. 세션 개수 제한 (CON-004: 최대 5개)
  5. 새 세션 생성 또는 갱신
        ↓
[JwtService]
  6. JWT 발급 (액세스 + 리프레시)
  7. refresh_tokens 테이블에 저장 (token_hash)
        ↓
[응답]
  { accessToken, refreshToken, user }
```

**보안**: Rate Limiting 5회/60초 (무차별 대입 공격 방어)

---

### 4. 토큰 갱신

```
사용자 행동: 액세스 토큰 만료 (15분 경과)
        ↓
[클라이언트]
  POST /api/auth/refresh {
    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
        ↓
[JwtService]
  1. 리프레시 토큰 서명 검증 (JWT_REFRESH_SECRET)
  2. Payload 추출 { sub: userId, ... }
        ↓
[PostgreSQL]
  3. refresh_tokens 테이블 조회
     - token_hash 일치 확인
     - expires_at > NOW() 확인
        ↓
  토큰 없음/만료 → 401 Unauthorized (재로그인 필요)
  토큰 유효 ↓
        ↓
[AuthService]
  4. 새 토큰 쌍 발급 (액세스 + 리프레시)
  5. 기존 리프레시 토큰 삭제 (일회용)
  6. 새 리프레시 토큰 저장
        ↓
[응답]
  { accessToken, refreshToken }
```

**핵심**: 리프레시 토큰은 일회용 → 재사용 공격 방지

---

### 5. 로그아웃

```
사용자 행동: 로그아웃 버튼 클릭
        ↓
[클라이언트]
  POST /api/auth/logout
  Authorization: Bearer <accessToken>
        ↓
[JwtAuthGuard]
  1. JWT 검증 → req.user 추출
        ↓
[AuthService]
  2. Redis 세션 삭제 (session:{userId})
  3. PostgreSQL 리프레시 토큰 삭제 (user_id 기준)
        ↓
[응답]
  { success: true }
        ↓
[클라이언트]
  localStorage 토큰 삭제
```

**제한**: 액세스 토큰은 만료될 때까지 유효 (15분)

---

## 데이터 모델

### PostgreSQL 스키마

#### users 테이블

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt, $2b$12$...
  username VARCHAR(50) NOT NULL,
  is_guest BOOLEAN DEFAULT false,
  guest_session_id UUID,               -- 게스트 전환 매핑
  level INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_guest_session ON users(guest_session_id);
```

#### refresh_tokens 테이블

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,    -- SHA-256 해시
  expires_at TIMESTAMP NOT NULL,       -- 7일 후
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

**자동 정리**: Cron Job으로 만료된 토큰 삭제
```sql
DELETE FROM refresh_tokens WHERE expires_at < NOW();
```

---

### Redis 데이터 구조

#### 등록 유저 세션

```
키: session:{userId}
값: JSON {
  id: string,
  username: string,
  role: 'USER',
  lastActivity: 1696000000000, // Unix timestamp
  currentRoomId?: string
}
TTL: 2592000초 (30일)
```

#### 게스트 세션

```
키: guest:session:{sessionId}
값: JSON {
  username: string,
  createdAt: 1696000000000
}
TTL: 604800초 (7일)
```

#### TTL 자동 갱신

```typescript
// SessionService.updateLastActivity()
await this.redis.expire(`session:${userId}`, 30 * 24 * 60 * 60); // 30일 연장
```

---

## 보안 설계

### 1. 비밀번호 해싱 (bcrypt)

```typescript
import * as bcrypt from 'bcrypt';

// 회원가입 시
const saltRounds = 12; // OWASP 권장 (2^12 = 4096 iterations)
const passwordHash = await bcrypt.hash(password, saltRounds);
// 결과: $2b$12$L4E.../Z1GqkS0... (60자)

// 로그인 시
const isValid = await bcrypt.compare(password, user.passwordHash);
// 소요 시간: ~150ms (의도적으로 느림 → 무차별 대입 방어)
```

**보안 특징**:
- Salt 자동 생성 (무지개 테이블 공격 방어)
- 느린 해싱 (GPU 가속 공격 방어)
- 비밀번호 평문 저장 절대 금지

---

### 2. JWT 서명 및 검증

```typescript
// .env
JWT_ACCESS_SECRET=랜덤_64자_문자열   # openssl rand -base64 64
JWT_REFRESH_SECRET=다른_랜덤_64자_문자열

// 토큰 생성
const accessToken = this.jwtService.sign(
  { sub: user.id, username: user.username, role: user.role },
  { expiresIn: '15m', secret: process.env.JWT_ACCESS_SECRET }
);
// 결과: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

// 토큰 검증
const payload = await this.jwtService.verifyAsync(token, {
  secret: process.env.JWT_ACCESS_SECRET
});
// 만료 시 → JsonWebTokenError: jwt expired
```

**보안 특징**:
- HS256 알고리즘 (HMAC SHA-256)
- 액세스/리프레시 다른 시크릿 사용
- 짧은 TTL (액세스 15분)

---

### 3. Rate Limiting

```typescript
// NestJS Throttler 모듈
@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 60초 창
      limit: 10,   // 기본 10회
    }])
  ]
})

// 컨트롤러별 차등 적용
@Post('login')
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 1분에 5회
async login(@Body() dto: LoginDto) { ... }

@Post('guest')
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 1분에 10회
async guestAuth(@Body() dto: GuestAuthDto) { ... }
```

**공격 방어**:
- 무차별 대입 공격 (Brute Force)
- 크리덴셜 스터핑 (Credential Stuffing)
- DDoS 공격

---

### 4. HTTPS 전송 (프로덕션)

```typescript
// apps/api/src/main.ts
if (process.env.NODE_ENV === 'production') {
  const httpsOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH)
  };
  await app.listen(4000, '0.0.0.0', { https: httpsOptions });

  // HSTS 헤더 추가
  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
}
```

**보안 특징**:
- TLS 1.2+ (중간자 공격 방지)
- HSTS 헤더 (HTTPS 강제)
- Secure 쿠키 플래그

---

## WebSocket 인증 통합

### Socket.IO Gateway

```typescript
// apps/api/src/gateway/game.gateway.ts
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/game'
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private authService: AuthService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;

    try {
      const user = await this.authService.verifyJWT(token);
      client.data.user = user; // 소켓에 사용자 정보 첨부
      console.log(`✅ User ${user.username} connected (Socket ID: ${client.id})`);
    } catch (error) {
      console.error('❌ Invalid JWT token:', error.message);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    console.log(`👋 User ${user?.username || 'Unknown'} disconnected`);
  }

  // 게임 이벤트 핸들러
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string
  ) {
    const user = client.data.user; // JWT 검증 완료된 사용자
    if (!user) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    client.join(roomId);
    console.log(`User ${user.username} joined room ${roomId}`);
  }
}
```

**핵심**:
- 연결 시 JWT 검증 (handshake.auth.token)
- 검증 실패 시 즉시 연결 종료
- 소켓 객체에 사용자 정보 캐싱 (client.data.user)

---

## 성능 최적화

### 1. Redis 세션 조회 최적화

```typescript
// SessionService.getSession()
async getSession(userId: string): Promise<Session | null> {
  const data = await this.redis.get(`session:${userId}`);
  if (!data) return null;

  // JSON 파싱 캐싱 (메모이제이션)
  return JSON.parse(data);
}
```

**성능 목표**:
- 조회 시간: <10ms (P95)
- 처리량: 10,000 req/s (Redis 단일 인스턴스)

---

### 2. bcrypt 병렬 처리

```typescript
// AuthService.register()
async register(email: string, password: string, username: string) {
  // 중복 확인과 해싱을 병렬 실행
  const [existingUser, passwordHash] = await Promise.all([
    this.userRepository.findOne({ where: { email } }),
    bcrypt.hash(password, 12) // ~150ms
  ]);

  if (existingUser) {
    throw new ConflictException('Email already in use');
  }

  // 사용자 생성
  const user = await this.userRepository.save({
    email,
    passwordHash,
    username,
    isGuest: false
  });

  return this.generateTokens(user);
}
```

**최적화**: DB 조회 중 bcrypt 해싱 병렬 실행 → 총 소요 시간 단축

---

### 3. JWT 검증 캐싱

```typescript
// JwtStrategy (Passport)
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private sessionService: SessionService,
    private cacheManager: Cache // Redis Cache
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET
    });
  }

  async validate(payload: JWTPayload) {
    const cacheKey = `jwt:${payload.sub}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached; // 캐시 히트

    // Redis 세션 조회
    const session = await this.sessionService.getSession(payload.sub);
    if (!session) {
      throw new UnauthorizedException('Session expired');
    }

    // 캐싱 (TTL: 5분)
    await this.cacheManager.set(cacheKey, session, 300000);
    return session;
  }
}
```

**효과**: 동일 사용자의 연속 요청 시 Redis 조회 생략

---

## 확장성 고려사항

### 1. 수평 확장 (Horizontal Scaling)

```
┌──────────────┐
│ Load Balancer│
│  (Nginx)     │
└───────┬──────┘
        │
        ├──────────┬──────────┬──────────┐
        ▼          ▼          ▼          ▼
   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
   │API #1  │ │API #2  │ │API #3  │ │API #4  │
   │(NestJS)│ │(NestJS)│ │(NestJS)│ │(NestJS)│
   └────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘
        │          │          │          │
        └──────────┴──────────┴──────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
   ┌──────────┐        ┌──────────┐
   │PostgreSQL│        │  Redis   │
   │ Primary  │        │ Cluster  │
   └────┬─────┘        └──────────┘
        │
        ▼
   ┌──────────┐
   │PostgreSQL│
   │ Replica  │
   └──────────┘
```

**핵심**:
- JWT Stateless 인증 → API 서버 간 세션 공유 불필요
- Redis 클러스터 모드 (샤딩)
- PostgreSQL Primary-Replica (읽기/쓰기 분리)

---

### 2. Redis 고가용성

```
┌──────────────────────────────────────┐
│       Redis Sentinel (감시자)         │
│  ┌────────┐  ┌────────┐  ┌────────┐ │
│  │Sentinel│  │Sentinel│  │Sentinel│ │
│  │   #1   │  │   #2   │  │   #3   │ │
│  └────────┘  └────────┘  └────────┘ │
└──────┬───────────────────────┬───────┘
       │                       │
       ▼                       ▼
┌──────────┐           ┌──────────┐
│  Redis   │ Replicat  │  Redis   │
│ Primary  │◄─────────►│ Replica  │
└──────────┘           └──────────┘
```

**기능**:
- 자동 장애 조치 (Failover)
- Primary 다운 시 Replica 승격
- 3대 이상 홀수 Sentinel 필요

---

### 3. 데이터베이스 샤딩 (미래 대비)

```sql
-- 사용자 ID 기반 샤딩 (모듈로 연산)
userId % 4 = 0 → Shard #1
userId % 4 = 1 → Shard #2
userId % 4 = 2 → Shard #3
userId % 4 = 3 → Shard #4
```

**적용 시점**: 사용자 1,000만 명 이상 (현재는 단일 DB로 충분)

---

## 모니터링 및 로깅

### 1. 성능 메트릭

```typescript
// Prometheus + Grafana
import { Counter, Histogram } from 'prom-client';

const loginAttempts = new Counter({
  name: 'auth_login_attempts_total',
  help: 'Total login attempts',
  labelNames: ['status'] // success | failure
});

const bcryptDuration = new Histogram({
  name: 'auth_bcrypt_duration_seconds',
  help: 'bcrypt hashing duration',
  buckets: [0.1, 0.2, 0.3, 0.5, 1.0]
});

// AuthService.login()
const start = Date.now();
const isValid = await bcrypt.compare(password, user.passwordHash);
bcryptDuration.observe((Date.now() - start) / 1000);

if (isValid) {
  loginAttempts.inc({ status: 'success' });
} else {
  loginAttempts.inc({ status: 'failure' });
}
```

---

### 2. 보안 로그

```typescript
// Winston Logger
import { Logger } from '@nestjs/common';

const logger = new Logger('AuthService');

// 로그인 실패
logger.warn(`Failed login attempt for email: ${email} from IP: ${clientIp}`);

// 리프레시 토큰 재사용 시도
logger.error(`Refresh token reuse detected: userId=${userId}, tokenHash=${hash}`);

// Rate Limit 초과
logger.warn(`Rate limit exceeded: IP=${clientIp}, endpoint=/auth/login`);
```

**보안 감사**: 로그 분석으로 공격 패턴 탐지

---

## 테스트 전략

### 테스트 프레임워크

- **API (apps/api)**: **Jest** (jest.config.js)
  - 단위 테스트, E2E 테스트, 커버리지 측정
  - Supertest를 사용한 HTTP 요청 시뮬레이션
- **Web (apps/web)**: **Playwright** (향후 추가 예정)
  - UI 컴포넌트 테스트
  - E2E 시나리오 테스트 (브라우저 자동화)

### 1. 단위 테스트 (Jest)

```typescript
// apps/api/test/auth/auth.service.test.ts
// @TEST:AUTH-001 | SPEC: SPEC-AUTH-001.md

describe('AuthService', () => {
  it('게스트 토큰 생성 성공', async () => {
    const result = await authService.createGuestToken('플레이어123');
    expect(result.user.isGuest).toBe(true);
    expect(result.accessToken).toBeDefined();
  });

  it('중복 이메일 회원가입 실패', async () => {
    await authService.register('user@example.com', 'pass123', 'user1');
    await expect(
      authService.register('user@example.com', 'pass456', 'user2')
    ).rejects.toThrow('Email already in use');
  });
});
```

**실행**:
```bash
cd apps/api
jest auth.service.test.ts
```

---

### 2. E2E 테스트 (Jest + Supertest)

```typescript
// apps/api/test/auth/e2e.test.ts
// @TEST:AUTH-001 | SPEC: SPEC-AUTH-001.md

import * as request from 'supertest';

describe('Auth E2E', () => {
  it('게스트 → 회원가입 전환 시 레벨 유지', async () => {
    // 1. 게스트 인증
    const guestRes = await request(app).post('/auth/guest')
      .send({ username: '플레이어123' });
    const { sessionId, accessToken } = guestRes.body;

    // 2. 레벨업 (게임 플레이 시뮬레이션)
    await request(app).post('/game/levelup')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ level: 5 });

    // 3. 회원가입 (게스트 전환)
    const registerRes = await request(app).post('/auth/register')
      .send({
        email: 'user@example.com',
        password: 'secure123',
        username: '플레이어123',
        guestSessionId: sessionId
      });

    // 4. 레벨 유지 확인
    expect(registerRes.body.user.level).toBe(5);
  });
});
```

**실행**:
```bash
cd apps/api
jest --config jest-e2e.config.js
# 또는
pnpm test:e2e
```

---

### 3. 커버리지 측정 (Jest)

```bash
cd apps/api
jest --coverage
```

**목표 커버리지**: 85% 이상 (현재 89% 달성)

---

---

## Supabase 인증 아키텍처 (AUTH-002)

@DOC:AUTH-002:ARCHITECTURE | SPEC: SPEC-AUTH-002.md

### 시스템 다이어그램

```
┌─────────────┐
│   사용자    │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│   Next.js App    │
│   (Frontend)     │
└────────┬─────────┘
         │
         ├─── Supabase Client ───┐
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌───────────────┐
│   NestJS API    │      │  Supabase     │
│   (Backend)     │◄─────│  Auth Service │
└─────────────────┘      └───────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌───────────────┐
│   PostgreSQL    │◄─────│  Auth Tables  │
│   (Game Data)   │      │  (Supabase)   │
└─────────────────┘      └───────────────┘
```

### OAuth 플로우

1. 사용자가 소셜 로그인 버튼 클릭
2. Supabase가 OAuth 프로바이더로 리디렉트
3. 사용자가 프로바이더에서 인증
4. 프로바이더가 `/auth/callback`으로 리디렉트
5. Supabase가 JWT 토큰 발급
6. 프론트엔드가 토큰 저장 및 자동 갱신

**지원 프로바이더**:
- Google OAuth 2.0
- GitHub OAuth 2.0
- Discord OAuth 2.0

### Anonymous Auth 플로우

```
사용자 행동: "게스트로 시작" 버튼 클릭
        ↓
[프론트엔드]
  await supabase.auth.signInAnonymously()
        ↓
[Supabase Auth]
  1. Anonymous 사용자 생성 (auth.users)
  2. JWT 발급 (user.is_anonymous = true)
  3. 세션 저장
        ↓
[응답]
  { session, user: { id, is_anonymous: true } }
        ↓
[프론트엔드]
  localStorage에 세션 저장 → 게임 입장
```

**Anonymous → 회원 전환**:
```typescript
// 게임 종료 후 "진행 상황 저장" 프롬프트
await supabase.auth.updateUser({
  email: 'user@example.com',
  password: 'new_password'
});
// → is_anonymous: false로 전환, 기존 데이터 유지
```

### RLS(Row Level Security) 정책

Supabase는 PostgreSQL RLS를 사용하여 데이터 접근 제어:

```sql
-- @CODE:AUTH-002:DATA | SPEC: SPEC-AUTH-002.md

-- 사용자는 자신의 게임 데이터만 조회 가능
CREATE POLICY "Users can view own games"
ON games FOR SELECT
USING (auth.uid() = user_id);

-- 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Anonymous 사용자는 프로필 생성 불가
CREATE POLICY "Only authenticated users can create profiles"
ON profiles FOR INSERT
WITH CHECK (auth.jwt() ->> 'is_anonymous' = 'false');
```

**보안 장점**:
- 백엔드 권한 검증 코드 불필요
- SQL 인젝션 방어 (PostgreSQL 네이티브)
- 감사 로그 자동 생성

### Supabase JWT 구조

```json
{
  "sub": "uuid-user-id",
  "email": "user@example.com",
  "role": "authenticated",
  "aal": "aal1",
  "amr": [
    {
      "method": "oauth",
      "timestamp": 1696000000
    }
  ],
  "session_id": "uuid-session-id",
  "is_anonymous": false,
  "app_metadata": {
    "provider": "google",
    "providers": ["google"]
  },
  "user_metadata": {
    "username": "플레이어123",
    "avatar_url": "https://...",
    "level": 5
  },
  "exp": 1696003600
}
```

**핵심 필드**:
- `sub`: 사용자 고유 ID (UUID)
- `is_anonymous`: Anonymous 여부 (true/false)
- `app_metadata.provider`: 로그인 방법 (google, github, discord, anonymous)
- `user_metadata`: 커스텀 프로필 정보

### 백엔드 통합 (NestJS)

```typescript
// @CODE:AUTH-002:API | SPEC: SPEC-AUTH-002.md

// apps/api/src/auth/supabase-auth.service.ts
import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // 서버용 키
    );
  }

  async verifyToken(token: string) {
    const { data: { user }, error } = await this.supabase.auth.getUser(token);
    if (error) throw new UnauthorizedException('Invalid token');
    return user;
  }

  async getUserProfile(userId: string) {
    const { data } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data;
  }

  async signOut(token: string) {
    await this.supabase.auth.admin.signOut(token);
  }
}
```

### 프론트엔드 통합 (Next.js)

```typescript
// @CODE:AUTH-002:UI | SPEC: SPEC-AUTH-002.md

// apps/web/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 자동 토큰 갱신 활성화 (기본 설정)
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('토큰 자동 갱신됨:', session?.expires_in);
  }
});
```

### 성능 특징

| 메트릭 | AUTH-001 (JWT) | AUTH-002 (Supabase) |
|--------|----------------|---------------------|
| 로그인 시간 | ~150ms | ~200ms (OAuth) |
| 토큰 갱신 | 수동 (API 호출) | 자동 (SDK) |
| 세션 조회 | Redis (<10ms) | Supabase RPC (~20ms) |
| Anonymous Auth | 커스텀 구현 | 네이티브 지원 |
| OAuth | 미지원 | Google, GitHub, Discord |

### 보안 강화

1. **PKCE (Proof Key for Code Exchange)**: Supabase가 자동으로 PKCE 플로우 적용 (중간자 공격 방어)
2. **자동 토큰 갱신**: 만료 5분 전 자동 갱신 (사용자 재로그인 불필요)
3. **RLS 정책**: PostgreSQL 레벨에서 권한 자동 제어
4. **감사 로그**: Supabase 대시보드에서 모든 인증 이벤트 확인

---

## 다음 단계

### AUTH-003: 비밀번호 재설정
- 이메일 인증 링크 발송
- 토큰 기반 재설정 페이지
- 비밀번호 변경 이력 관리

### AUTH-004: 다중 기기 세션 관리
- 세션 목록 조회
- 원격 로그아웃 (다른 기기 세션 종료)
- 활동 로그 (마지막 접속 시간, IP, User-Agent)

### AUTH-005: 2FA (이중 인증)
- TOTP (Time-based OTP) - Google Authenticator
- SMS 인증 (Twilio 연동)
- 백업 코드 생성

### AUTH-006: Apple Sign-In 추가
- iOS 앱 요구사항 준수
- Apple OAuth 2.0 연동

---

**작성자**: @Goos (doc-syncer 📖)
**리뷰어**: (TBD)
**승인일**: (TBD)
