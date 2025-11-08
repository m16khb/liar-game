# 메인페이지 히어로 섹션 및 Supabase 로그인 구현 가이드

## 개요

본 가이드는 라이어 게임 프로젝트에 메인페이지 히어로 섹션과 Supabase 기반 로그인 기능을 구현하는 단계별 안내서입니다.

## 전제 조건

- Node.js 25.1.0+
- pnpm 10.x
- Turborepo 환경
- Docker 및 Docker Compose
- Supabase 프로젝트 설정 완료

## 1단계: 개발 환경 설정

### 1.1 인프라 시작
```bash
# 백엔드 인프라 (PostgreSQL, Redis, Nginx, MinIO) 시작
docker compose up -d

# 데이터베이스 마이그레이션 실행
cd apps/api && pnpm migration:run
```

### 1.2 환경 변수 확인
```bash
# .env 파일에서 Supabase 설정 확인
cat .env | grep SUPABASE
```

필요한 환경 변수가 모두 설정되어 있는지 확인:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `SUPABASE_WEBHOOK_SECRET`

### 1.3 개발 서버 시작
```bash
# 전체 개발 서버 실행
pnpm turbo dev

# 개별 웹 서버 실행 (필요시)
pnpm --filter @liar-game/web dev
```

## 2단계: 의존성 설치

### 2.1 필수 패키지 설치
```bash
# 스타일링 및 라우팅 패키지
pnpm --filter @liar-game/web add \
  styled-components \
  @types/styled-components \
  react-router-dom \
  @types/react-router-dom

# 애니메이션 라이브러리 (선택사항)
pnpm --filter @liar-game/web add framer-motion
```

### 2.2 설치 확인
```bash
# package.json에 의존성 추가 확인
cat apps/web/package.json | grep -E "(styled-components|react-router-dom)"
```

## 3단계: 기본 라우팅 구조 설정

### 3.1 App.tsx 라우팅 설정
```typescript
// apps/web/src/App.tsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import AuthCallbackPage from './pages/AuthCallbackPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 공개 페이지 */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* 보호된 페이지 */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
```

### 3.2 라우팅 파일 생성
```bash
# 페이지 디렉토리 생성
mkdir -p apps/web/src/pages

# 기본 페이지 파일 생성
touch apps/web/src/pages/HomePage.tsx
touch apps/web/src/pages/LoginPage.tsx
touch apps/web/src/pages/AuthCallbackPage.tsx
touch apps/web/src/pages/DashboardPage.tsx
```

## 4단계: 인증 컨텍스트 구현

### 4.1 AuthContext 생성
```typescript
// apps/web/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { supabase, getCurrentUser, onAuthStateChange } from '../lib/supabase'
import { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  session: Session | null
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; session: Session } }
  | { type: 'LOGIN_ERROR'; payload: { error: string } }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  session: null,
}

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        session: action.payload.session,
        error: null,
      }
    case 'LOGIN_ERROR':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        session: null,
        error: action.payload.error,
      }
    case 'LOGOUT':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        session: null,
        error: null,
      }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

interface AuthContextType {
  state: AuthState
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name?: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  loginWithGitHub: () => Promise<void>
  loginWithDiscord: () => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // 초기 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: session.user, session }
          })
        } else {
          dispatch({ type: 'LOGIN_ERROR', payload: { error: '세션을 찾을 수 없습니다' } })
        }
      } catch (error) {
        dispatch({ type: 'LOGIN_ERROR', payload: { error: '인증 확인 실패' } })
      }
    }

    checkAuth()

    // 인증 상태 변화 감지
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (session) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: session.user, session }
        })
      } else {
        dispatch({ type: 'LOGOUT' })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: data.user!, session: data.session! }
      })
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: { error: error.message } })
    }
  }

  const signup = async (email: string, password: string, name?: string) => {
    dispatch({ type: 'LOGIN_START' })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } }
      })
      if (error) throw error

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: data.user!, session: data.session! }
      })
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: { error: error.message } })
    }
  }

  const loginWithGoogle = async () => {
    dispatch({ type: 'LOGIN_START' })
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: { error: error.message } })
    }
  }

  const loginWithGitHub = async () => {
    dispatch({ type: 'LOGIN_START' })
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: { error: error.message } })
    }
  }

  const loginWithDiscord = async () => {
    dispatch({ type: 'LOGIN_START' })
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: { error: error.message } })
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      dispatch({ type: 'LOGOUT' })
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: { error: error.message } })
    }
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  return (
    <AuthContext.Provider value={{
      state,
      login,
      signup,
      loginWithGoogle,
      loginWithGitHub,
      loginWithDiscord,
      logout,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

## 5단계: 히어로 섹션 컴포넌트 구현

### 5.1 히어로 섹션 컴포넌트
```typescript
// apps/web/src/components/hero/HeroSection.tsx
import React from 'react'
import styled from 'styled-components'
import { useAuth } from '../../contexts/AuthContext'
import { CTAButton } from './CTAButton'
import { GamePreview } from './GamePreview'

const HeroContainer = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
`

const HeroContent = styled.div`
  max-width: 800px;
  z-index: 2;
  animation: fadeInUp 1s ease-out;
`

const HeroTitle = styled.h1`
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.1;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`

const HeroSubtitle = styled.p`
  font-size: clamp(1.2rem, 3vw, 1.8rem);
  margin-bottom: 2rem;
  opacity: 0.95;
  line-height: 1.5;
`

const HeroDescription = styled.p`
  font-size: 1.1rem;
  margin-bottom: 3rem;
  opacity: 0.9;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 4rem;
`

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
  max-width: 600px;
`

const StatItem = styled.div`
  text-align: center;
`

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
`

const StatLabel = styled.div`
  font-size: 1rem;
  opacity: 0.9;
`

interface GameStats {
  totalPlayers: number
  activeGames: number
  todayGames: number
}

interface HeroSectionProps {
  gameStats?: GameStats
}

export const HeroSection: React.FC<HeroSectionProps> = ({ gameStats }) => {
  const { state: authState, loginWithGoogle } = useAuth()

  const handleLoginClick = () => {
    loginWithGoogle()
  }

  const handlePlayDemo = () => {
    // 데모 게임 시작 로직
    console.log('데모 게임 시작')
  }

  return (
    <HeroContainer>
      <HeroContent>
        <HeroTitle>라이어 게임</HeroTitle>
        <HeroSubtitle>6인 추리 게임의 새로운 차원</HeroSubtitle>
        <HeroDescription>
          친구들과 함께 즐기는 실시간 추리 게임!
          당신의 직관력과 논리력을 시험해보세요.
        </HeroDescription>

        <ButtonContainer>
          {!authState.isAuthenticated ? (
            <CTAButton
              variant="primary"
              size="large"
              onClick={handleLoginClick}
              loading={authState.isLoading}
            >
              지금 시작하기
            </CTAButton>
          ) : (
            <CTAButton
              variant="primary"
              size="large"
              onClick={() => window.location.href = '/dashboard'}
            >
              대시보드
            </CTAButton>
          )}

          <CTAButton
            variant="secondary"
            size="large"
            onClick={handlePlayDemo}
          >
            데모 플레이
          </CTAButton>
        </ButtonContainer>

        {gameStats && (
          <StatsContainer>
            <StatItem>
              <StatNumber>{gameStats.totalPlayers.toLocaleString()}+</StatNumber>
              <StatLabel>플레이어</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{gameStats.activeGames}</StatNumber>
              <StatLabel>진행 중인 게임</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>{gameStats.todayGames.toLocaleString()}</StatNumber>
              <StatLabel>오늘의 게임</StatLabel>
            </StatItem>
          </StatsContainer>
        )}
      </HeroContent>

      <GamePreview />
    </HeroContainer>
  )
}
```

### 5.2 CTA 버튼 컴포넌트
```typescript
// apps/web/src/components/hero/CTAButton.tsx
import React from 'react'
import styled, { css } from 'styled-components'

interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline'
  size: 'small' | 'medium' | 'large'
  loading?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}

const Button = styled.button<ButtonProps>`
  padding: ${props => {
    switch (props.size) {
      case 'small': return '0.5rem 1rem'
      case 'medium': return '0.75rem 1.5rem'
      case 'large': return '1rem 2rem'
      default: return '0.75rem 1.5rem'
    }
  }};

  font-size: ${props => {
    switch (props.size) {
      case 'small': return '0.875rem'
      case 'medium': return '1rem'
      case 'large': return '1.125rem'
      default: return '1rem'
    }
  }};

  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return css`
          background: white;
          color: #667eea;
          &:hover:not(:disabled) {
            background: #f8f9fa;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
        `
      case 'secondary':
        return css`
          background: transparent;
          color: white;
          border: 2px solid white;
          &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
          }
        `
      case 'outline':
        return css`
          background: transparent;
          color: #667eea;
          border: 2px solid #667eea;
          &:hover:not(:disabled) {
            background: rgba(102, 126, 234, 0.1);
          }
        `
      default:
        return css`
          background: white;
          color: #667eea;
        `
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  ${props => props.loading && css`
    pointer-events: none;
    opacity: 0.8;
  `}
`

export const CTAButton: React.FC<ButtonProps> = ({
  variant,
  size,
  loading = false,
  disabled = false,
  onClick,
  children
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      loading={loading}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? '처리 중...' : children}
    </Button>
  )
}
```

## 6단계: 페이지 구현

### 6.1 메인 페이지
```typescript
// apps/web/src/pages/HomePage.tsx
import React, { useEffect, useState } from 'react'
import { HeroSection } from '../components/hero/HeroSection'
import { supabase } from '../lib/supabase'

interface GameStats {
  totalPlayers: number
  activeGames: number
  todayGames: number
}

export const HomePage: React.FC = () => {
  const [gameStats, setGameStats] = useState<GameStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGameStats = async () => {
      try {
        // 실제로는 API 호출
        // const response = await fetch('/api/stats/game')
        // const data = await response.json()

        // 임시 데이터
        const mockStats: GameStats = {
          totalPlayers: 15420,
          activeGames: 48,
          todayGames: 1256
        }

        setGameStats(mockStats)
      } catch (error) {
        console.error('게임 통계 조회 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGameStats()
  }, [])

  if (loading) {
    return <div>로딩 중...</div>
  }

  return (
    <div>
      <HeroSection gameStats={gameStats || undefined} />
    </div>
  )
}
```

### 6.2 인증 콜백 페이지
```typescript
// apps/web/src/pages/AuthCallbackPage.tsx
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('인증 콜백 처리 실패:', error)
          navigate('/login?error=auth_failed')
          return
        }

        if (data.session) {
          navigate('/dashboard')
        } else {
          navigate('/login')
        }
      } catch (error) {
        console.error('인증 콜백 처리 중 오류:', error)
        navigate('/login?error=callback_error')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column'
    }}>
      <div>로그인 처리 중...</div>
      <div style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.7 }}>
        잠시만 기다려주세요
      </div>
    </div>
  )
}
```

## 7단계: 스타일링 및 애니메이션

### 7.1 전역 스타일 업데이트
```css
/* apps/web/src/index.css */
/* 기존 스타일에 추가 */

/* 애니메이션 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .App {
    padding: 1rem;
  }

  h1 {
    font-size: 2rem;
  }

  p {
    font-size: 1rem;
  }
}

/* 스크롤바 스타일링 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
```

## 8단계: 테스트

### 8.1 기능 테스트
```bash
# 개발 서버 실행
pnpm turbo dev

# 브라우저에서 http://localhost:3000 접속
```

### 8.2 테스트 체크리스트
- [ ] 히어로 섹션이 올바르게 렌더링되는가?
- [ ] 로그인 버튼 클릭 시 OAuth 로그인창이 열리는가?
- [ ] 로그인 후 대시보드로 리디렉션되는가?
- [ ] 게임 통계가 표시되는가?
- [ ] 반응형 디자인이 모바일에서 잘 동작하는가?
- [ ] 애니메이션이 부드럽게 동작하는가?

## 9단계: 배포 준비

### 9.1 빌드 테스트
```bash
# 프로덕션 빌드
pnpm turbo build

# 빌드된 파일 확인
ls -la apps/web/dist/
```

### 9.2 타입 검사
```bash
# TypeScript 타입 검사
pnpm turbo type-check
```

### 9.3 린트 검사
```bash
# 코드 품질 검사
pnpm turbo lint
```

## 문제 해결

### 일반적인 문제
1. **Supabase 연결 오류**: 환경 변수 설정 확인
2. **CORS 오류**: Supabase 프로젝트 설정에서 localhost:3000 추가
3. **라우팅 오류**: react-router-dom 버전 호환성 확인
4. **스타일링 오류**: styled-components 타입 정의 확인

### 디버깅 팁
- 브라우저 개발자 도구의 콘솔 확인
- Supabase 대시보드에서 인증 로그 확인
- 네트워크 탭에서 API 요청/응답 확인

## 다음 단계

1. **게임 통계 API 구현**: 백엔드 API 연동
2. **사용자 프로필 기능**: 프로필 페이지 구현
3. **게임 대기실**: 실제 게임 기능 연동
4. **알림 시스템**: 푸시 알림 구현
5. **성능 최적화**: 코드 분할 및 캐싱

---

이 가이드를 통해 라이어 게임의 핵심 프론트엔드 기능을 성공적으로 구현할 수 있습니다. 각 단계를 철저히 따르고 필요시 프로젝트의 특성에 맞게 조정하세요.