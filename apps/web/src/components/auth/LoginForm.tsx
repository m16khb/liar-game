// 로그인 폼 컴포넌트 - Retro Arcade Theme
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
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // 소셜 로그인 에러 핸들러
  const handleSocialError = (error: Error) => {
    setSocialError(error.message)
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setSocialError('유효한 이메일 주소를 입력해주세요.')
      return
    }

    if (!canSendOTP(formData.email)) {
      setSocialError('이미 인증 메일을 발송했습니다. 이메일을 확인해주세요.')
      return
    }

    setIsSubmitting(true)
    setSocialError(null)

    try {
      await sendEmailVerification(formData.email)
      saveOTPToStorage(formData.email)
      navigate(`/otp-verification?email=${encodeURIComponent(formData.email)}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : '인증 메일 발송에 실패했습니다.'
      setSocialError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmailSignupSuccess = () => {
    onSignupClick?.()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    clearAllErrors()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

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

      console.log('🔄 [LoginForm] 세션 저장 완료 대기 중...')
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          subscription.unsubscribe()
          console.log('⚠️ 세션 저장 타임아웃, 계속 진행')
          resolve()
        }, 3000)

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
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-arcade-dark border-4 border-arcade-cyan p-8 relative shadow-[0_0_60px_rgba(5,217,232,0.4)]">
        {/* 장식 */}
        <span className="absolute -top-3 left-5 text-xl text-arcade-yellow">◆</span>
        <span className="absolute -top-3 right-5 text-xl text-arcade-yellow">◆</span>

        {/* 타이틀 */}
        <h2 className="font-pixel text-pixel-xl text-arcade-yellow text-center mb-8"
            style={{ textShadow: '3px 3px 0 #ff2a6d, 6px 6px 0 #05d9e8' }}>
          LOGIN
        </h2>

        {/* 소셜 로그인 */}
        <div className="mb-6">
          <GoogleLoginButton
            onSuccess={onLoginSuccess}
            onError={handleSocialError}
            disabled={loading}
            variant="primary"
          />
        </div>

        {/* 구분선 */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-dashed border-arcade-cyan" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-arcade-dark font-pixel text-pixel-xs text-arcade-cyan">
              OR
            </span>
          </div>
        </div>

        {/* 에러 메시지 */}
        {(error || socialError) && (
          <div className="mb-4 p-3 bg-arcade-dark border-3 border-arcade-pink">
            <p className="font-retro text-retro-base text-arcade-pink">
              ⚠️ {error || socialError}
            </p>
          </div>
        )}

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 이메일 */}
          <div>
            <label htmlFor="email" className="block font-pixel text-pixel-xs text-arcade-cyan uppercase mb-2">
              EMAIL
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
              className="w-full font-retro text-retro-base bg-arcade-black text-white border-3 border-arcade-cyan px-4 py-3 focus:border-arcade-yellow focus:shadow-neon-yellow transition-all placeholder:text-arcade-cyan/50 disabled:opacity-50"
              placeholder="YOUR@EMAIL.COM"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label htmlFor="password" className="block font-pixel text-pixel-xs text-arcade-cyan uppercase mb-2">
              PASSWORD
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
              className="w-full font-retro text-retro-base bg-arcade-black text-white border-3 border-arcade-cyan px-4 py-3 focus:border-arcade-yellow focus:shadow-neon-yellow transition-all placeholder:text-arcade-cyan/50 disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading || isSubmitting}
            className={`w-full font-pixel text-pixel-sm py-4 border-4 border-white transition-all ${
              loading || isSubmitting
                ? 'bg-arcade-dark text-arcade-cyan/50 cursor-not-allowed'
                : 'bg-arcade-green text-arcade-black hover:translate-y-[-2px] hover:shadow-[0_6px_30px_rgba(0,255,65,0.5)] cursor-pointer'
            }`}
          >
            {loading || isSubmitting ? 'LOGGING IN...' : 'LOGIN ▶'}
          </button>
        </form>

        {/* 링크 */}
        <div className="mt-6 text-center font-retro text-retro-base">
          <button
            type="button"
            onClick={onPasswordResetClick}
            className="text-arcade-cyan hover:text-arcade-yellow transition-colors"
          >
            FORGOT PASSWORD?
          </button>
          <span className="mx-3 text-arcade-cyan/50">|</span>
          <button
            type="button"
            onClick={handleEmailSignupClick}
            className="text-arcade-cyan hover:text-arcade-yellow transition-colors"
          >
            CREATE ACCOUNT
          </button>
        </div>

        {/* 하단 메시지 */}
        <p className="font-pixel text-[8px] text-arcade-cyan/30 text-center mt-6">
          INSERT COIN TO CONTINUE
        </p>
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
