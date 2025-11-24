// 인증 컨텍스트 - 전역 인증 상태 관리
// 앱 전체에서 하나의 인증 상태를 공유

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithGitHub,
  signInWithDiscord,
  signOut,
  getAccessToken,
  refreshSession,
  resetPassword,
  updatePassword,
  updateUserMetadata,
} from '../lib/supabase'

// 사용자 정보 타입
export interface AuthUser {
  id: string
  backendUserId?: number
  email?: string
  created_at?: string
  user_metadata?: {
    nickname?: string
    avatar_url?: string
  }
}

// 인증 상태 타입
export interface AuthState {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  error: string | null
}

// 로그인/가입 요청 타입
export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  nickname?: string
}

export interface UpdateProfileRequest {
  nickname?: string
  avatarUrl?: string
}

// Context 타입
interface AuthContextType extends AuthState {
  isAuthenticated: boolean
  login: (req: LoginRequest) => Promise<any>
  signup: (req: SignupRequest) => Promise<any>
  logout: () => Promise<void>
  loginWithGoogle: () => Promise<any>
  loginWithGitHub: () => Promise<any>
  loginWithDiscord: () => Promise<any>
  updateProfile: (req: UpdateProfileRequest) => Promise<any>
  requestPasswordReset: (email: string) => Promise<void>
  changePassword: (newPassword: string) => Promise<void>
  refreshToken: () => Promise<any>
  refreshUser: () => Promise<any>
  getAuthToken: () => Promise<string | null>
  clearError: () => void
}

// Context 생성
const AuthContext = createContext<AuthContextType | null>(null)

// Provider 컴포넌트
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  })

  // 인증 상태 업데이트
  const updateAuthState = useCallback((session: Session | null) => {
    // Supabase User를 AuthUser로 변환
    let authUser: AuthUser | null = session?.user ? {
      id: session.user.id,
      email: session.user.email,
      created_at: session.user.created_at,
      user_metadata: session.user.user_metadata as AuthUser['user_metadata'],
    } : null

    // JWT 토큰에서 backend user_id 추출
    if (session?.access_token && authUser) {
      try {
        const payload = JSON.parse(atob(session.access_token.split('.')[1]))
        if (payload.user_id) {
          authUser = {
            ...authUser,
            backendUserId: payload.user_id,
          }
          console.log('🔑 Backend User ID 설정:', payload.user_id)
        }
      } catch (error) {
        console.error('토큰 디코딩 실패:', error)
      }
    }

    setAuthState({
      user: authUser,
      session,
      loading: false,
      error: null,
    })
  }, [])

  // 에러 처리
  const handleError = useCallback((error: Error) => {
    setAuthState(prev => ({
      ...prev,
      loading: false,
      error: error.message,
    }))
  }, [])

  // 초기화 및 리스너 설정 (한 번만 실행)
  useEffect(() => {
    let mounted = true

    console.log('🔍 [AuthProvider] 초기화 시작 (전역 싱글톤)')

    // 1. 인증 상태 변화 리스너 설정 (Supabase 공식 권장 패턴)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      console.log('🔄 [AuthProvider] 인증 상태 변경:', { event, user: session?.user?.email })

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        updateAuthState(session)
      }
    })

    // 2. 현재 세션 확인
    const initializeAuth = async () => {
      try {
        if (window.location.hash && window.location.hash.includes('access_token')) {
          console.log('🔗 [AuthProvider] OAuth 콜백 감지')
          await new Promise(resolve => setTimeout(resolve, 1000))
          window.history.replaceState({}, document.title, window.location.pathname)
        }

        const { data: { session }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error('❌ [AuthProvider] 세션 확인 오류:', error)
          handleError(error)
        } else {
          console.log('✅ [AuthProvider] 세션 확인 결과:', session?.user?.email || '없음')
          updateAuthState(session)
        }
      } catch (error) {
        if (!mounted) return
        console.error('❌ [AuthProvider] 초기화 오류:', error)
        handleError(error as Error)
      }
    }

    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
      console.log('🧹 [AuthProvider] 리스너 해제')
    }
  }, [updateAuthState, handleError])

  // 이메일 로그인
  const login = useCallback(async ({ email, password }: LoginRequest) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const data = await signInWithEmail(email, password)
      return data
    } catch (error) {
      handleError(error as Error)
      throw error
    }
  }, [handleError])

  // 이메일 회원가입
  const signup = useCallback(async ({ email, password, nickname }: SignupRequest) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const data = await signUpWithEmail(email, password)

      if (nickname && data.user) {
        await updateUserMetadata({ nickname })
      }

      return data
    } catch (error) {
      handleError(error as Error)
      throw error
    }
  }, [handleError])

  // 소셜 로그인
  const loginWithGoogleFn = useCallback(async () => {
    try {
      return await signInWithGoogle()
    } catch (error) {
      handleError(error as Error)
      throw error
    }
  }, [handleError])

  const loginWithGitHubFn = useCallback(async () => {
    try {
      return await signInWithGitHub()
    } catch (error) {
      handleError(error as Error)
      throw error
    }
  }, [handleError])

  const loginWithDiscordFn = useCallback(async () => {
    try {
      return await signInWithDiscord()
    } catch (error) {
      handleError(error as Error)
      throw error
    }
  }, [handleError])

  // 로그아웃
  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true }))

    try {
      await signOut()
      updateAuthState(null)
    } catch (error) {
      handleError(error as Error)
    }
  }, [updateAuthState, handleError])

  // 프로필 업데이트
  const updateProfile = useCallback(async ({ nickname, avatarUrl }: UpdateProfileRequest) => {
    setAuthState(prev => ({ ...prev, loading: true }))

    try {
      const metadata: Record<string, any> = {}
      if (nickname) metadata.nickname = nickname
      if (avatarUrl) metadata.avatar_url = avatarUrl

      const data = await updateUserMetadata(metadata)

      if (authState.user) {
        setAuthState(prev => ({
          ...prev,
          user: {
            ...prev.user!,
            user_metadata: {
              ...prev.user!.user_metadata,
              ...metadata,
            },
          },
          loading: false,
        }))
      }

      return data
    } catch (error) {
      handleError(error as Error)
      throw error
    }
  }, [authState.user, handleError])

  // 비밀번호 재설정
  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      await resetPassword(email)
    } catch (error) {
      handleError(error as Error)
      throw error
    }
  }, [handleError])

  // 비밀번호 업데이트
  const changePassword = useCallback(async (newPassword: string) => {
    try {
      await updatePassword(newPassword)
    } catch (error) {
      handleError(error as Error)
      throw error
    }
  }, [handleError])

  // 토큰 갱신
  const refreshToken = useCallback(async () => {
    try {
      const data = await refreshSession()
      return data
    } catch (error) {
      handleError(error as Error)
      logout()
      throw error
    }
  }, [handleError, logout])

  // 현재 사용자 정보 리프레시
  const refreshUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      updateAuthState(session)
      return session
    } catch (error) {
      handleError(error as Error)
    }
  }, [updateAuthState, handleError])

  // JWT 토큰 가져오기
  const getAuthTokenFn = useCallback(async () => {
    return await getAccessToken()
  }, [])

  // React Compiler가 자동 메모이제이션하므로 수동 useMemo 불필요
  const value: AuthContextType = {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: !!authState.user,
    login,
    signup,
    logout,
    loginWithGoogle: loginWithGoogleFn,
    loginWithGitHub: loginWithGitHubFn,
    loginWithDiscord: loginWithDiscordFn,
    updateProfile,
    requestPasswordReset,
    changePassword,
    refreshToken,
    refreshUser,
    getAuthToken: getAuthTokenFn,
    clearError: () => setAuthState(prev => ({ ...prev, error: null })),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// useAuth 훅 - Context에서 인증 상태 가져오기
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
