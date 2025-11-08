// 인증 관련 React 훅
// Supabase Auth 상태 관리 및 API 호출

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import {
  supabase,
  getCurrentUser,
  getCurrentSession,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithGitHub,
  signInWithDiscord,
  signOut,
  onAuthStateChange,
  getAccessToken,
  getRefreshToken,
  refreshSession,
  resetPassword,
  updatePassword,
  updateUserMetadata,
} from '../lib/supabase'

// 사용자 정보 타입
export interface AuthUser {
  id: string
  email?: string
  user_metadata?: {
    nickname?: string
    avatar_url?: string
  }
}

// 인증 상태 타입
export interface AuthState {
  user: AuthUser | null
  session: any | null
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

/**
 * 인증 훅
 */
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  })

  // 인증 상태 업데이트
  const updateAuthState = useCallback((session: any | null) => {
    setAuthState({
      user: session?.user || null,
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

  // 초기 인증 상태 확인
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // URL에 hash fragment가 있는지 확인 (OAuth 콜백)
        if (window.location.hash && window.location.hash.includes('access_token')) {
          // Supabase가 자동으로 hash를 처리하도록 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 500))

          // hash를 정리해서 URL을 깔끔하게 유지
          window.history.replaceState({}, document.title, window.location.pathname)
        }

        const session = await getCurrentSession()
        updateAuthState(session)
      } catch (error) {
        handleError(error as Error)
      }
    }

    initializeAuth()

    // 인증 상태 변화 리스너 설정
    const { subscription } = onAuthStateChange((event, session) => {
      updateAuthState(session)
    })

    return () => {
      subscription?.unsubscribe()
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

      // 닉네임이 있으면 메타데이터 업데이트
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
  const loginWithGoogle = useCallback(async () => {
    try {
      const data = await signInWithGoogle()
      // Supabase 인증 상태 변경은 onAuthStateChange 리스너에서 자동 처리됨
      return data
    } catch (error) {
      handleError(error as Error)
      throw error
    }
  }, [handleError])

  const loginWithGitHub = useCallback(async () => {
    try {
      const data = await signInWithGitHub()
      return data
    } catch (error) {
      handleError(error as Error)
      throw error
    }
  }, [handleError])

  const loginWithDiscord = useCallback(async () => {
    try {
      const data = await signInWithDiscord()
      return data
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

      // 상태 즉시 업데이트
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
      // 토큰 갱신 실패 시 로그아웃 처리
      logout()
      throw error
    }
  }, [handleError, logout])

  // 현재 사용자 정보 리프레시
  const refreshUser = useCallback(async () => {
    try {
      const session = await getCurrentSession()
      updateAuthState(session)
      return session
    } catch (error) {
      handleError(error as Error)
    }
  }, [updateAuthState, handleError])

  // JWT 토큰 가져오기
  const getAuthToken = useCallback(async () => {
    return await getAccessToken()
  }, [])

  return {
    // 상태
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: !!authState.user,

    // 메소드
    login,
    signup,
    logout,
    loginWithGoogle,
    loginWithGitHub,
    loginWithDiscord,
    updateProfile,
    requestPasswordReset,
    changePassword,
    refreshToken,
    refreshUser,
    getAuthToken,

    // 유틸리티
    clearError: () => setAuthState(prev => ({ ...prev, error: null })),
  }
}