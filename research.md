# Supabase 인증 시스템 Best Practices Research

이 문서는 Supabase 인증 시스템의 최신 Best Practices와 패턴을 연구한 결과입니다. 현재 프로젝트의 구현을 바탕으로 각 항목별 구체적인 가이드와 코드 예시를 제공합니다.

## 1. JWT Token 관리

### Access Token과 Refresh Token의 최적 관리 방법

**Supabase JWT 구조**
```typescript
interface SupabaseJwtPayload {
  aud: string; // 'authenticated'
  exp: number; // 만료 시간 (기본 24시간)
  iat: number; // 발급 시간
  sub: string; // Supabase User ID (UUID)
  email?: string;
  app_metadata: {
    provider?: string; // 'google', 'github', 'email'
    providers?: string[];
  };
  user_metadata: Record<string, any>;
  role: string; // 'authenticated' | 'anon'
  // Custom Claims (Backend Hook에서 추가)
  user_id?: number; // Backend User ID
  user_tier?: string; // UserTier
  user_role?: UserRole;
}
```

**Best Practices**

1. **Access Token 유효기간 설정**
   - 기본: 1시간 (보안 강화)
   - 최대: 24시간 (편의성)
   - `settings.json`에서 JWT_EXPIRY 설정

2. **Refresh Token 전략**
   - Supabase Refresh Token은 만료 없음 (단일 사용)
   - Rotation 기법:每次 사용 시 새로운 Refresh Token 발급
   - Redis에 Refresh Token Hash 저장하여 재사용 방지

```typescript
// Refresh Token Rotation 예시
async refreshSession(refreshToken: string) {
  const { data, error } = await supabase.auth.refreshSession(refreshToken);

  if (data.session?.refresh_token) {
    // 이전 Refresh Token 무효화
    await this.invalidateOldRefreshToken(refreshToken);
    // 새 Refresh Token 등록
    await this.registerNewRefreshToken(data.session.refresh_token);
  }

  return data.session;
}
```

### Custom Claims 활용 패턴

**Custom Access Token Hook 활용**
```typescript
// Supabase Custom Access Token Hook에서 Custom Claims 추가
async handleSupabaseAuthHook(
  userId: string,
  claims: Record<string, any>,
  authMethod: string
): Promise<{ claims: Record<string, any> }> {
  const user = await this.userService.findBySupabaseId(userId);

  return {
    claims: {
      ...claims,
      // Backend 사용자 정보 추가
      user_id: user.id,
      user_tier: user.tier,
      user_role: user.role,
      // 추가 메타데이터
      permissions: user.permissions,
      last_login_at: new Date().toISOString(),
    }
  };
}
```

**Custom Claims 활용 시 주의사항**
- JWT 크기 제한: 8KB 이하 권장
- 민감 정보 제외: 비밀번호, 카드 정보 등
- 정기적 업데이트: 토큰 만료 시 반영됨

## 2. Redis 세션 관리

### Supabase와 Redis 연동 시 세션 관리 Best Practices

**세션 구조 설계**
```typescript
interface RedisSession {
  userId: number;
  supabaseId: string;
  email: string;
  role: UserRole;
  tier: UserTier;
  deviceId?: string;
  ipAddress: string;
  lastActive: string;
  accessToken: string; // 암호화된 Access Token
  permissions: string[];
}
```

**TTL 설정 전략**
```typescript
// 세션 TTL 설정 (초 단위)
const SESSION_TTL = {
  // 기본 사용자 세션: 24시간
  USER_SESSION: 86400,

  // 관리자 세션: 8시간 (보안 강화)
  ADMIN_SESSION: 28800,

  // 모바일 앱 세션: 30일
  MOBILE_SESSION: 2592000,

  // 비활성 사용자 타임아웃: 5분
  INACTIVE_TIMEOUT: 300,

  // 방 캐시: 1시간
  ROOM_CACHE: 3600,
};
```

**Redis 키 전략**
```typescript
const REDIS_KEYS = {
  // 사용자 세션
  SESSION: (userId: number) => `session:${userId}`,

  // 다중 디바이스 세션 관리
  USER_SESSIONS: (userId: number) => `sessions:user:${userId}`,

  // 온라인 사용자
  ONLINE_USER: (userId: number) => `online:user:${userId}`,

  // 방 관련
  ROOM_PLAYERS: (roomId: number) => `room:${roomId}:players`,
  ROOM_CACHE: (roomCode: string) => `cache:room:${roomCode}`,

  // 토큰 블랙리스트
  TOKEN_BLACKLIST: (tokenId: string) => `blacklist:token:${tokenId}`,
};
```

**세션 관리 구현 예시**
```typescript
@Injectable()
export class RedisSessionService {
  // 세션 생성 및 저장
  async createUserSession(user: User, deviceInfo: DeviceInfo): Promise<string> {
    const sessionId = this.generateSessionId();
    const sessionData: RedisSession = {
      userId: user.id,
      supabaseId: user.oauthId,
      email: user.email,
      role: user.role,
      tier: user.tier,
      lastActive: new Date().toISOString(),
      ...deviceInfo,
    };

    // 사용자별 TTL 설정
    const ttl = user.role === UserRole.ADMIN
      ? SESSION_TTL.ADMIN_SESSION
      : SESSION_TTL.USER_SESSION;

    await Promise.all([
      this.client.setEx(REDIS_KEYS.SESSION(sessionId), ttl, JSON.stringify(sessionData)),
      this.client.sAdd(REDIS_KEYS.USER_SESSIONS(user.id), sessionId),
      this.client.setEx(REDIS_KEYS.ONLINE_USER(user.id), SESSION_TTL.INACTIVE_TIMEOUT, '1'),
    ]);

    return sessionId;
  }

  // 세션 갱신 (Heartbeat)
  async extendSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      const ttl = session.role === UserRole.ADMIN
        ? SESSION_TTL.ADMIN_SESSION
        : SESSION_TTL.USER_SESSION;

      await Promise.all([
        this.client.expire(REDIS_KEYS.SESSION(sessionId), ttl),
        this.client.expire(REDIS_KEYS.ONLINE_USER(session.userId), SESSION_TTL.INACTIVE_TIMEOUT),
      ]);
    }
  }

  // 모든 세션 무효화 (Global Sign Out)
  async invalidateAllUserSessions(userId: number): Promise<void> {
    const sessionIds = await this.client.sMembers(REDIS_KEYS.USER_SESSIONS(userId));

    if (sessionIds.length > 0) {
      const sessionKeys = sessionIds.map(id => REDIS_KEYS.SESSION(id));
      await Promise.all([
        this.client.del(sessionKeys),
        this.client.del(REDIS_KEYS.USER_SESSIONS(userId)),
        this.client.del(REDIS_KEYS.ONLINE_USER(userId)),
      ]);
    }
  }
}
```

## 3. OAuth PKCE Flow

### Supabase에서 OAuth PKCE 구현 시 보안 강화 방법

**PKCE Flow 구현**
```typescript
@Injectable()
export class OAuthService {

  // PKCE Code Verifier 생성
  generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64urlEncode(array);
  }

  // PKCE Code Challenge 생성
  async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return base64urlEncode(new Uint8Array(digest));
  }

  // OAuth 시작 시 PKCE 저장
  async initiateOAuth(provider: string, redirectUri: string): Promise<OAuthInitData> {
    const verifier = this.generateCodeVerifier();
    const challenge = await this.generateCodeChallenge(verifier);

    // PKCE 데이터를 Redis에 임시 저장 (10분 TTL)
    const pkceId = this.generatePkceId();
    await this.redis.setEx(
      `oauth:pkce:${pkceId}`,
      600,
      JSON.stringify({ verifier, provider, redirectUri })
    );

    const { data, error } = await this.supabaseClient.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${redirectUri}?pkce=${pkceId}`,
        queryParams: {
          code_challenge: challenge,
          code_challenge_method: 'S256',
        },
      },
    });

    return { url: data.url, pkceId };
  }

  // OAuth 콜백 처리
  async handleOAuthCallback(code: string, pkceId: string): Promise<AuthResult> {
    // PKCE 데이터 조회
    const pkceData = await this.redis.get(`oauth:pkce:${pkceId}`);
    if (!pkceData) {
      throw new BadRequestException('Invalid or expired PKCE session');
    }

    const { verifier } = JSON.parse(pkceData);

    // 코드 교환 시 PKCE verifier 사용
    const { data, error } = await this.supabaseClient.auth.exchangeCodeForSession(code);

    // 사용자 PKCE 데이터 삭제
    await this.redis.del(`oauth:pkce:${pkceId}`);

    if (error) {
      throw new UnauthorizedException('OAuth callback failed');
    }

    return this.processAuthSuccess(data.session);
  }
}
```

**보안 강화 패턴**

1. **State 파라미터 추가**
```typescript
// State 파라미터 생성 및 검증
async generateState(userId: number): Promise<string> {
  const state = jwt.sign(
    { userId, timestamp: Date.now() },
    process.env.OAUTH_STATE_SECRET!,
    { expiresIn: '10m' }
  );
  return state;
}

// OAuth URL 생성 시 state 추가
const state = await this.generateState(userId);
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${callbackUrl}`,
    queryParams: { state },
  },
});
```

2. **도메인 허용 목록**
```typescript
// 리디렉션 URI 검증
validateRedirectUri(uri: string): boolean {
  const allowedDomains = [
    'https://yourapp.com',
    'https://app.yourapp.com',
    'http://localhost:3000', // 개발 환경
  ];

  try {
    const url = new URL(uri);
    return allowedDomains.some(domain =>
      url.origin === domain || url.hostname === 'localhost'
    );
  } catch {
    return false;
  }
}
```

## 4. TypeORM Entity 설계

### 사용자 Entity 설계 시 Soft Delete, OAuth ID 관리, 인덱스 최적화

**현재 User Entity 분석 및 개선안**
```typescript
@Entity('users')
@Index(['oauthId']) // OAuth ID 고유 검색 최적화
@Index(['email']) // 이메일 검색 최적화
@Index(['deletedAt']) // Soft Delete 조회 최적화
@Index(['role', 'tier']) // 역할/등급 기반 조회 최적화
export class User {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index() // Provider 기반 조회 최적화
  oauthProvider?: string;

  @Column({ type: 'varchar', length: 36, unique: true, nullable: false })
  @Index() // Supabase 연동 조회 최적화
  oauthId: string;

  @Column({
    type: 'enum',
    enum: UserTier,
    default: UserTier.MEMBER
  })
  @Index() // 등급 기반 필터링 최적화
  tier: UserTier;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  @Index() // 역할 기반 필터링 최적화
  role: UserRole;

  @Column({ type: 'timestamp', nullable: true })
  @Index() // Soft Delete 조회 최적화
  deletedAt?: Date;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  @Index() // 이메일 로그인 최적화
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  nickname: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl?: string;

  // 추가 필드 (보안/감사 목적)
  @Column({ type: 'varchar', length: 45, nullable: true })
  lastLoginIp?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'int', default: 0 })
  loginCount: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // 계정 활성화 상태

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Soft Delete를 위한 메소드
  softDelete(): void {
    this.deletedAt = new Date();
    this.isActive = false;
  }

  // 복원을 위한 메소드
  restore(): void {
    this.deletedAt = null;
    this.isActive = true;
  }
}
```

**Repository Pattern 구현**
```typescript
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {}

  // OAuth ID로 사용자 조회 (가장 빈번한 조회)
  async findByOAuthId(oauthId: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { oauthId },
      select: ['id', 'email', 'nickname', 'role', 'tier', 'oauthProvider']
    });
  }

  // 이메일로 활성 사용자 조회 (로그인용)
  async findByActiveEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: {
        email: email.toLowerCase(),
        deletedAt: IsNull(),
        isActive: true
      }
    });
  }

  // Soft Delete 포함 전체 사용자 조회
  async findByIdWithDeleted(id: number): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id },
      withDeleted: true
    });
  }

  // 역할 기반 사용자 목록 조회 (페이징)
  async findByRole(role: UserRole, page: number = 1, limit: number = 20): Promise<User[]> {
    return this.userRepo.find({
      where: {
        role,
        deletedAt: IsNull()
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });
  }

  // 벌크 Soft Delete
  async softDeleteByIds(ids: number[]): Promise<void> {
    await this.userRepo.update(ids, {
      deletedAt: new Date(),
      isActive: false
    });
  }

  // 인덱스를 활용한 통계 조회
  async getStatistics(): Promise<UserStats> {
    const totalUsers = await this.userRepo.count({ where: { deletedAt: IsNull() } });
    const activeUsers = await this.userRepo.count({
      where: { deletedAt: IsNull(), isActive: true }
    });
    const adminUsers = await this.userRepo.count({
      where: { role: UserRole.ADMIN, deletedAt: IsNull() }
    });

    return { totalUsers, activeUsers, adminUsers };
  }
}
```

## 5. 보안 패턴

### Rate Limiting, Token Rotation, Security Event Logging

**Rate Limiting 구현**
```typescript
@Injectable()
export class RateLimitService {
  constructor(private readonly redis: RedisSessionService) {}

  // IP 기반 Rate Limiting
  async checkIpRateLimit(ip: string, endpoint: string, limit: number = 100, window: number = 3600): Promise<boolean> {
    const key = `rate_limit:ip:${ip}:${endpoint}`;
    const current = await this.redis.getClient().incr(key);

    if (current === 1) {
      await this.redis.getClient().expire(key, window);
    }

    return current <= limit;
  }

  // 사용자 기반 Rate Limiting
  async checkUserRateLimit(userId: number, action: string, limit: number = 10, window: number = 60): Promise<boolean> {
    const key = `rate_limit:user:${userId}:${action}`;
    const current = await this.redis.getClient().incr(key);

    if (current === 1) {
      await this.redis.getClient().expire(key, window);
    }

    return current <= limit;
  }

  // 실패 횟수 기반 블록 (로그인 시도)
  async handleFailedLogin(email: string, ip: string): Promise<void> {
    const emailKey = `auth_failed:email:${email}`;
    const ipKey = `auth_failed:ip:${ip}`;

    await Promise.all([
      this.redis.getClient().incr(emailKey),
      this.redis.getClient().incr(ipKey),
      this.redis.getClient().expire(emailKey, 3600), // 1시간
      this.redis.getClient().expire(ipKey, 3600),
    ]);
  }

  // 블록 상태 확인
  async isBlocked(email: string, ip: string): Promise<{ email: boolean; ip: boolean }> {
    const [emailFailed, ipFailed] = await Promise.all([
      this.redis.getClient().get(`auth_failed:email:${email}`),
      this.redis.getClient().get(`auth_failed:ip:${ip}`),
    ]);

    const BLOCK_THRESHOLD = 5;

    return {
      email: parseInt(emailFailed || '0') >= BLOCK_THRESHOLD,
      ip: parseInt(ipFailed || '0') >= BLOCK_THRESHOLD,
    };
  }
}
```

**Token Rotation 구현**
```typescript
@Injectable()
export class TokenRotationService {
  // Refresh Token Rotation
  async rotateRefreshToken(currentToken: string): Promise<string> {
    // 1. 현재 토큰 정보 추출
    const payload = jwt.decode(currentToken) as any;
    const rotationCount = payload.rotation_count || 0;

    // 2. Rotation 횟수 제한 확인
    if (rotationCount >= 10) {
      throw new UnauthorizedException('Token rotation limit exceeded');
    }

    // 3. 이전 토큰 블랙리스트 추가
    await this.blacklistToken(currentToken);

    // 4. 새 토큰 생성
    const newPayload = {
      ...payload,
      rotation_count: rotationCount + 1,
      iat: Math.floor(Date.now() / 1000),
    };

    const newToken = jwt.sign(newPayload, process.env.JWT_SECRET!);

    // 5. 새 토큰 저장
    await this.saveRefreshToken(newToken, payload.sub);

    return newToken;
  }

  // 토큰 블랙리스트
  private async blacklistToken(token: string): Promise<void> {
    const payload = jwt.decode(token) as any;
    const key = `blacklist:token:${payload.jti}`;
    const ttl = payload.exp - Math.floor(Date.now() / 1000);

    if (ttl > 0) {
      await this.redis.getClient().setEx(key, ttl, '1');
    }
  }

  // 토큰 블랙리스트 확인
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const exists = await this.redis.getClient().exists(`blacklist:token:${jti}`);
    return exists === 1;
  }
}
```

**Security Event Logging**
```typescript
@Injectable()
export class SecurityEventLogger {
  private readonly logger = new Logger(SecurityEventLogger.name);

  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const logData = {
      timestamp: new Date().toISOString(),
      event_type: event.type,
      user_id: event.userId,
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      details: event.details,
      severity: this.getSeverityLevel(event.type),
    };

    // 로컬 로깅
    this.logger.log(JSON.stringify(logData));

    // Redis에 임시 저장 (실시간 모니터링용)
    await this.redis.getClient().lpush(
      'security_events',
      JSON.stringify(logData)
    );

    // 최근 1000개 이벤트만 유지
    await this.redis.getClient().ltrim('security_events', 0, 999);

    // 위험 이벤트는 즉시 관리자에게 알림
    if (logData.severity === 'HIGH' || logData.severity === 'CRITICAL') {
      await this.notifyAdmins(logData);
    }
  }

  private getSeverityLevel(eventType: string): string {
    const severityMap = {
      'LOGIN_SUCCESS': 'LOW',
      'LOGIN_FAILED': 'MEDIUM',
      'PASSWORD_RESET': 'MEDIUM',
      'ACCOUNT_LOCKED': 'HIGH',
      'SUSPICIOUS_ACTIVITY': 'HIGH',
      'DATA_BREACH_ATTEMPT': 'CRITICAL',
    };

    return severityMap[eventType] || 'MEDIUM';
  }

  async getRecentEvents(limit: number = 100): Promise<SecurityEvent[]> {
    const events = await this.redis.getClient().lRange('security_events', 0, limit - 1);
    return events.map(event => JSON.parse(event));
  }

  async getEventsByType(eventType: string, hours: number = 24): Promise<SecurityEvent[]> {
    const allEvents = await this.getRecentEvents(1000);
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    return allEvents.filter(event =>
      event.event_type === eventType &&
      new Date(event.timestamp) > cutoffTime
    );
  }
}
```

## 6. 에러 처리

### 인증 실패, OAuth 장애, 네트워크 연결 실패 시 UX 패턴

**Global Exception Filter**
```typescript
@Catch()
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    let status = 500;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof UnauthorizedException) {
      status = 401;
      message = 'Authentication required';
      errorCode = 'AUTH_REQUIRED';
    } else if (exception instanceof ForbiddenException) {
      status = 403;
      message = 'Access denied';
      errorCode = 'ACCESS_DENIED';
    } else if (exception instanceof BadRequestException) {
      status = 400;
      message = 'Invalid request';
      errorCode = 'INVALID_REQUEST';
    }

    response.code(status).send({
      success: false,
      error: {
        code: errorCode,
        message,
        timestamp: new Date().toISOString(),
        path: ctx.getRequest().url,
      }
    });
  }
}
```

**인증 실패 처리 패턴**
```typescript
@Injectable()
export class AuthErrorHandler {

  // 사용자 친화적인 에러 메시지
  private getErrorMessage(error: any): string {
    if (error.message?.includes('Invalid login credentials')) {
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    }

    if (error.message?.includes('Email not confirmed')) {
      return '이메일 인증이 필요합니다. 인증 메일을 확인해주세요.';
    }

    if (error.message?.includes('Too many requests')) {
      return '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
    }

    if (error.message?.includes('User is disabled')) {
      return '계정이 비활성화되었습니다. 고객센터에 문의해주세요.';
    }

    return '로그인에 실패했습니다. 다시 시도해주세요.';
  }

  // 로그인 실패 처리
  async handleLoginFailure(email: string, error: any, ipAddress: string): Promise<void> {
    const errorMessage = this.getErrorMessage(error);

    // 실패 로그 기록
    await this.securityLogger.logSecurityEvent({
      type: 'LOGIN_FAILED',
      userId: null,
      ipAddress,
      userAgent: null,
      details: {
        email,
        error: error.message,
        timestamp: new Date().toISOString(),
      }
    });

    // Rate Limiting 적용
    await this.rateLimitService.handleFailedLogin(email, ipAddress);

    throw new UnauthorizedException(errorMessage);
  }

  // OAuth 장애 처리
  async handleOAuthFailure(provider: string, error: any, redirectUri: string): Promise<void> {
    // OAuth 공급자 장애 로깅
    await this.securityLogger.logSecurityEvent({
      type: 'OAUTH_FAILURE',
      userId: null,
      ipAddress: null,
      userAgent: null,
      details: {
        provider,
        error: error.message,
        redirectUri,
        timestamp: new Date().toISOString(),
      }
    });

    // 사용자에게 표시할 메시지
    const providerNames = {
      google: 'Google',
      github: 'GitHub',
      discord: 'Discord',
    };

    const message = `${providerNames[provider] || provider} 로그인에 실패했습니다. 잠시 후 다시 시도하거나 다른 로그인 방법을 이용해주세요.`;

    throw new BadRequestException(message);
  }

  // 네트워크 연결 실패 처리
  async handleNetworkFailure(service: string, error: any): Promise<void> {
    // 네트워크 장애 로깅
    this.logger.error(`Network failure in ${service}`, error);

    await this.securityLogger.logSecurityEvent({
      type: 'NETWORK_FAILURE',
      userId: null,
      ipAddress: null,
      userAgent: null,
      details: {
        service,
        error: error.message,
        timestamp: new Date().toISOString(),
      }
    });

    throw new ServiceUnavailableException('서비스에 일시적으로 접속할 수 없습니다. 잠시 후 다시 시도해주세요.');
  }
}
```

**Frontend UX 패턴 (React 예시)**
```typescript
// 인증 에러 처리 커스텀 훅
export const useAuthError = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = (error: any) => {
    setIsLoading(false);

    if (error.response?.data?.error) {
      const { code, message } = error.response.data.error;

      switch (code) {
        case 'AUTH_REQUIRED':
          setError('로그인이 필요합니다.');
          break;
        case 'ACCESS_DENIED':
          setError('접근 권한이 없습니다.');
          break;
        case 'INVALID_REQUEST':
          setError(message);
          break;
        default:
          setError('알 수 없는 오류가 발생했습니다.');
      }
    } else {
      setError('서버와 통신할 수 없습니다. 인터넷 연결을 확인해주세요.');
    }
  };

  const clearError = () => setError(null);

  return { error, isLoading, handleError, clearError, setIsLoading };
};

// 로그인 컴포넌트에서의 활용
export const LoginForm: React.FC = () => {
  const { error, isLoading, handleError, clearError, setIsLoading } = useAuthError();

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    clearError();

    try {
      await signIn(formData);
      // 성공 처리
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <button type="submit" disabled={isLoading}>
        {isLoading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
};
```

## 결론

이 연구를 통해 Supabase 인증 시스템의 Best Practices를 다음과 같이 정리할 수 있습니다:

1. **JWT Token 관리**: Custom Claims를 통한 효율적인 사용자 정보 전달, Refresh Token Rotation으로 보안 강화
2. **Redis 세션 관리**: TTL 전략과 키 설계로 효율적인 세션 관리, 다중 디바이스 지원
3. **OAuth PKCE Flow**: State 파라미터와 도메인 검증으로 보안 강화
4. **TypeORM Entity 설계**: 인덱스 최적화와 Soft Delete로 성능 및 유연성 확보
5. **보안 패턴**: Rate Limiting, Token Rotation, Security Event Logging으로 종합적 보안 구현
6. **에러 처리**: 사용자 친화적인 메시지와 자동 재시도 로직으로 UX 개선

현재 프로젝트의 구현은 이러한 Best Practices를 대부분 따르고 있으며, 일부 개선 사항을 적용하면 더욱 견고한 인증 시스템을 구축할 수 있을 것입니다.