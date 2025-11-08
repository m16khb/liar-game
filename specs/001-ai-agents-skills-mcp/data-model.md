# 데이터 모델 설계

## 개요

메인페이지 히어로 섹션과 Supabase 로그인 기능에 필요한 데이터 모델과 상태 구조를 정의합니다.

## 프론트엔드 상태 모델

### 1. 인증 상태 (Auth State)

```typescript
interface AuthState {
  // 현재 사용자 정보
  user: User | null;

  // 인증 상태
  isAuthenticated: boolean;
  isLoading: boolean;

  // 에러 상태
  error: string | null;

  // 세션 정보
  session: Session | null;
}

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  provider?: 'google' | 'github' | 'discord' | 'email';
  created_at: string;
  updated_at: string;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}
```

### 2. 히어로 섹션 상태 (Hero Section State)

```typescript
interface HeroSectionState {
  // 애니메이션 상태
  isLoaded: boolean;
  animationPhase: 'initial' | 'content' | 'cta' | 'complete';

  // 게임 통계 (서버에서 가져옴)
  gameStats: {
    totalPlayers: number;
    activeGames: number;
    todayGames: number;
  } | null;

  // UI 상태
  showLoginModal: boolean;
  selectedAuthProvider: 'google' | 'github' | 'discord' | 'email' | null;
}
```

### 3. 애플리케이션 전역 상태

```typescript
interface AppState {
  auth: AuthState;
  hero: HeroSectionState;

  // UI 상태
  ui: {
    theme: 'light' | 'dark';
    language: 'ko' | 'en';
    sidebarOpen: boolean;
  };

  // 라우팅 상태
  routing: {
    currentPath: string;
    previousPath: string | null;
    isNavigating: boolean;
  };
}
```

## 컴포넌트 데이터 모델

### 1. 히어로 섹션 컴포넌트

```typescript
interface HeroSectionProps {
  // 컨텐츠 설정
  title: string;
  subtitle: string;
  description: string;

  // CTA 설정
  primaryCTA: {
    text: string;
    action: 'login' | 'signup' | 'play-demo';
    variant: 'primary' | 'secondary';
  };

  secondaryCTA?: {
    text: string;
    action: 'learn-more' | 'watch-demo';
    variant: 'text' | 'outline';
  };

  // 비주얼 요소
  backgroundImage?: string;
  gamePreview?: boolean;

  // 콜백 함수
  onCTAClick?: (action: string) => void;
}

interface GamePreviewProps {
  // 게임 데모 설정
  autoPlay?: boolean;
  showControls?: boolean;
  previewType: 'video' | 'interactive' | 'slideshow';

  // 미디어 소스
  mediaSrc?: string;
  fallbackImage?: string;
}
```

### 2. 인증 컴포넌트

```typescript
interface LoginModalProps {
  // 모달 상태
  isOpen: boolean;
  onClose: () => void;

  // 초기 탭
  defaultTab: 'login' | 'signup';

  // 소셜 로그인 설정
  socialProviders: Array<'google' | 'github' | 'discord'>;
  enableEmailLogin: boolean;

  // 콜백
  onSuccess?: (user: User) => void;
  onError?: (error: string) => void;
}

interface LoginFormProps {
  // 폼 상태
  isLogin: boolean; // true: login, false: signup

  // 밸리데이션
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  loading?: boolean;
  error?: string | null;

  // 소셜 로그인
  onSocialLogin: (provider: string) => Promise<void>;
  socialProviders?: Array<'google' | 'github' | 'discord'>;
}

interface LoginCredentials {
  email: string;
  password: string;
  name?: string; // signup 시에만 필요
}

interface SocialLoginButtonProps {
  provider: 'google' | 'github' | 'discord';
  onClick: () => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}
```

## API 응답 모델

### 1. 게임 통계 API

```typescript
// GET /api/stats/game
interface GameStatsResponse {
  success: boolean;
  data: {
    totalPlayers: number;
    activeGames: number;
    todayGames: number;
    averageGameDuration: number; // 분 단위
    popularDifficulty: 'easy' | 'normal' | 'hard';
  };
  timestamp: string;
}

// 에러 응답
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

### 2. 사용자 프로필 API

```typescript
// GET /api/users/profile
interface UserProfileResponse {
  success: boolean;
  data: {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
    provider: string;
    stats: {
      gamesPlayed: number;
      gamesWon: number;
      winRate: number;
      favoriteDifficulty: string;
    };
    created_at: string;
    last_login: string;
  };
}
```

## 백엔드 데이터 모델 (기존과 연동)

### Supabase Auth 테이블 구조

```sql
-- auth.users (Supabase 기본 제공)
-- auth.sessions (Supabase 기본 제공)

-- 사용자 추가 정보 (확장 테이블)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  preferred_language VARCHAR(10) DEFAULT 'ko',
  timezone VARCHAR(50) DEFAULT 'Asia/Seoul',
  notification_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 게임 통계 캐시 테이블
CREATE TABLE game_stats_cache (
  id SERIAL PRIMARY KEY,
  stat_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'all_time'
  total_players INTEGER DEFAULT 0,
  active_games INTEGER DEFAULT 0,
  completed_games INTEGER DEFAULT 0,
  avg_game_duration INTEGER DEFAULT 0, -- 초 단위
  cache_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_user_profiles_id ON user_profiles(id);
CREATE INDEX idx_game_stats_cache_type ON game_stats_cache(stat_type);
CREATE INDEX idx_game_stats_cache_expires ON game_stats_cache(cache_expires_at);
```

## 상태 전이 정의

### 1. 인증 상태 전이

```typescript
type AuthEvent =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; session: Session } }
  | { type: 'LOGIN_ERROR'; payload: { error: string } }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_SESSION'; payload: { session: Session } }
  | { type: 'CLEAR_ERROR' };

// 초기 상태
const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // 앱 시작 시 세션 확인 중
  error: null,
  session: null,
};

// 상태 전이 로직
const authReducer = (state: AuthState, event: AuthEvent): AuthState => {
  switch (event.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: event.payload.user,
        session: event.payload.session,
        error: null,
      };

    case 'LOGIN_ERROR':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        session: null,
        error: event.payload.error,
      };

    case 'LOGOUT':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        session: null,
        error: null,
      };

    default:
      return state;
  }
};
```

### 2. 히어로 섹션 상태 전이

```typescript
type HeroEvent =
  | { type: 'LOAD_CONTENT'; payload: { stats: GameStats } }
  | { type: 'SHOW_LOGIN_MODAL' }
  | { type: 'HIDE_LOGIN_MODAL' }
  | { type: 'SELECT_PROVIDER'; payload: { provider: string } }
  | { type: 'ANIMATION_PHASE_CHANGE'; payload: { phase: AnimationPhase } };

const initialHeroState: HeroSectionState = {
  isLoaded: false,
  animationPhase: 'initial',
  gameStats: null,
  showLoginModal: false,
  selectedAuthProvider: null,
};
```

## 데이터 유효성 규칙

### 1. 사용자 입력 유효성

```typescript
// 이메일 유효성 검사
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 비밀번호 유효성 검사
const passwordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // 간소화를 위해 선택 사항으로
};

// 이름 유효성 검사
const nameRequirements = {
  minLength: 1,
  maxLength: 50,
  allowedChars: /^[가-힣a-zA-Z\s]+$/, // 한글, 영문, 공백 허용
};

// 유효성 검사 함수
const validateEmail = (email: string): boolean => {
  return emailRegex.test(email);
};

const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < passwordRequirements.minLength) {
    errors.push(`비밀번호는 최소 ${passwordRequirements.minLength}자 이상이어야 합니다`);
  }

  if (password.length > passwordRequirements.maxLength) {
    errors.push(`비밀번호는 최대 ${passwordRequirements.maxLength}자 이하여야 합니다`);
  }

  if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('비밀번호에 대문자가 포함되어야 합니다');
  }

  if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('비밀번호에 소문자가 포함되어야 합니다');
  }

  if (passwordRequirements.requireNumbers && !/\d/.test(password)) {
    errors.push('비밀번호에 숫자가 포함되어야 합니다');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
```

### 2. 컴포넌트 Props 유효성

```typescript
// 히어로 섹션 Props 유효성
const validateHeroSectionProps = (props: HeroSectionProps): ValidationResult => {
  const errors: string[] = [];

  if (!props.title || props.title.trim().length === 0) {
    errors.push('타이틀은 필수 항목입니다');
  }

  if (!props.primaryCTA || !props.primaryCTA.text) {
    errors.push('주요 CTA는 필수 항목입니다');
  }

  if (props.backgroundImage && !isValidUrl(props.backgroundImage)) {
    errors.push('배경 이미지 URL이 유효하지 않습니다');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
```

## 타입 안전성 보장

### 1. 타입 가드

```typescript
// 사용자 타입 가드
const isUser = (obj: any): obj is User => {
  return obj &&
         typeof obj.id === 'string' &&
         typeof obj.email === 'string' &&
         typeof obj.created_at === 'string';
};

// 세션 타입 가드
const isSession = (obj: any): obj is Session => {
  return obj &&
         typeof obj.access_token === 'string' &&
         typeof obj.expires_at === 'number' &&
         isUser(obj.user);
};

// API 응답 타입 가드
const isGameStatsResponse = (obj: any): obj is GameStatsResponse => {
  return obj &&
         obj.success === true &&
         obj.data &&
         typeof obj.data.totalPlayers === 'number' &&
         typeof obj.data.activeGames === 'number';
};
```

### 2. 브랜디드 타입

```typescript
// 브랜디드 타입으로 타입 안전성 강화
type UserId = string & { readonly __brand: 'UserId' };
type SessionToken = string & { readonly __brand: 'SessionToken' };
type EmailAddress = string & { readonly __brand: 'EmailAddress' };

// 생성자 함수
const createUserId = (id: string): UserId => {
  if (!id || id.length === 0) {
    throw new Error('유효하지 않은 사용자 ID입니다');
  }
  return id as UserId;
};

const createEmailAddress = (email: string): EmailAddress => {
  if (!validateEmail(email)) {
    throw new Error('유효하지 않은 이메일 주소입니다');
  }
  return email as EmailAddress;
};
```

## 결론

본 데이터 모델은 다음 원칙을 따라 설계되었습니다:

1. **타입 안전성**: TypeScript의 엄격한 타입 시스템 활용
2. **최소 구현**: YAGNI 원칙에 따른 필수 데이터만 정의
3. **확장성**: 향후 기능 확장을 고려한 유연한 구조
4. **성능**: 불필요한 데이터 중복 방지
5. **일관성**: 프로젝트 전체의 일관된 데이터 형식

이 모델을 기반으로 React 컴포넌트와 상태 관리 로직을 구현할 수 있습니다.