// React 18 + Router 기반 앱 컴포넌트
// 한국어 주석으로 비즈니스 로직 설명

import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import LoginForm from './components/auth/LoginForm'
import OtpVerification from './components/auth/OtpVerification'
import SetPasswordForm from './components/auth/SetPasswordForm'
import RoomList from './components/game/RoomList'
import GameRoom from './components/game/GameRoomSimple'
import { supabase, getCurrentSession } from './lib/supabase'
import { useAuth } from './hooks/useAuth'

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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '48px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '448px'
      }}>
        <header style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            라이어 게임
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
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        padding: '48px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '448px',
          textAlign: 'center',
          padding: '32px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>
            잘못된 접근입니다
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            이메일 인증 링크를 통해서만 접근할 수 있습니다.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            로그인 페이지로 가기
          </button>
        </div>
      </div>
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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '48px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <SetPasswordForm
        email={email}
        token={token}
        fromOtp={fromOtp}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}

// OTP 인증 페이지
function OtpVerificationPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''

  if (!email) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        padding: '48px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '448px',
          textAlign: 'center',
          padding: '32px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>
            잘못된 접근입니다
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            이메일 주소가 필요합니다.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            로그인 페이지로 가기
          </button>
        </div>
      </div>
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
    // Supabase 콜백 처리 - Supabase가 자동으로 hash를 처리하도록 함
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Auth callback 시작:', window.location.href)
        console.log('🔍 Search params:', window.location.search)
        console.log('🔗 URL hash:', window.location.hash)
        console.log('📍 Origin:', window.location.origin)
        console.log('📋 Pathname:', window.location.pathname)

        // URL에서 에러 확인
        const urlParams = new URLSearchParams(window.location.search)
        const error = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')

        if (error) {
          console.error('❌ OAuth 에러:', { error, errorDescription })
          console.error('에러 코드:', urlParams.get('error_code'))
          alert(`로그인 실패: ${errorDescription || error}`)
          window.location.href = '/'
          return
        }

        // URL hash 확인 - OAuth 토큰이 있는지
        const hash = window.location.hash
        console.log('🔗 URL hash 길이:', hash.length)
        console.log('🔍 Hash 내 access_token 포함:', hash.includes('access_token'))

        if (hash && hash.includes('access_token')) {
          console.log('✅ OAuth 토큰 발견!')
          console.log('📋 전체 hash:', hash)

          // hash 파싱
          const hashParams = new URLSearchParams(hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          const expiresIn = hashParams.get('expires_in')
          const provider = hashParams.get('provider')

          console.log('🎫 토큰 정보:')
          console.log('  - access_token:', accessToken?.substring(0, 20) + '...')
          console.log('  - refresh_token:', refreshToken?.substring(0, 10) + '...')
          console.log('  - expires_in:', expiresIn)
          console.log('  - provider:', provider)

          // Supabase가 hash를 처리할 시간을 충분히 줌
          console.log('⏳ Supabase 자동 처리 대기 (2초)...')
          await new Promise(resolve => setTimeout(resolve, 2000))

          // 세션이 설정되었는지 확인
          console.log('🔍 세션 확인 중...')
          const session = await getCurrentSession()

          if (session?.user) {
            console.log('✅ OAuth 로그인 성공!')
            console.log('👤 사용자 정보:', {
              id: session.user.id,
              email: session.user.email,
              provider: session.user.app_metadata?.provider,
              created_at: session.user.created_at,
            })

            // URL 정리 (hash 제거)
            console.log('🧹 URL 정리 (hash 제거)')
            window.history.replaceState({}, '', window.location.pathname)

            // 리디렉션 경로 확인
            const redirectPath = sessionStorage.getItem('redirectAfterLogin')
            sessionStorage.removeItem('redirectAfterLogin')

            console.log('🎯 리디렉션 경로:', redirectPath || '/rooms')

            if (redirectPath && redirectPath !== '/') {
              console.log('🎉 OAuth 성공 - 저장된 경로로 이동:', redirectPath)
              window.location.href = redirectPath
            } else {
              console.log('🎉 OAuth 성공 - 방 목록(/rooms)로 이동')
              window.location.href = '/rooms'
            }
          } else {
            console.error('❌ 세션 설정 실패')
            console.log('상세 정보:')
            console.log('  - Hash:', hash)
            console.log('  - URL:', window.location.href)
            console.log('  - Origin:', window.location.origin)
            console.log('  - Pathname:', window.location.pathname)
            alert('로그인 처리에 실패했습니다. 다시 시도해주세요.')
            window.location.href = '/'
          }
        } else {
          console.log('❌ OAuth 토큰 없음')
          console.log('URL 정보:')
          console.log('  - Hash:', hash)
          console.log('  - Search:', window.location.search)
          console.log('  - Origin:', window.location.origin)
          window.location.href = '/'
        }
      } catch (error) {
        console.error('❌ Auth callback 에러:', error)
        console.error('에러 스택트레이스:', error.stack)
        alert('로그인 처리 중 오류가 발생했습니다.')
        window.location.href = '/'
      }
    }

    handleAuthCallback()
  }, [searchParams])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          인증 처리 중...
        </p>
      </div>
    </div>
  )
}

// 메인 페이지 컴포넌트 - 로그인 상태에 따라 다르게 표시
function MainApp() {
  const { isAuthenticated } = useAuth()

  // 모든 사용자에게 게임방 목록 표시 (인증 여부와 무관)
  return <RoomList isAuthenticated={isAuthenticated} />
}

// 게임방 목록 페이지
function RoomListPage() {
  // MainApp과 동일한 인증 상태 사용
  return <RoomList />
}

function App() {
  return (
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
      </Routes>
    </Router>
  )
}

export default App