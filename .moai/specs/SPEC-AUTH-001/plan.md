# @SPEC:AUTH-001 구현 계획서

## TDD 체크리스트

### RED 단계 (테스트 작성)

#### 1. 게스트 인증 테스트 (`tests/auth/guest.test.ts`)
- [ ] **게스트 세션 생성**
  - [ ] 유효한 닉네임으로 세션 생성 성공
  - [ ] 3-20자 길이 제약 검증
  - [ ] 특수문자 포함 시 거부
  - [ ] UUID v4 세션 ID 생성 확인

- [ ] **게스트 JWT 발급**
  - [ ] 액세스 토큰 발급 (15분 TTL)
  - [ ] 리프레시 토큰 발급 (7일 TTL)
  - [ ] JWT 페이로드 검증 (`sub`, `username`, `role: GUEST`)

- [ ] **Redis 세션 저장**
  - [ ] `guest:session:{sessionId}` 키 생성
  - [ ] TTL 7일(604800초) 설정
  - [ ] 세션 데이터 정합성 확인

#### 2. 회원가입 테스트 (`tests/auth/register.test.ts`)
- [ ] **회원가입 성공 시나리오**
  - [ ] 유효한 이메일+비밀번호로 회원가입
  - [ ] PostgreSQL users 테이블에 레코드 생성
  - [ ] 비밀번호 bcrypt 해싱 확인 (saltRounds=12)
  - [ ] JWT 토큰 쌍 발급

- [ ] **회원가입 실패 시나리오**
  - [ ] 중복 이메일 거부 (409 Conflict)
  - [ ] 비밀번호 8자 미만 거부 (400 Bad Request)
  - [ ] 유효하지 않은 이메일 형식 거부

- [ ] **게스트 전환 시나리오**
  - [ ] `guestSessionId` 포함 시 기존 게스트 데이터 매핑
  - [ ] `users.guest_session_id` 필드 업데이트
  - [ ] 게스트 Redis 세션 삭제 → 등록 유저 세션 생성

#### 3. 로그인 테스트 (`tests/auth/login.test.ts`)
- [ ] **로그인 성공**
  - [ ] 유효한 이메일+비밀번호로 로그인
  - [ ] bcrypt 비밀번호 검증
  - [ ] JWT 토큰 쌍 발급
  - [ ] Redis 세션 생성 (`session:{userId}`)

- [ ] **로그인 실패**
  - [ ] 존재하지 않는 이메일 거부 (401 Unauthorized)
  - [ ] 잘못된 비밀번호 거부 (401)
  - [ ] Rate Limiting 확인 (1분 5회 초과 시 429)

#### 4. 토큰 갱신 테스트 (`tests/auth/jwt.test.ts`)
- [ ] **토큰 갱신 성공**
  - [ ] 유효한 리프레시 토큰으로 액세스 토큰 갱신
  - [ ] 새 리프레시 토큰 발급 (일회용)
  - [ ] 기존 리프레시 토큰 무효화 (PostgreSQL `refresh_tokens` 삭제)

- [ ] **토큰 갱신 실패**
  - [ ] 만료된 리프레시 토큰 거부 (401)
  - [ ] 이미 사용된 리프레시 토큰 거부 (401)
  - [ ] 서명 불일치 토큰 거부 (403 Forbidden)

- [ ] **액세스 토큰 만료 처리**
  - [ ] 만료된 액세스 토큰 → 401 응답
  - [ ] 클라이언트 자동 리프레시 요청 시뮬레이션

#### 5. 세션 관리 테스트 (`tests/auth/session.test.ts`)
- [ ] **Redis 세션 생성/조회**
  - [ ] 세션 생성 시 `session:{userId}` 키 생성
  - [ ] TTL 30일(2592000초) 설정 (등록 유저)
  - [ ] 세션 조회 <10ms (P95 성능 검증)

- [ ] **세션 TTL 갱신**
  - [ ] 활동 시마다 TTL 갱신
  - [ ] 30일 비활성 시 자동 삭제

- [ ] **비활성 세션 정리**
  - [ ] Redis 만료 이벤트 핸들러 (선택적)
  - [ ] `redis-cli TTL session:{userId}` 확인

- [ ] **동시 세션 제한**
  - [ ] 사용자당 최대 5개 세션
  - [ ] 6번째 로그인 시 가장 오래된 세션 삭제

---

### GREEN 단계 (최소 구현)

#### 파일 구조
```
apps/api/src/auth/
├── auth.module.ts              # 인증 모듈
├── auth.service.ts             # 핵심 비즈니스 로직
├── auth.controller.ts          # REST API 엔드포인트
├── jwt.strategy.ts             # Passport JWT 전략
├── session.service.ts          # Redis 세션 관리
├── dto/
│   ├── guest-auth.dto.ts
│   ├── register.dto.ts
│   ├── login.dto.ts
│   └── refresh-token.dto.ts
└── guards/
    └── jwt-auth.guard.ts       # JWT 인증 가드
```

#### 구현 순서
1. **AuthModule 설정** (`auth.module.ts`)
   - JwtModule 설정 (액세스/리프레시 시크릿)
   - PassportModule 설정
   - Redis 클라이언트 주입

2. **DTO 정의** (`dto/`)
   - 요청/응답 타입 정의
   - Class Validator 데코레이터 추가

3. **AuthService 구현** (`auth.service.ts`)
   - `guestAuth()`: 게스트 세션 생성, JWT 발급
   - `register()`: 회원가입, bcrypt 해싱, PostgreSQL 저장
   - `login()`: 로그인, 비밀번호 검증, JWT 발급
   - `refreshTokens()`: 토큰 갱신, 일회용 리프레시 토큰

4. **SessionService 구현** (`session.service.ts`)
   - `createSession()`: Redis 세션 생성
   - `getSession()`: 세션 조회
   - `deleteSession()`: 세션 삭제
   - `extendTTL()`: TTL 갱신

5. **JwtStrategy 구현** (`jwt.strategy.ts`)
   - Passport JWT 전략
   - `validate()`: JWT 페이로드 검증, User 객체 반환

6. **AuthController 구현** (`auth.controller.ts`)
   - REST API 엔드포인트 7개
   - DTO 유효성 검사
   - 에러 핸들링

---

### REFACTOR 단계 (품질 개선)

#### 1. 보안 강화
- [ ] **환경 변수 분리**
  - `.env` 파일에 `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` 분리
  - `dotenv-vault` 또는 AWS Secrets Manager 연동 (프로덕션)

- [ ] **HTTPS 강제** (프로덕션)
  - `app.use(helmet())` - 보안 헤더
  - `app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true })`

- [ ] **Rate Limiting 적용**
  - `@UseGuards(ThrottlerGuard)` 데코레이터
  - 로그인: 1분 5회, 회원가입: 1분 3회

#### 2. 성능 최적화
- [ ] **Redis 파이프라인**
  - 다중 세션 조회 시 `pipeline()` 사용
  - 예: `redis.pipeline().get(...).get(...).exec()`

- [ ] **bcrypt 비동기 처리**
  - `bcrypt.hash()` → Worker Thread (선택적)
  - 또는 `@nestjs/bull` 큐 사용

- [ ] **JWT 캐싱**
  - 자주 검증되는 토큰 → Redis 캐싱 (선택적)
  - TTL: 1분 (짧게 유지)

#### 3. 코드 품질
- [ ] **TDD 이력 주석 추가**
  - 각 메서드 상단에 `@CODE:AUTH-001` TAG
  - RED-GREEN-REFACTOR 히스토리 주석

- [ ] **에러 핸들링 표준화**
  - Custom Exception Filter
  - 일관된 에러 응답 포맷

- [ ] **로깅 강화**
  - Pino 로거 (Fastify 내장)
  - 민감 정보 마스킹 (비밀번호, 토큰)

---

## 기술적 접근 방법

### NestJS 모듈 구조
```typescript
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([User, RefreshToken]),
  ],
  providers: [AuthService, SessionService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, SessionService],
})
export class AuthModule {}
```

### Passport JWT 전략
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
    });
  }

  async validate(payload: JWTPayload): Promise<User> {
    const user = await this.authService.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
```

### Redis 세션 관리
```typescript
@Injectable()
export class SessionService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async createSession(userId: string, data: any, ttl: number): Promise<void> {
    const key = `session:${userId}`;
    await this.redis.setex(key, ttl, JSON.stringify(data));
  }

  async getSession(userId: string): Promise<any | null> {
    const key = `session:${userId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(userId: string): Promise<void> {
    await this.redis.del(`session:${userId}`);
  }
}
```

---

## 우선순위별 마일스톤

### 1차 목표: 게스트 인증 (핵심 기능)
- 게스트 세션 생성
- JWT 발급
- Redis 세션 저장
- WebSocket 연결 시 JWT 검증

### 2차 목표: 회원가입/로그인
- 이메일+비밀번호 회원가입
- bcrypt 해싱
- PostgreSQL 저장
- 로그인 플로우

### 3차 목표: 토큰 관리
- 액세스 토큰 갱신
- 리프레시 토큰 일회용 처리
- 세션 동기화

### 4차 목표: 게스트 전환
- 게스트 → 등록 유저 전환
- 프로그레스 데이터 이관
- Redis 세션 마이그레이션

### 5차 목표 (Phase 2): OAuth 통합
- Google OAuth 2.0
- Kakao 로그인
- Discord 연동

---

## 리스크 및 대응 방안

### 기술적 리스크

**리스크 1: Redis 세션 유실**
- **영향**: 사용자 로그아웃 강제, UX 저하
- **확률**: 중간
- **대응**: Redis Sentinel (자동 장애 조치), RDB+AOF 백업

**리스크 2: JWT 탈취 (XSS, CSRF)**
- **영향**: 계정 도용, 보안 위협
- **확률**: 낮음 (HTTPS 강제 시)
- **대응**: HttpOnly 쿠키 저장, CSRF 토큰, SameSite 속성

**리스크 3: bcrypt 성능 병목**
- **영향**: 로그인 응답 시간 200ms+
- **확률**: 낮음 (saltRounds=12 기준)
- **대응**: Worker Thread 처리, 또는 Argon2 전환 (선택적)

### 비즈니스 리스크

**리스크 4: 낮은 게스트 전환율**
- **영향**: MAU 성장 둔화
- **확률**: 중간
- **대응**: 전환 인센티브 (100코인), UX 최적화

**리스크 5: 어뷰징 (다중 계정)**
- **영향**: 리소스 낭비, 랭킹 왜곡
- **확률**: 높음
- **대응**: IP 기반 제한, 디바이스 지문 인식

---

**작성일**: 2025-10-11
**작성자**: @Goos (via spec-builder 🏗️)
