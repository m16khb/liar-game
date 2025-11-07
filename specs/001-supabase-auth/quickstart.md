# Supabase Authentication System Quickstart

**생성일**: 2025-11-08
**버전**: 1.0.0
**목적**: 개발자를 위한 Supabase 인증 시스템 빠른 시작 가이드

## 시작하기 전에

### 사전 요구사항
- Node.js 25.1.0 이상
- pnpm 10.x 이상
- MySQL v8 LTS
- Redis v8 LTS
- Supabase 프로젝트 (OAuth 설정 완료)

### 프로젝트 구조 이해
```
liar-game/
├── apps/
│   ├── api/                # NestJS 백엔드
│   └── web/                # React 프론트엔드
├── packages/
│   ├── types/              # 공유 타입
│   └── constants/          # 상수 정의
└── specs/001-supabase-auth/ # 인증 시스템 명세
```

## 개발 환경 설정

### 1. 의존성 설치
```bash
# 프로젝트 의존성 설치
pnpm install

# 개발 서버 시작
pnpm turbo dev
```

### 2. 환경 변수 설정
```bash
# .env.local
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=liaruser
DB_PASSWORD=your-password
DB_NAME=liardb

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-jwt-secret
```

### 3. 데이터베이스 마이그레이션
```bash
cd apps/api
pnpm migration:run
```

## 핵심 개념 이해

### 1. 인증 흐름
```
사용자 → [프론트엔드] → [Supabase Auth] → [백엔드 API]
                              ↓
                          [Custom JWT Hook]
                              ↓
                          [Backend User Info]
```

### 2. JWT 토큰 구조
```typescript
interface SupabaseJwtPayload {
  sub: string;              // Supabase User ID
  user_id: number;          // Backend User ID
  user_tier: UserTier;      // 사용자 등급
  user_role: UserRole;      // 사용자 역할
  email?: string;
  app_metadata: {
    provider?: string;      // OAuth 제공업체
  };
}
```

### 3. 세션 관리
- **Redis 기반**: TTL 설정으로 자동 만료
- **다중 디바이스**: 각 디바이스별 독립 세션
- **실시간 동기화**: 온라인 상태 관리

## API 사용법

### 1. 이메일 로그인
```typescript
// 프론트엔드
const login = async (email: string, password: string) => {
  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const { data } = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    return data.user;
  } catch (error) {
    console.error('로그인 실패:', error);
  }
};
```

### 2. OAuth 소셜 로그인
```typescript
// OAuth URL 생성
const getOAuthUrl = async (provider: 'google' | 'github' | 'discord') => {
  const response = await fetch(`/auth/oauth-url?provider=${provider}`);
  const { data } = await response.json();

  // 리디렉션
  window.location.href = data.authUrl;
};

// OAuth 콜백 처리
const handleOAuthCallback = async (code: string, state: string, provider: string) => {
  const response = await fetch(`/auth/oauth-callback?code=${code}&state=${state}&provider=${provider}`);
  const { data } = await response.json();

  // 토큰 저장
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);

  return data.user;
};
```

### 3. 토큰 갱신
```typescript
// 자동 토큰 갱신
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    throw new Error('Refresh token이 없습니다');
  }

  const response = await fetch('/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  const { data } = await response.json();

  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);

  return data.accessToken;
};
```

### 4. 프로필 관리
```typescript
// 프로필 조회
const getProfile = async () => {
  const token = localStorage.getItem('accessToken');

  const response = await fetch('/auth/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  return response.json();
};

// 프로필 수정
const updateProfile = async (updates: { nickname?: string, avatarUrl?: string }) => {
  const token = localStorage.getItem('accessToken');

  const response = await fetch('/auth/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });

  return response.json();
};
```

## 백엔드 구현

### 1. JWT 가드 설정
```typescript
// jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
```

### 2. 사용자 서비스
```typescript
// user.service.ts
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async findByOAuthId(oauthId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { oauthId, deletedAt: IsNull() }
    });
  }

  async createFromOAuth(oauthData: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(oauthData);
    return this.userRepository.save(user);
  }

  async searchUsers(query: string, type: 'nickname' | 'email', limit = 10): Promise<User[]> {
    const qb = this.userRepository.createQueryBuilder('user')
      .where('user.deletedAt IS NULL')
      .limit(limit);

    if (type === 'nickname') {
      qb.andWhere('user.nickname LIKE :query', { query: `%${query}%` });
    } else {
      qb.andWhere('user.email = :email', { email: query });
    }

    return qb.getMany();
  }
}
```

### 3. Redis 세션 관리
```typescript
// redis-session.service.ts
@Injectable()
export class RedisSessionService {
  constructor(
    @Inject('REDIS') private redis: Redis
  ) {}

  async setSession(userId: number, sessionData: any, ttl = 86400): Promise<void> {
    const key = `session:${userId}`;
    await this.redis.setex(key, ttl, JSON.stringify(sessionData));
  }

  async getSession(userId: number): Promise<any> {
    const key = `session:${userId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(userId: number): Promise<void> {
    const key = `session:${userId}`;
    await this.redis.del(key);
  }

  async setUserOnline(userId: number): Promise<void> {
    const key = `online:${userId}`;
    await this.redis.setex(key, 300, '1'); // 5분
  }
}
```

## 프론트엔드 구현

### 1. Auth Context 설정
```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: ProfileUpdates) => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 자동 토큰 갱신 설정
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        logout();
      }
    }, 30 * 60 * 1000); // 30분

    return () => clearInterval(interval);
  }, []);

  // 로그인 함수
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const { data } = await response.json();
      setUser(data.user);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
    } finally {
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 2. API Client 설정
```typescript
// lib/api.ts
class ApiClient {
  private baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('accessToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // 토큰 갱신 시도
      try {
        await this.refreshToken();
        // 재시도
        return this.request(endpoint, options);
      } catch {
        this.logout();
        throw new Error('인증이 만료되었습니다');
      }
    }

    return response.json();
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const { data } = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
  }

  private logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }

  // API 메서드들
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(updates: ProfileUpdates) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
}

export const api = new ApiClient();
```

## 테스트

### 1. 백엔드 테스트
```bash
# 단위 테스트 실행
cd apps/api
pnpm test

# 테스트 커버리지
pnpm test -- --coverage
```

### 2. 프론트엔드 테스트
```bash
# 단위 테스트 실행
cd apps/web
pnpm test

# E2E 테스트 (설정 시)
pnpm test:e2e
```

### 3. API 테스트 (Postman/curl)
```bash
# 로그인 테스트
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 프로필 조회 테스트
curl -X GET http://localhost:4000/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 트러블슈팅

### 1. 인증 관련 문제
- **토큰 만료**: 자동 갱신 로직 확인
- **CORS 오류**: Supabase 도메인 설정 확인
- **State 불일치**: OAuth 콜백 URL 확인

### 2. 데이터베이스 관련 문제
- **연결 실패**: 환경 변수와 DB 상태 확인
- **마이그레이션 오류**: 마이그레이션 파일 순서 확인
- **권한 오류**: DB 사용자 권한 확인

### 3. Redis 관련 문제
- **연결 실패**: Redis 서버 상태 확인
- **세션 만료**: TTL 설정 확인
- **메모리 부족**: Redis 메모리 사용량 확인

## 모니터링

### 1. 로그 확인
```bash
# 백엔드 로그
cd apps/api
pnpm logs

# 데이터베이스 로그
docker logs liar-game-mysql

# Redis 로그
docker logs liar-game-redis
```

### 2. 성능 모니터링
- API 응답시간: < 100ms 목표
- DB 쿼리 시간: < 50ms 목표
- Redis 응답시간: < 10ms 목표

## 다음 단계

1. **보안 강화**: Rate Limiting, IP 차단 구현
2. **테스트 확장**: 통합 테스트 추가
3. **모니터링**: 로깅, 알림 시스템 구축
4. **성능 최적화**: 캐시 전략, DB 인덱스 튜닝

## 도움말

- [Supabase 공식 문서](https://supabase.com/docs)
- [NestJS 문서](https://nestjs.com/)
- [TypeORM 문서](https://typeorm.io/)
- 프로젝트 내부 문서: `/docs/` 디렉토리

## FAQ

**Q: OAuth 로그인이 실패하면 어떻게 하나요?**
A: Supabase 프로젝트 설정에서 OAuth 앱 정보와 리디렉션 URL을 확인하세요.

**Q: 토큰이 자동으로 갱신되지 않나요?**
A: Refresh Token이 유효하고 백엔드 API가 정상적으로 동작하는지 확인하세요.

**Q: 다중 디바이스 로그인을 지원하나요?**
A: 네, Redis 세션 관리로 여러 디바이스에서 동시 로그인이 가능합니다.