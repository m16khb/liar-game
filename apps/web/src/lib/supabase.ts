// Supabase 클라이언트 설정
// 프론트엔드에서 Supabase Auth 및 Database 접근

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dayjs from 'dayjs'

// 환경 변수 (Vite는 VITE_ 접두사 사용)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 필수 환경 변수 확인
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다. VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정해주세요.')
}

/**
 * Supabase 클라이언트 인스턴스
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // PKCE flow 사용 (더 안전)
    debug: false, // 디버그 모드 비활성화
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
  // 개발 모드에서는 임시 처리
  if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co') {
    console.log(`개발 모드: 세션 정보 조회 시뮬레이션`)

    // URL 파라미터에서 이메일을 가져와서 임시 세션 생성
    const urlParams = new URLSearchParams(window.location.search)
    const email = urlParams.get('email')

    if (email) {
      return {
        user: { email },
        session: { access_token: 'dev-token' }
      }
    }

    return null
  }

  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('세션 정보 조회 오류:', error)
    return null
  }

  return session
}

/**
 * Google OAuth 로그인 (기본 redirect 사용)
 */
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
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
export const signUpWithEmail = async (email: string, password?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: password || '',
    options: {
      emailRedirectTo: `${window.location.origin}/set-password?email=${encodeURIComponent(email)}`,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * 이메일로 OTP 발송 (Supabase 공식 API)
 * 새 사용자는 자동 생성될 수 있으며, 이메일 인증 상태가 됨
 */
/**
 * 이메일 OTP 발송 (tmp/frontend 방식 - 6자리 코드)
 */
export const sendEmailVerification = async (email: string) => {
  console.log(`이메일 OTP 발송 요청: ${email}`)

  // signUp 메소드로 6자리 코드 발송
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'temp-password', // 임시 비밀번호 (나중에 설정)
    options: {
      emailRedirectTo: `${window.location.origin}/set-password?email=${encodeURIComponent(email)}`,
      data: {
        signup_method: 'otp'
      }
    }
  })

  if (error) {
    console.error(`OTP 발송 실패:`, {
      message: error.message,
      status: error.status,
      code: error.status || 'unknown'
    })

    // 이미 사용자가 있는 경우 signInWithOtp로 OTP 재발송
    if (error.message.includes('User already registered') || error.message.includes('already been registered')) {
      console.log(`기존 사용자에게 OTP 재발송: ${email}`)

      const { data: otpData, error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        }
      })

      if (otpError) {
        throw new Error(`OTP 재발송 실패: ${otpError.message}`)
      }

      console.log(`OTP 재발송 성공: ${email}`)
      return {
        success: true,
        message: '인증 코드를 재발송했습니다. 이메일을 확인해주세요.',
        user: otpData.user
      }
    }

    throw new Error(`인증 메일 발송 실패: ${error.message}`)
  }

  console.log(`OTP 발송 성공: ${email}`)
  console.log(`6자리 인증 코드가 이메일로 발송되었습니다.`)

  return {
    success: true,
    message: '6자리 인증 코드를 발송했습니다. 이메일을 확인해주세요.',
    user: data.user
  }
}

/**
 * OTP 코드 확인
 */
/**
 * OTP 코드 확인 (Supabase 공식 API)
 * type: 'email' - 이메일 인증 확인
 */
/**
 * OTP 코드 확인 (tmp/frontend 방식 - 6자리 코드)
 */
export const verifyOtp = async (email: string, token: string) => {
  console.log(`6자리 OTP 확인 시도: ${email}, token: ${token}`)

  // 기본 유효성 검사 - 6자리 숫자
  if (!token || token.length !== 6 || !/^\d{6}$/.test(token)) {
    throw new Error('6자리 숫자 인증 코드를 입력해주세요.')
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })

    console.log(`OTP verify 결과:`, { data, error })

    if (error) {
      console.error('OTP verify 실패:', error.message)
      throw new Error(error.message)
    }

    if (data.user) {
      console.log(`✅ OTP 인증 성공:`, data.user.email)
      return {
        verified: true,
        email,
        user: data.user,
        session: data.session,
        token,
        message: 'OTP 인증 성공'
      }
    }

    throw new Error('OTP 인증에 실패했습니다.')

  } catch (error) {
    console.error('OTP 인증 에러:', error)
    throw error instanceof Error ? error : new Error('OTP 인증에 실패했습니다.')
  }
}

/**
 * 비밀번호 설정 및 최종 가입 완료 (OTP 확인 후)
 * 사용자가 존재하면 비밀번호만 업데이트, 없으면 생성
 */
export const completeSignUp = async (email: string, password: string, otpToken?: string) => {
  console.log(`비밀번호 설정 및 가입 완료: ${email}`)

  // 먼저 사용자가 존재하는지 확인 (OTP 인증 단계에서 생성되었을 수 있음)
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (user) {
    // 사용자가 이미 존재하면 비밀번호만 업데이트
    console.log(`기존 사용자 비밀번호 업데이트: ${user.email}`)

    const { data, error } = await supabase.auth.updateUser({
      password,
      data: {
        signup_completed: true,
        signup_method: 'otp_password',
        completed_at: dayjs().toISOString()
      }
    })

    if (error) {
      console.error(`비밀번호 업데이트 실패:`, error)
      throw new Error(`비밀번호 설정 실패: ${error.message}`)
    }

    console.log(`비밀번호 업데이트 성공: ${email}`)
    return data

  } else {
    // 사용자가 없으면 새로 생성 (일반적인 회원가입)
    console.log(`새 사용자 생성: ${email}`)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          signup_method: 'otp_password',
          signup_completed: true,
          created_at: dayjs().toISOString()
        }
      }
    })

    if (error) {
      console.error(`회원가입 실패:`, error)
      throw new Error(`회원가입 실패: ${error.message}`)
    }

    if (!data.user) {
      throw new Error('사용자 생성에 실패했습니다.')
    }

    console.log(`회원가입 성공: ${data.user.email}`)
    return data
  }
}

/**
 * OTP 재전송
 */
export const resendOtpEmail = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/set-password?email=${encodeURIComponent(email)}`,
    },
  })

  if (error) {
    throw new Error(`이메일 재전송 실패: ${error.message}`)
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
  // 개발 모드에서는 임시 처리
  if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co') {
    console.log(`개발 모드: 비밀번호 업데이트 시뮬레이션`)

    // 임시로 성공 처리
    return
  }

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
  callback: (event: any, session: any) => void
) => {
  return supabase.auth.onAuthStateChange(callback)
}

/**
 * JWT 토큰 가져오기
 */
export const getAccessToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession()

  // JWT 토큰 디코딩 로그
  if (session?.access_token) {
    try {
      const payload = JSON.parse(atob(session.access_token.split('.')[1]));
      console.log('🔑 JWT 토큰 정보:', {
        sub: payload.sub,  // Supabase User ID (UUID)
        user_id: payload.user_id,  // Backend User ID
        email: payload.email,
        user_tier: payload.user_tier,
        user_role: payload.user_role,
        exp: dayjs(payload.exp * 1000).toLocaleString()
      });
    } catch (error) {
      console.error('토큰 디코딩 실패:', error);
    }
  }

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
