// React 18 + Router 기반 앱 컴포넌트
// 한국어 주석으로 비즈니스 로직 설명

import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import LoginForm from './components/auth/LoginForm'
import OtpVerification from './components/auth/OtpVerification'
import SetPasswordForm from './components/auth/SetPasswordForm'
import { supabase } from './lib/supabase'
import { useAuth } from './hooks/useAuth'

/**
 * 메인 애플리케이션 컴포넌트
 * 라이어 게임의 진입점 역할
 */

// 로그인 페이지
function LoginPage() {
  const handleLoginSuccess = () => {
    // TODO: 로그인 성공 후 메인 페이지로 이동
    console.log('로그인 성공')
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

// Auth 콜백 페이지 - Supabase 리디렉션 처리 (tmp/frontend 방식 참고)
function AuthCallbackPage() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Supabase 콜백 처리 - URL hash에서 세션 정보 추출
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Auth callback 시작:', window.location.href)

        // URL hash 확인
        const hash = window.location.hash
        console.log('🔗 Callback URL hash:', hash)

        if (hash && hash.includes('access_token')) {
          console.log('✅ Hash에서 access_token 발견')

          // Supabase가 hash를 처리하도록 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 500))

          // 세션 확인
          const { getCurrentSession } = require('./lib/supabase')
          const session = await getCurrentSession()

          if (session?.user) {
            console.log('✅ Auth callback 성공:', session.user.email)

            // Google OAuth 로그인 성공 - 바로 홈페이지로 이동
            console.log('🎉 Google 로그인 성공 - 홈페이지로 이동')
            window.location.href = '/'
          } else {
            console.log('⏳ 세션 아직 없음, 추가 대기...')
            // 더 오래 대기 후 다시 확인
            await new Promise(resolve => setTimeout(resolve, 1000))
            const retrySession = await getCurrentSession()

            if (retrySession?.user) {
              console.log('✅ 재시도 성공:', retrySession.user.email)

              // OAuth 로그인 성공 - 바로 홈페이지로 이동
              window.location.href = '/'
            } else {
              console.error('Auth callback 실패: 세션 없음')
              window.location.href = '/'
            }
          }
        } else {
          console.log('❌ Hash에 access_token 없음')
          window.location.href = '/'
        }
      } catch (error) {
        console.error('Auth callback 에러:', error)
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
  const { user, isAuthenticated, logout } = useAuth()

  // 로그인 상태 확인
  useEffect(() => {
    console.log('👤 MainApp - 인증 상태:', isAuthenticated)
    console.log('👤 MainApp - 사용자:', user)
  }, [user, isAuthenticated])

  // 인증되지 않은 경우에만 로그인 페이지 표시
  if (!isAuthenticated) {
    return <LoginPage />
  }

  // 인증된 경우 메인 콘텐츠 표시
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
        maxWidth: '640px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '16px'
        }}>
          라이어 게임
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#6b7280',
          marginBottom: '32px'
        }}>
          환영합니다, {user?.email || '사용자'}님!
        </p>
        <div style={{
          backgroundColor: '#10b981',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          display: 'inline-block',
          marginBottom: '24px'
        }}>
          ✅ 로그인 성공
        </div>
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '32px'
        }}>
          게임 메뉴는 준비 중입니다...
        </p>

        {/* 로그아웃 버튼 */}
        <button
          onClick={async () => {
            try {
              console.log('로그아웃 시도')
              await logout()
              console.log('로그아웃 성공')
            } catch (error) {
              console.error('로그아웃 실패:', error)
            }
          }}
          style={{
            backgroundColor: '#ef4444',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '16px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444'
          }}
        >
          로그아웃
        </button>

        <p style={{
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          로그아웃하면 모든 데이터가 안전하게 처리됩니다.
        </p>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/otp-verification" element={<OtpVerificationPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
      </Routes>
    </Router>
  )
}

export default App