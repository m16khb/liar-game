// 로그인 폼 컴포넌트
// 이메일 로그인 및 소셜 로그인 UI

import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { sendEmailVerification, supabase } from '../../lib/supabase'
import { saveOTPToStorage, canSendOTP } from '../../utils/otpStorage'
import GoogleLoginButton from './GoogleLoginButton'
import EmailSignupModal from './EmailSignupModal'

interface LoginFormProps {
  onLoginSuccess?: () => void
  onSignupClick?: () => void
  onPasswordResetClick?: () => void
}

export default function LoginForm({
  onLoginSuccess,
  onSignupClick,
  onPasswordResetClick,
}: LoginFormProps) {
  const { login, loading, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [socialError, setSocialError] = useState<string | null>(null)
  const [showEmailSignup, setShowEmailSignup] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // 소셜 로그인 에러 핸들러
  const handleSocialError = (error: Error) => {
    setSocialError(error.message)
    // 5초 후 에러 메시지 자동 제거
    setTimeout(() => setSocialError(null), 5000)
  }

  // 에러 초기화
  const clearAllErrors = () => {
    if (error) clearError()
    if (socialError) setSocialError(null)
  }

  // 이메일 인증 모달 핸들러
  const handleEmailSignupClick = () => {
    setShowEmailSignup(true)
  }

  const handleEmailSignupClose = () => {
    setShowEmailSignup(false)
  }

  // 이메일 OTP 발송 핸들러
  const handleSendOtp = async () => {
    if (!formData.email) {
      setSocialError('이메일 주소를 입력해주세요.')
      return
    }

    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setSocialError('유효한 이메일 주소를 입력해주세요.')
      return
    }

    // OTP 발송 가능 여부 확인
    if (!canSendOTP(formData.email)) {
      setSocialError('이미 인증 메일을 발송했습니다. 이메일을 확인해주세요.')
      return
    }

    setIsSubmitting(true)
    setSocialError(null)

    try {
      await sendEmailVerification(formData.email)
      saveOTPToStorage(formData.email)

      // OTP 인증 페이지로 이동
      navigate(`/otp-verification?email=${encodeURIComponent(formData.email)}`)
    } catch (error: any) {
      setSocialError(error.message || '인증 메일 발송에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmailSignupSuccess = () => {
    // 이메일 인증 성공 후 처리할 로직
    onSignupClick?.()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // 에러 초기화
    clearAllErrors()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    // 기본 유효성 검증
    if (!formData.email || !formData.password) {
      return
    }

    setIsSubmitting(true)
    console.log('🚀 [LoginForm] 로그인 시도:', formData.email)

    try {
      console.log('📤 [LoginForm] login() 호출 전')
      const result = await login({
        email: formData.email,
        password: formData.password,
      })
      console.log('📥 [LoginForm] login() 호출 완료:', result)

      // 세션이 완전히 저장될 때까지 대기 (Race Condition 방지)
      console.log('🔄 [LoginForm] 세션 저장 완료 대기 중...')
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          subscription.unsubscribe()
          console.log('⚠️ 세션 저장 타임아웃, 계속 진행')
          resolve() // 타임아웃 시에도 진행
        }, 3000) // 3초 타임아웃

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'SIGNED_IN') {
            clearTimeout(timeout)
            subscription.unsubscribe()
            console.log('✅ 세션 저장 완료 확인')
            resolve()
          }
        })
      })

      onLoginSuccess?.()
    } catch (error) {
      console.error('로그인 실패:', error)
      // 에러는 useAuth 훅에서 처리됨
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '448px', margin: '0 auto' }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        padding: '32px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: 'center',
          color: '#1f2937',
          marginBottom: '32px'
        }}>
          로그인
        </h2>

        {/* 소셜 로그인 버튼 */}
        <div className="mb-6">
          <GoogleLoginButton
            onSuccess={onLoginSuccess}
            onError={handleSocialError}
            disabled={loading}
            variant="primary"
          />
        </div>

        {/* 구분선 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              또는
            </span>
          </div>
        </div>

        {/* 에러 메시지 */}
        {(error || socialError) && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-600 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">
              {error || socialError}
            </p>
          </div>
        )}

        {/* 이메일 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="•••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading || isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 링크 */}
        <div className="mt-6 text-center text-sm">
          <button
            type="button"
            onClick={onPasswordResetClick}
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            비밀번호를 잊으셨나요?
          </button>
          <span className="mx-2 text-gray-500 dark:text-gray-400">|</span>
          <button
            type="button"
            onClick={handleEmailSignupClick}
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            계정이 없으신가요?
          </button>
        </div>
      </div>

      {/* 이메일 인증 모달 */}
      <EmailSignupModal
        isOpen={showEmailSignup}
        onClose={handleEmailSignupClose}
        onSuccess={handleEmailSignupSuccess}
      />
    </div>
  )
}