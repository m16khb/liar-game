// React 18 + Router 기반 앱 컴포넌트
// 한국어 주석으로 비즈니스 로직 설명

import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import LoginForm from './components/auth/LoginForm'
import OtpVerification from './components/auth/OtpVerification'
import SetPasswordForm from './components/auth/SetPasswordForm'
import RoomList from './components/game/RoomList'
import GameRoom from './components/game/GameRoom'
import GamePlayPage from './components/game/GamePlayPage'
import ErrorPage from './components/common/ErrorPage'
import LoadingSpinner from './components/common/LoadingSpinner'
import { supabase, getCurrentSession } from './lib/supabase'
import { useAuth, AuthProvider } from './hooks/useAuth'
import { SocketProvider } from './hooks/useSocket'

/**
 * 메인 애플리케이션 컴포넌트
 * 라이어 게임의 진입점 역할
 */

// 로그인 페이지
function LoginPage() {
  const handleLoginSuccess = () => {
    // 저장된 리디렉션 경로 확인
    const redirectPath = sessionStorage.getItem('redirectAfterLogin')
    sessionStorage.removeItem('redirectAfterLogin') // 사용 후 삭제

    console.log('✅ 로그인 성공!')
    console.log('📋 저장된 리디렉션 경로:', redirectPath)

    if (redirectPath && redirectPath !== '/') {
      // 방 생성 또는 참가하려던 경로로 이동
      if (redirectPath.includes('/game/')) {
        window.location.href = redirectPath
      } else if (redirectPath.includes('action=create')) {
        window.location.href = '/rooms'
        // 방 생성은 여기서 바로 처리 (필요하면)
      } else {
        window.location.href = redirectPath
      }
    } else {
      // 기본적으로 마이페이지로 이동 (있는 경우)
      const user = supabase.auth.getUser()
      console.log('🔍 현재 사용자 확인 중...')

      // 비동적으로 사용자 정보 확인
      setTimeout(async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          console.log('✅ 사용자 확인 완료:', user?.email)

          if (user) {
            console.log('👤 마이페이지로 이동')
            window.location.href = '/mypage'
          } else {
            console.log('📋 사용자 없음, rooms로 이동')
            window.location.href = '/rooms'
          }
        } catch (error) {
          console.error('사용자 정보 확인 실패:', error)
          window.location.href = '/rooms'
        }
      }, 100)
    }
  }

  const handleSignupClick = () => {
    // TODO: 회원가입 페이지로 이동
    console.log('회원가입 페이지로 이동')
  }

  const handlePasswordResetClick = () => {
    // TODO: 비밀번호 재설정 페이지로 이동
    console.log('비밀번호 재설정 페이지로 이동')
  }

  return (
    <div className="min-h-screen bg-arcade-black px-4 py-12 flex items-center justify-center relative">
      {/* CRT Scanline Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-10"
           style={{
             background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
           }} />

      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-5"
           style={{
             backgroundImage: 'linear-gradient(#05d9e8 1px, transparent 1px), linear-gradient(90deg, #05d9e8 1px, transparent 1px)',
             backgroundSize: '50px 50px'
           }} />

      <div className="w-full max-w-md relative z-10">
        <header className="text-center mb-8">
          <h1 className="font-pixel text-pixel-xl text-arcade-yellow mb-2"
              style={{ textShadow: '3px 3px 0 #ff2a6d, 6px 6px 0 #05d9e8' }}>
            LIAR GAME
          </h1>
        </header>

        <main>
          <LoginForm
            onLoginSuccess={handleLoginSuccess}
            onSignupClick={handleSignupClick}
            onPasswordResetClick={handlePasswordResetClick}
          />
        </main>
      </div>

      {/* Bottom prompt */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 font-pixel text-[10px] text-arcade-yellow text-center animate-blink">
        INSERT COIN<br />▼ ▼ ▼
      </div>
    </div>
  )
}

// 비밀번호 설정 페이지
function SetPasswordPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || undefined
  const otp = searchParams.get('otp') || undefined
  const fromOtp = otp === 'true' || !!otp

  if (!email) {
    return (
      <ErrorPage message="이메일 인증 링크를 통해서만 접근할 수 있습니다." />
    )
  }

  const handleSuccess = () => {
    // TODO: 비밀번호 설정 성공 후 로그인 페이지로 이동
    window.location.href = '/'
  }

  const handleCancel = () => {
    // 취소 시 로그인 페이지로 이동
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-arcade-black px-4 py-12 flex items-center justify-center relative">
      {/* CRT Scanline Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-10"
           style={{
             background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
           }} />

      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-5"
           style={{
             backgroundImage: 'linear-gradient(#05d9e8 1px, transparent 1px), linear-gradient(90deg, #05d9e8 1px, transparent 1px)',
             backgroundSize: '50px 50px'
           }} />

      <div className="relative z-10 w-full">
        <SetPasswordForm
          email={email}
          token={token}
          fromOtp={fromOtp}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}

// OTP 인증 페이지
function OtpVerificationPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''

  if (!email) {
    return (
      <ErrorPage message="이메일 주소가 필요합니다." />
    )
  }

  const handleOtpVerified = () => {
    // OTP 인증 성공 후 비밀번호 설정 페이지로 이동
    window.location.href = `/set-password?email=${encodeURIComponent(email)}&otp=true`
  }

  const handleCancel = () => {
    window.location.href = '/'
  }

  return (
    <OtpVerification
      email={email}
      onOtpVerified={handleOtpVerified}
      onCancel={handleCancel}
    />
  )
}

// Auth 콜백 페이지 - Supabase 리디렉션 처리
function AuthCallbackPage() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Supabase 콜백 처리
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 [AuthCallback] 시작:', window.location.href)

        // URL에서 에러 확인
        const urlParams = new URLSearchParams(window.location.search)
        const error = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')

        if (error) {
          console.error('❌ [AuthCallback] OAuth 에러:', { error, errorDescription })
          alert(`로그인 실패: ${errorDescription || error}`)
          window.location.href = '/'
          return
        }

        // PKCE flow: code가 query parameter로 옴
        const code = urlParams.get('code')
        if (code) {
          console.log('🔑 [AuthCallback] PKCE code 발견')

          // 먼저 세션이 이미 있는지 확인 (Supabase가 자동으로 처리했을 수 있음)
          const { data: { session: existingSession } } = await supabase.auth.getSession()
          if (existingSession) {
            console.log('✅ [AuthCallback] 세션 이미 존재:', existingSession.user?.email)
            navigateAfterLogin()
            return
          }

          // 세션이 없으면 code로 교환 시도
          console.log('🔄 [AuthCallback] 세션 교환 중...')
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('❌ [AuthCallback] Code 교환 실패:', exchangeError.message)
            // 에러가 발생해도 세션이 설정되었을 수 있으므로 다시 확인
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            if (retrySession) {
              console.log('✅ [AuthCallback] 재확인 - 세션 존재:', retrySession.user?.email)
              navigateAfterLogin()
              return
            }
            alert('로그인 처리에 실패했습니다.')
            window.location.href = '/'
            return
          }

          if (data.session) {
            console.log('✅ [AuthCallback] PKCE 세션 설정 성공:', data.session.user?.email)
            navigateAfterLogin()
            return
          }
        }

        // Implicit flow: hash에 access_token이 옴
        const hash = window.location.hash
        if (hash && hash.includes('access_token')) {
          console.log('🔑 [AuthCallback] Hash 토큰 발견, 세션 설정 중...')

          // Supabase가 hash를 자동으로 처리하도록 대기
          await new Promise(resolve => setTimeout(resolve, 1000))

          // 세션 확인
          const { data: { session } } = await supabase.auth.getSession()

          if (session) {
            console.log('✅ [AuthCallback] Hash 세션 설정 성공:', session.user?.email)
            window.history.replaceState({}, '', window.location.pathname)
            navigateAfterLogin()
            return
          }
        }

        // 세션이 이미 있는지 확인 (다른 탭에서 로그인된 경우)
        const { data: { session: existingSession } } = await supabase.auth.getSession()
        if (existingSession) {
          console.log('✅ [AuthCallback] 기존 세션 발견:', existingSession.user?.email)
          navigateAfterLogin()
          return
        }

        console.log('❌ [AuthCallback] 세션 설정 실패 - 토큰/코드 없음')
        window.location.href = '/'

      } catch (err) {
        console.error('❌ [AuthCallback] 에러:', err)
        alert('로그인 처리 중 오류가 발생했습니다.')
        window.location.href = '/'
      }
    }

    // 로그인 후 리디렉션 처리
    const navigateAfterLogin = () => {
      const redirectPath = sessionStorage.getItem('redirectAfterLogin')
      sessionStorage.removeItem('redirectAfterLogin')

      const target = redirectPath && redirectPath !== '/' ? redirectPath : '/rooms'
      console.log('🎯 [AuthCallback] 이동:', target)
      window.location.href = target
    }

    handleAuthCallback()
  }, [searchParams])

  return <LoadingSpinner message="인증 처리 중..." />
}

// 메인 페이지 컴포넌트 - 로그인 상태에 따라 다르게 표시
function MainApp() {
  // RoomList 내부에서 useAuth()로 인증 상태를 직접 가져옴
  return <RoomList />
}

// 게임방 목록 페이지
function RoomListPage() {
  // MainApp과 동일한 인증 상태 사용
  return <RoomList />
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/" element={<MainApp />} />
            <Route path="/rooms" element={<RoomListPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/otp-verification" element={<OtpVerificationPage />} />
            <Route path="/set-password" element={<SetPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            {/* 게임 방 대기 페이지 */}
            <Route path="/game/:roomCode" element={<GameRoom />} />
            {/* 게임 플레이 페이지 */}
            <Route path="/game/:roomCode/play" element={<GamePlayPage />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App