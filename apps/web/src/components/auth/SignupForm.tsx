// 회원가입 폼 컴포넌트
// 이메일 회원가입 UI

import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

interface SignupFormProps {
  onSignupSuccess?: () => void
  onLoginClick?: () => void
}

export default function SignupForm({ onSignupSuccess, onLoginClick }: SignupFormProps) {
  const { signup, loading, error, clearError } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // 에러 초기화
    if (error) {
      clearError()
    }
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const { [name]: removed, ...rest } = prev
        return rest
      })
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    // 이메일 유효성 검증
    if (!formData.email) {
      errors.email = '이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '올바른 이메일 형식이 아닙니다.'
    }

    // 비밀번호 유효성 검증
    if (!formData.password) {
      errors.password = '비밀번호를 입력해주세요.'
    } else if (formData.password.length < 8) {
      errors.password = '비밀번호는 최소 8자 이상이어야 합니다.'
    }

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.'
    }

    // 닉네임 유효성 검증
    if (formData.nickname && formData.nickname.length < 2) {
      errors.nickname = '닉네임은 최소 2자 이상이어야 합니다.'
    } else if (formData.nickname && formData.nickname.length > 20) {
      errors.nickname = '닉네임은 최대 20자까지 가능합니다.'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await signup({
        email: formData.email,
        password: formData.password,
        nickname: formData.nickname,
      })

      onSignupSuccess?.()
    } catch (error) {
      console.error('회원가입 실패:', error)
      // 에러는 useAuth 훅에서 처리됨
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-arcade-dark border-4 border-arcade-cyan rounded-lg shadow-[0_0_40px_rgba(5,217,232,0.4)] p-8">
        <h2 className="font-pixel text-pixel-xl text-arcade-yellow text-center mb-8">
          회원가입
        </h2>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-arcade-pink/20 border-2 border-arcade-pink rounded">
            <p className="font-retro text-retro-sm text-arcade-pink">
              {error}
            </p>
          </div>
        )}

        {/* 회원가입 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block font-pixel text-pixel-xs text-arcade-cyan uppercase mb-2">
              이메일 <span className="text-arcade-pink">*</span>
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
              className={`w-full font-retro text-retro-base bg-arcade-black text-white border-3 px-4 py-3 focus:shadow-neon-yellow transition-all placeholder:text-arcade-cyan/50 disabled:opacity-50 ${
                validationErrors.email
                  ? 'border-arcade-pink focus:border-arcade-pink'
                  : 'border-arcade-cyan focus:border-arcade-yellow'
              }`}
              placeholder="your@email.com"
            />
            {validationErrors.email && (
              <p className="mt-1 font-retro text-retro-sm text-arcade-pink">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="nickname" className="block font-pixel text-pixel-xs text-arcade-cyan uppercase mb-2">
              닉네임 <span className="font-retro text-retro-sm text-arcade-cyan/50">(선택사항)</span>
            </label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              autoComplete="nickname"
              value={formData.nickname}
              onChange={handleInputChange}
              disabled={loading}
              className={`w-full font-retro text-retro-base bg-arcade-black text-white border-3 px-4 py-3 focus:shadow-neon-yellow transition-all placeholder:text-arcade-cyan/50 disabled:opacity-50 ${
                validationErrors.nickname
                  ? 'border-arcade-pink focus:border-arcade-pink'
                  : 'border-arcade-cyan focus:border-arcade-yellow'
              }`}
              placeholder="2-20자 (한글, 영문, 숫자, -, _)"
              maxLength={20}
            />
            {validationErrors.nickname && (
              <p className="mt-1 font-retro text-retro-sm text-arcade-pink">
                {validationErrors.nickname}
              </p>
            )}
            <p className="mt-1 font-retro text-retro-sm text-arcade-cyan/50">
              게임 내에서 사용될 닉네임입니다
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block font-pixel text-pixel-xs text-arcade-cyan uppercase mb-2">
              비밀번호 <span className="text-arcade-pink">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
              className={`w-full font-retro text-retro-base bg-arcade-black text-white border-3 px-4 py-3 focus:shadow-neon-yellow transition-all placeholder:text-arcade-cyan/50 disabled:opacity-50 ${
                validationErrors.password
                  ? 'border-arcade-pink focus:border-arcade-pink'
                  : 'border-arcade-cyan focus:border-arcade-yellow'
              }`}
              placeholder="최소 8자 이상"
            />
            {validationErrors.password && (
              <p className="mt-1 font-retro text-retro-sm text-arcade-pink">
                {validationErrors.password}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block font-pixel text-pixel-xs text-arcade-cyan uppercase mb-2">
              비밀번호 확인 <span className="text-arcade-pink">*</span>
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleInputChange}
              disabled={loading}
              className={`w-full font-retro text-retro-base bg-arcade-black text-white border-3 px-4 py-3 focus:shadow-neon-yellow transition-all placeholder:text-arcade-cyan/50 disabled:opacity-50 ${
                validationErrors.confirmPassword
                  ? 'border-arcade-pink focus:border-arcade-pink'
                  : 'border-arcade-cyan focus:border-arcade-yellow'
              }`}
              placeholder="비밀번호 다시 입력"
            />
            {validationErrors.confirmPassword && (
              <p className="mt-1 font-retro text-retro-sm text-arcade-pink">
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || isSubmitting}
            className={`w-full font-pixel text-pixel-sm py-4 border-4 border-white transition-all ${
              loading || isSubmitting
                ? 'bg-arcade-cyan/30 text-arcade-cyan cursor-not-allowed opacity-50'
                : 'bg-arcade-cyan text-arcade-black hover:translate-y-[-2px] hover:shadow-[0_6px_30px_rgba(5,217,232,0.5)] cursor-pointer'
            }`}
          >
            {loading || isSubmitting ? '가입 중...' : '회원가입'}
          </button>
        </form>

        {/* 약관 동의 */}
        <div className="mt-6 p-4 bg-arcade-purple/20 border-2 border-arcade-purple rounded">
          <p className="font-retro text-retro-sm text-arcade-cyan leading-relaxed">
            회원가입 시 라이어 게임의
            <a href="#" className="text-arcade-yellow hover:text-arcade-pink transition-colors">
              서비스 약관
            </a>
            과
            <a href="#" className="text-arcade-yellow hover:text-arcade-pink transition-colors">
              개인정보 처리방침
            </a>
            에 동의하는 것으로 간주합니다.
          </p>
        </div>

        {/* 링크 */}
        <div className="mt-6 text-center font-retro text-retro-base">
          <span className="text-arcade-cyan">이미 계정이 있으신가요? </span>
          <button
            type="button"
            onClick={onLoginClick}
            className="text-arcade-yellow hover:text-arcade-pink transition-colors ml-1"
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  )
}