// Supabase 클라이언트 설정
// 프론트엔드에서 Supabase Auth 및 Database 접근

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 환경 변수 (Vite는 VITE_ 접두사 사용)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const siteUrl = import.meta.env.VITE_SITE_URL

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
  },
  // 추가 디버깅 옵션
  global: {
    headers: {
      'X-Client-Info': 'liar-game-web',
    },
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
 * Google OAuth 로그인
 */
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    throw new Error(`Google 로그인 실패: ${error.message}`)
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
    throw new Error(`GitHub 로그인 실패: ${error.message}`)
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
    throw new Error(`Discord 로그인 실패: ${error.message}`)
  }

  return data
}


/**
 * 이메일로 로그인
 */
export const signInWithEmail = async (email: string, password: string) => {
  console.log(`🔑 이메일 로그인 시도: ${email}`)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error(`❌ 로그인 실패:`, {
      message: error.message,
      status: error.status,
      email: email
    })

    // 이메일 인증이 필요한 경우
    if (error.message.includes('Email not confirmed') || error.message.includes('email_confirm')) {
      console.log(`📧 이메일 인증 필요: ${email}`)

      // 인증 이메일 재전송
      try {
        await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/set-password?email=${encodeURIComponent(email)}`
          }
        })
        console.log(`✅ 인증 이메일 재전송 완료`)
        throw new Error(`이메일 인증이 필요합니다. 받은 메일함에서 인증 링크를 클릭해주세요.`)
      } catch (resendError) {
        console.error(`인증 이메일 재전송 실패:`, resendError)
        throw new Error(`이메일 인증이 필요합니다. 인증 메일을 다시 요청해주세요.`)
      }
    }

    // 사용자가 없는 경우
    if (error.message.includes('Invalid login credentials')) {
      console.log(`❌ 사용자 정보 없음 또는 비밀번호 틀림`)
      throw new Error(`이메일 또는 비밀번호가 올바르지 않습니다.`)
    }

    throw new Error(error.message)
  }

  console.log(`✅ 로그인 성공: ${email}`)
  return data
}

/**
 * 이메일로 회원가입
 */
export const signUpWithEmail = async (email: string, password?: string) => {
  console.log(`📝 이메일 회원가입 시도: ${email}`)

  const { data, error } = await supabase.auth.signUp({
    email,
    password: password || '',
    options: {
      emailRedirectTo: `${window.location.origin}/set-password?email=${encodeURIComponent(email)}`,
    },
  })

  if (error) {
    console.error(`❌ 회원가입 실패:`, {
      message: error.message,
      status: error.status,
      email: email
    })

    // 이미 사용자가 있는 경우
    if (error.message.includes('User already registered') || error.message.includes('already been registered')) {
      console.log(`🔄 사용자 이미 존재`)
      throw new Error(`이미 가입된 이메일입니다. 로그인을 시도해주세요.`)
    }

    throw new Error(error.message)
  }

  console.log(`✅ 회원가입 성공:`, {
    email: email,
    user: data.user?.email,
    session: !!data.session,
    confirmationEmailSent: !data.session
  })

  // 세션이 바로 생성된 경우 (이메일 확인이 필요 없는 설정)
  if (data.session) {
    console.log(`✅ 즉시 로그인 성공`)
    return data
  }

  // 이메일 확인 필요
  console.log(`📧 이메일 확인 필요: ${email}`)
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

  // 6자리 OTP 코드 발송
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    }
  })

  if (error) {
    console.error(`OTP 발송 실패:`, {
      message: error.message,
      status: error.status,
      code: error.status || 'unknown'
    })

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
      type: 'signup'
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

  // 현재 세션에 사용자가 있는지 확인
  let existingUser = user

  if (!existingUser) {
    // 세션에 없으면 이메일로 사용자 찾기 시도
    try {
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email,
        password: 'temp-password-to-check-existence', // 임시 비밀번호로 확인
      })
      existingUser = signInData.user
    } catch (e) {
      // 사용자가 없는 것이 정상
      existingUser = null
    }
  }

  if (existingUser) {
    // 사용자가 이미 존재하면 비밀번호만 업데이트
    console.log(`기존 사용자 비밀번호 업데이트: ${existingUser.email}`)

    const { data, error } = await supabase.auth.updateUser({
      password,
      data: {
        signup_completed: true,
        signup_method: 'otp_password',
        completed_at: new Date().toISOString()
      }
    })

    if (error) {
      console.error(`비밀번호 업데이트 실패:`, error)
      throw new Error(`비밀번호 설정 실패: ${error.message}`)
    }

    console.log(`비밀번호 업데이트 성공: ${email}`)
    return { user: existingUser, session: data.session }

  } else {
    // 사용자가 없으면 새로 생성 (일반적인 회원가입)
    console.log(`새 사용자 생성: ${email}`)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailConfirm: true, // 이메일 확인 건너뛰기 (OTP로 이미 확인)
        data: {
          signup_method: 'otp_password',
          signup_completed: true,
          created_at: new Date().toISOString()
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
  // 임시 비밀번호 생성
  const tempPassword = generateTempPassword()

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/set-password?email=${encodeURIComponent(email)}`,
    },
  })

  if (error) {
    throw new Error(`이메일 재전송 실패: ${error.message}`)
  }

  return data
}

/**
 * 임시 비밀번호 생성
 */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
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