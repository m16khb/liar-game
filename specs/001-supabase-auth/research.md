# Supabase Authentication System Research

**생성일**: 2025-11-08
**버전**: 1.0.0
**목적**: Supabase 기반 인증 시스템의 최신 Best Practices와 패턴 연구

## 1. JWT Token 관리

### 결정: Supabase Custom Access Token Hook 활용
**선택 이유**: Supabase JWT에 Backend 사용자 정보를 포함하여 DB 조회 없이 사용자 인증 처리, 성능 최적화

**구현 패턴**:
```typescript
// Custom Access Token Hook
export const customAccessTokenHandler = async (event: HookEvent) => {
  const { user } = event;
  const backendUser = await userService.findByOAuthId(user.id);

  return {
    claims: {
      user_id: backendUser.id,
      user_tier: backendUser.tier,
      user_role: backendUser.role,
    }
  };
};
```

**대안 검토**:
- 매 요청마다 DB 조회 → 성능 저하, 병목 현상 발생
- Supabase Claims만 사용 → Backend 사용자 정보 부족, 역할 관리 어려움

### Refresh Token Rotation
**결정**: Refresh Token Rotation 구현으로 보안 강화

**보안 이점**:
- 탈취된 Refresh Token 사용 방지
- 동시 로그인 기기 관리 용이
- 세션 하이재킹 공격 방지

**구현 시나리오**:
1. Refresh Token 사용 시 새로운 토큰 쌍 발급
2. 기존 Refresh Token 즉시 무효화
3. Rotation 실패 시 모든 세션 종료

## 2. Redis 세션 관리

### 결정: 역할별 TTL 설정
**설정**:
- 관리자 (ADMIN): 8시간 (28800초)
- 일반 사용자 (USER): 24시간 (86400초)
- 게스트 사용자: 2시간 (7200초)

**구현 코드**:
```typescript
const getSessionTTL = (userRole: UserRole): number => {
  const ttlMap = {
    [UserRole.ADMIN]: 28800,  // 8시간
    [UserRole.USER]: 86400,   // 24시간
  };
  return ttlMap[userRole] || 86400;
};
```

### 다중 디바이스 세션 관리
**패턴**: 사용자별 고유 세션 키로 다중 기기 지원
```
session:{userId}:{deviceId}
session:{userId}:current  // 현재 활성 세션
```

**장점**:
- 개별 기기 로그아웃 가능
- 세션 탈취 시 영향 범위 최소화
- 동시 접속 제어 용이

## 3. OAuth PKCE Flow

### 결정: PKCE (Proof Key for Code Exchange) 적용
**선택 이유**: 중간자 공격 방어, OAuth 2.1 표준 준수

**구현 흐름**:
1. **Code Verifier**: 랜덤 43-128자 문자열 생성
2. **Code Challenge**: Code Verifier를 SHA256 해싱 후 Base64URL 인코딩
3. **인증 요청**: Code Challenge와 challenge_method=S256 전송
4. **토큰 교환**: Code Verifier로 검증

**코드 예시**:
```typescript
// PKCE 생성
const generatePKCE = () => {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return { codeVerifier, codeChallenge };
};
```

### State 파라미터
**목적**: CSRF 공격 방지
**구현**: 랜덤 상태값 생성 및 세션 저장, 콜백 시 검증

## 4. TypeORM Entity 설계

### 인덱스 최적화
**필수 인덱스**:
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()  // OAuth ID 인덱스
  oauthId: string;

  @Column({ unique: true })
  @Index()  // 이메일 인덱스
  email: string;

  @Column()
  @Index()  // 역할 인덱스
  role: UserRole;

  @Column({ nullable: true })
  @Index()  // 소프트 딜리트 인덱스
  deletedAt: Date;
}
```

### Soft Delete 패턴
**장점**:
- 데이터 무결성 보존
- 감사 트레일 유지
- 계정 복구 기능 지원

**구현**:
```typescript
@DeleteDateColumn()
deletedAt?: Date;

// 기본 쿼리에서 삭제된 레코드 제외
@Entity('users')
@Index(['deletedAt'])
export class User {
  // ...
}
```

## 5. 보안 패턴

### Rate Limiting
**구현 전략**:
- **IP 기반**: 분당 100회 인증 요청 제한
- **사용자 기반**: 분당 20회 로그인 시도 제한
- **OAuth 제공업체별**: 분당 50회 요청 제한

**Redis 기반 구현**:
```typescript
const rateLimitKey = `rate_limit:${type}:${identifier}:${window}`;
const current = await redis.incr(rateLimitKey);
await redis.expire(rateLimitKey, 60);

if (current > limit) {
  throw new TooManyRequestsException();
}
```

### Token Blacklist
**목적**: 강제 로그아웃, 토큰 폐지
**구현**: Redis에 블랙리스트 토큰 저장
```
blacklist:token:{jti}  TTL: token_expires_at
```

### Security Event Logging
**대상 이벤트**:
- 로그인 성공/실패
- 토큰 갱신
- 권한 변경
- 다중 기기 로그인
- 보안 설정 변경

**로그 형식**:
```typescript
interface SecurityEvent {
  userId?: number;
  event: SecurityEventType;
  ip: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

## 6. 에러 처리 패턴

### 사용자 친화적인 한글 에러 메시지
**표준화된 에러 코드**:
```typescript
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다',
  EMAIL_EXISTS: '이미 가입된 이메일 주소입니다',
  INVALID_TOKEN: '로그인이 만료되었습니다. 다시 로그인해주세요',
  OAUTH_ERROR: '소셜 로그인에 실패했습니다. 잠시 후 다시 시도해주세요',
  RATE_LIMIT_EXCEEDED: '너무 많은 요청을 보내셨습니다. 1분 후 다시 시도해주세요',
  NETWORK_ERROR: '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요',
};
```

### 네트워크 장애 처리
**전략**: Exponential Backoff와 자동 재시도
```typescript
const retryWithBackoff = async (operation, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(Math.pow(2, i) * 1000);
    }
  }
};
```

## 7. 모니터링 및 운영

### 성능 지표
- **로그인 성공률**: 95% 이상 목표
- **인증 응답시간**: 100ms 이하 목표
- **토큰 갱신 성공률**: 99.9% 이상 목표

### 상태 확인 (Health Check)
**필수 확인 항목**:
- Supabase 연결 상태
- Redis 연결 상태
- 데이터베이스 연결 상태
- OAuth 제공업체 연동 상태

## 8. 향후 개선 방향

### 단기 개선 (1-2주)
1. **Rate Limiting 구현**: IP/사용자 기반 제한 로직 추가
2. **PKCE Flow 적용**: OAuth 보안 강화
3. **에러 메시지 표준화**: 사용자 친화적인 한글 메시지 적용

### 중기 개선 (1-2개월)
1. **Token Rotation**: Refresh Token Rotation 구현
2. **Security Dashboard**: 보안 이벤트 대시보드 구축
3. **Advanced Monitoring**: 실시간 보안 이벤트 알림 시스템

### 장기 개선 (3-6개월)
1. **Multi-Factor Authentication**: 2FA 인증 추가
2. **Biometric Authentication**: 생체 인증 지원
3. **Zero Trust Architecture**: 제로 트러스트 보안 모델 적용

## 결론

현재 프로젝트의 Supabase 인증 시스템은 대부분의 Best Practices를 잘 구현하고 있습니다. Custom Access Token Hook, Redis 세션 관리, TypeORM Entity 설계 등 핵심 패턴이 올바르게 적용되어 있습니다.

향후 Rate Limiting 강화, PKCE Flow 적용, Security Event Logging 구축을 통해 시스템의 보안성과 안정성을 더욱 향상시킬 수 있습니다.