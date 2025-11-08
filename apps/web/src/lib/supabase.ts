// Supabase 클라이언트 설정
// 프론트엔드에서 Supabase Auth 및 Database 접근

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 환경 변수 (Vite는 VITE_ 접두사 사용)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다')
}

/**
 * Supabase 클라이언트 인스턴스
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/**
 * 현재 인증된 사용자 정보 가져오기
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('사용자 정보 조회 오류:', error)
    return null
  }

  return user
}

/**
 * 현재 세션 정보 가져오기
 */
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('세션 정보 조회 오류:', error)
    return null
  }

  return session
}

/**
 * Google OAuth 로그인
 */
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw new Error('Google 로그인에 실패했습니다')
  }

  return data
}

/**
 * GitHub OAuth 로그인
 */
export const signInWithGitHub = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw new Error('GitHub 로그인에 실패했습니다')
  }

  return data
}

/**
 * Discord OAuth 로그인
 */
export const signInWithDiscord = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw new Error('Discord 로그인에 실패했습니다')
  }

  return data
}

/**
 * 이메일로 로그인
 */
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * 이메일로 회원가입
 */
export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * 로그아웃
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * 비밀번호 재설정 이메일 발송
 */
export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * 비밀번호 업데이트
 */
export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * 사용자 프로필 업데이트 (메타데이터)
 */
export const updateUserMetadata = async (metadata: Record<string, any>) => {
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * 인증 상태 변경 리스너
 */
export const onAuthStateChange = (
  callback: (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED', session: any) => void
) => {
  return supabase.auth.onAuthStateChange(callback)
}

/**
 * JWT 토큰 가져오기
 */
export const getAccessToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

/**
 * 리프레시 토큰 가져오기
 */
export const getRefreshToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.refresh_token || null
}

/**
 * 토큰 갱신
 */
export const refreshSession = async () => {
  const { data, error } = await supabase.auth.refreshSession()

  if (error) {
    throw new Error(error.message)
  }

  return data
}