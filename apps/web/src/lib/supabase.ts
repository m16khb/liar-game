// 클라이언트 측 Supabase 설정
// React 18 애플리케이션과 Supabase 연동

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/**
 * 현재 사용자 정보 가져오기
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    throw new Error('사용자 정보를 가져올 수 없습니다')
  }

  return user
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
 * 이메일 로그인
 */
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error('이메일 로그인에 실패했습니다')
  }

  return data
}

/**
 * 이메일 회원가입
 */
export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    throw new Error('회원가입에 실패했습니다')
  }

  return data
}

/**
 * 로그아웃
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error('로그아웃에 실패했습니다')
  }
}

/**
 * 인증 상태 변화 감지
 */
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}