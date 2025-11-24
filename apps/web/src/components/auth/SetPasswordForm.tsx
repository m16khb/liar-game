// 비밀번호 설정 폼 컴포넌트
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

  // 페이지 로드 시 인증 상태 및 OTP 토큰 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // URL에서 OTP 토큰 확인
        const urlParams = new URLSearchParams(window.location.search)
        const otpToken = urlParams.get('otp')

        if (otpToken && fromOtp) {
          console.log('URL에서 OTP 토큰 확인:', otpToken)
          setIsAuthenticated(true)
          return
        }

        // 일반 세션 확인
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

  // 비밀번호 유효성 검증
  const validatePassword = (password: string) => {
    return password.length >= 8
  }

  // 비밀번호 일치 여부 확인
  const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0

  // 입력 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    // 유효성 검증
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

      // 올바른 회원가입 플로우: 이 시점에서 최종 회원가입 처리
      if (fromOtp) {
        // URL에서 OTP 토큰 가져오기
        const urlParams = new URLSearchParams(window.location.search)
        const otpToken = urlParams.get('otp') || token

        if (otpToken) {
          // OTP 인증 후 최종 회원가입 (이때 유저가 생성됨)
          console.log('OTP 인증 완료 - 최종 회원가입 처리')

          try {
            const { completeSignUp } = await import('../../lib/supabase')
            const result = await completeSignUp(email, formData.password, otpToken)
            console.log('최종 회원가입 성공:', result.user?.email)

            // 최종 회원가입 후 자동 로그인 처리
            if (result.user && !('session' in result && result.session)) {
              console.log('자동 로그인 처리 중...')
              const { signInWithEmail } = await import('../../lib/supabase')
              const loginResult = await signInWithEmail(email, formData.password)

              if (loginResult.session) {
                console.log('자동 로그인 성공:', loginResult.user?.email)
                // Auth Hooks는 Supabase에서 자동으로 처리됨
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
        // 일반 회원가입 (이메일 확인 필요 없는 경우)
        console.log('일반 회원가입 처리')
        const { signUpWithEmail } = await import('../../lib/supabase')
        const result = await signUpWithEmail(email, formData.password)

        if (!result.user) {
          throw new Error('회원가입에 실패했습니다.')
        }

        // 회원가입 후 자동 로그인 (세션이 없는 경우)
        if (!result.session) {
          console.log('자동 로그인 처리 중...')
          const { signInWithEmail } = await import('../../lib/supabase')
          const loginResult = await signInWithEmail(email, formData.password)

          if (loginResult.session) {
            console.log('자동 로그인 성공:', loginResult.user?.email)
            // Auth Hooks는 Supabase에서 자동으로 처리됨
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
          marginBottom: '16px'
        }}>
          비밀번호 설정
        </h2>

        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <strong>{email}</strong>로 계정이 생성되었습니다.<br />
          비밀번호를 설정하여 계정을 완성해주세요.
        </p>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-600 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">
              {error}
            </p>
          </div>
        )}

        {/* 인증되지 않은 경우 */}
        {!isAuthenticated && !error && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-600 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              이메일 인증이 필요합니다. 이메일로 전송된 인증 링크를 클릭해주세요.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 비밀번호 입력 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              비밀번호
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                placeholder="최소 8자 이상"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {formData.password && !validatePassword(formData.password) && (
              <p className="mt-1 text-sm text-red-600">
                비밀번호는 최소 8자 이상이어야 합니다.
              </p>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              비밀번호 확인
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                placeholder="비밀번호 다시 입력"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {formData.confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-sm text-red-600">
                비밀번호가 일치하지 않습니다.
              </p>
            )}
            {formData.confirmPassword && passwordsMatch && (
              <p className="mt-1 text-sm text-green-600">
                비밀번호가 일치합니다.
              </p>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isAuthenticated || !passwordsMatch || !validatePassword(formData.password)}
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '설정 중...' : '비밀번호 설정'}
            </button>
          </div>
        </form>

        {/* 비밀번호 가이드 */}
        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            비밀번호 가이드
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• 최소 8자 이상</li>
            <li>• 영문, 숫자 조합 권장</li>
            <li>• 다른 사이트와 다른 비밀번호 사용 권장</li>
          </ul>
        </div>
      </div>
    </div>
  )
}