// 비밀번호 설정 폼 컴포넌트 - Retro Arcade Theme
// 이메일 인증 후 비밀번호 설정

import { useState, useEffect } from 'react'
import { updatePassword, getCurrentSession } from '../../lib/supabase'

interface SetPasswordFormProps {
  email: string
  token?: string
  fromOtp?: boolean
  onSuccess: () => void
  onCancel: () => void
}

export default function SetPasswordForm({
  email,
  token,
  fromOtp,
  onSuccess,
  onCancel
}: SetPasswordFormProps) {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // 페이지 로드 시 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const otpToken = urlParams.get('otp')

        if (otpToken && fromOtp) {
          console.log('URL에서 OTP 토큰 확인:', otpToken)
          setIsAuthenticated(true)
          return
        }

        const session = await getCurrentSession()
        if (session && session.user?.email === email) {
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('인증 상태 확인 실패:', error)
        setError('인증 링크가 유효하지 않습니다. 다시 이메일 인증을 진행해주세요.')
      }
    }

    if (email) {
      checkAuth()
    }
  }, [email, fromOtp])

  const validatePassword = (password: string) => password.length >= 8
  const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    if (!validatePassword(formData.password)) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.')
      return
    }

    if (!passwordsMatch) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      console.log(`회원가입 시도: ${email}, 비밀번호: ${formData.password.length}자`)

      if (fromOtp) {
        const urlParams = new URLSearchParams(window.location.search)
        const otpToken = urlParams.get('otp') || token

        if (otpToken) {
          console.log('OTP 인증 완료 - 최종 회원가입 처리')

          try {
            const { completeSignUp } = await import('../../lib/supabase')
            const result = await completeSignUp(email, formData.password, otpToken)
            console.log('최종 회원가입 성공:', result.user?.email)

            if (result.user && !('session' in result && result.session)) {
              console.log('자동 로그인 처리 중...')
              const { signInWithEmail } = await import('../../lib/supabase')
              const loginResult = await signInWithEmail(email, formData.password)

              if (loginResult.session) {
                console.log('자동 로그인 성공:', loginResult.user?.email)
              }
            }
          } catch (signupError) {
            console.error('최종 회원가입 실패:', signupError)
            const message = signupError instanceof Error ? signupError.message : '알 수 없는 오류'
            throw new Error(`회원가입에 실패했습니다: ${message}`)
          }
        } else {
          throw new Error('OTP 토큰이 없습니다. 다시 인증을 진행해주세요.')
        }
      } else {
        console.log('일반 회원가입 처리')
        const { signUpWithEmail } = await import('../../lib/supabase')
        const result = await signUpWithEmail(email, formData.password)

        if (!result.user) {
          throw new Error('회원가입에 실패했습니다.')
        }

        if (!result.session) {
          console.log('자동 로그인 처리 중...')
          const { signInWithEmail } = await import('../../lib/supabase')
          const loginResult = await signInWithEmail(email, formData.password)

          if (loginResult.session) {
            console.log('자동 로그인 성공:', loginResult.user?.email)
          }
        }
      }

      onSuccess()
    } catch (error) {
      console.error('회원가입/비밀번호 설정 실패:', error)
      setError('회원가입에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-arcade-dark border-4 border-arcade-green p-8 relative shadow-[0_0_60px_rgba(0,255,65,0.4)]">
        {/* 장식 */}
        <span className="absolute -top-3 left-5 text-xl text-arcade-yellow">◆</span>
        <span className="absolute -top-3 right-5 text-xl text-arcade-yellow">◆</span>

        <h2 className="font-pixel text-pixel-lg text-arcade-green text-center mb-4"
            style={{ textShadow: '2px 2px 0 #ff2a6d' }}>
          SET PASSWORD
        </h2>

        <p className="font-retro text-retro-base text-arcade-cyan text-center mb-6">
          <span className="text-arcade-yellow">{email}</span><br />
          CREATE YOUR PASSWORD
        </p>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-3 bg-arcade-dark border-3 border-arcade-pink">
            <p className="font-retro text-retro-base text-arcade-pink text-center">
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* 인증 경고 */}
        {!isAuthenticated && !error && (
          <div className="mb-6 p-3 bg-arcade-dark border-3 border-arcade-yellow">
            <p className="font-retro text-retro-base text-arcade-yellow text-center">
              ⚠ EMAIL VERIFICATION REQUIRED
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 비밀번호 */}
          <div>
            <label htmlFor="password" className="block font-pixel text-pixel-xs text-arcade-cyan uppercase mb-2">
              PASSWORD
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full font-retro text-retro-base bg-arcade-black text-white border-3 border-arcade-cyan px-4 py-3 pr-12 focus:border-arcade-yellow focus:shadow-neon-yellow transition-all placeholder:text-arcade-cyan/50 disabled:opacity-50"
                placeholder="MIN 8 CHARS"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-arcade-cyan hover:text-arcade-yellow transition-colors"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {formData.password && !validatePassword(formData.password) && (
              <p className="mt-1 font-retro text-retro-sm text-arcade-pink">
                MIN 8 CHARACTERS REQUIRED
              </p>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label htmlFor="confirmPassword" className="block font-pixel text-pixel-xs text-arcade-cyan uppercase mb-2">
              CONFIRM
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full font-retro text-retro-base bg-arcade-black text-white border-3 border-arcade-cyan px-4 py-3 pr-12 focus:border-arcade-yellow focus:shadow-neon-yellow transition-all placeholder:text-arcade-cyan/50 disabled:opacity-50"
                placeholder="RE-ENTER PASSWORD"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-arcade-cyan hover:text-arcade-yellow transition-colors"
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {formData.confirmPassword && !passwordsMatch && (
              <p className="mt-1 font-retro text-retro-sm text-arcade-pink">
                PASSWORDS DO NOT MATCH
              </p>
            )}
            {formData.confirmPassword && passwordsMatch && (
              <p className="mt-1 font-retro text-retro-sm text-arcade-green">
                ✓ MATCH!
              </p>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 font-pixel text-pixel-xs py-4 bg-transparent text-arcade-cyan border-3 border-arcade-cyan hover:bg-arcade-cyan/20 transition-all disabled:opacity-50"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isAuthenticated || !passwordsMatch || !validatePassword(formData.password)}
              className={`flex-[2] font-pixel text-pixel-xs py-4 border-4 border-white transition-all ${
                isSubmitting || !isAuthenticated || !passwordsMatch || !validatePassword(formData.password)
                  ? 'bg-arcade-dark text-arcade-cyan/50 cursor-not-allowed'
                  : 'bg-arcade-green text-arcade-black hover:translate-y-[-2px] hover:shadow-[0_6px_30px_rgba(0,255,65,0.5)] cursor-pointer'
              }`}
            >
              {isSubmitting ? 'SETTING...' : 'SET PASSWORD ▶'}
            </button>
          </div>
        </form>

        {/* 가이드 */}
        <div className="mt-6 p-3 bg-arcade-black border-2 border-arcade-blue">
          <h4 className="font-pixel text-pixel-xs text-arcade-yellow mb-2">
            PASSWORD GUIDE
          </h4>
          <ul className="font-retro text-retro-sm text-arcade-cyan space-y-1">
            <li>• MIN 8 CHARACTERS</li>
            <li>• USE LETTERS & NUMBERS</li>
            <li>• UNIQUE PASSWORD RECOMMENDED</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
