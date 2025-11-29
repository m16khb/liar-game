// 간단한 이메일 가입 모달
// 바로 가입 처리 (개발 환경용)

import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

interface SimpleSignupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function SimpleSignupModal({
  isOpen,
  onClose,
  onSuccess
}: SimpleSignupModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ email: '', password: '', confirmPassword: '' })
      setError(null)
      onClose()
    }
  }

  const validateForm = () => {
    if (!formData.email) {
      setError('이메일을 입력해주세요.')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('유효한 이메일 주소를 입력해주세요.')
      return false
    }

    if (!formData.password) {
      setError('비밀번호를 입력해주세요.')
      return false
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    if (!validateForm()) return

    setIsSubmitting(true)
    setError(null)

    try {
      console.log('📝 간단 가입 시도:', formData.email)

      // 가입 먼저 시도
      const { signup } = useAuth()
      await signup({
        email: formData.email,
        password: formData.password
      })

      console.log('✅ 가입 성공')
      onSuccess()

    } catch (error) {
      console.error('가입 실패:', error)
      setError('가입에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-arcade-dark border-4 border-arcade-cyan rounded-lg max-w-md w-full p-6 relative shadow-[0_0_40px_rgba(5,217,232,0.4)]">
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 font-pixel text-pixel-sm text-arcade-cyan hover:text-arcade-yellow transition-colors disabled:opacity-50"
        >
          ✕
        </button>

        <div className="text-center">
          <h3 className="font-pixel text-pixel-lg text-arcade-yellow mb-2">
            회원가입
          </h3>
          <p className="font-retro text-retro-base text-arcade-cyan mb-6">
            간단하게 가입하고 바로 시작하세요
          </p>

          {error && (
            <div className="mb-4 p-3 bg-arcade-pink/20 border-2 border-arcade-pink rounded">
              <p className="font-retro text-retro-sm text-arcade-pink">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="이메일 주소"
                disabled={isSubmitting}
                className="w-full font-retro text-retro-base bg-arcade-black text-white border-3 border-arcade-cyan px-4 py-3 focus:border-arcade-yellow focus:shadow-neon-yellow transition-all placeholder:text-arcade-cyan/50 disabled:opacity-50"
                required
              />
            </div>

            <div>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="비밀번호 (최소 6자)"
                disabled={isSubmitting}
                className="w-full font-retro text-retro-base bg-arcade-black text-white border-3 border-arcade-cyan px-4 py-3 focus:border-arcade-yellow focus:shadow-neon-yellow transition-all placeholder:text-arcade-cyan/50 disabled:opacity-50"
                required
                minLength={6}
              />
            </div>

            <div>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="비밀번호 확인"
                disabled={isSubmitting}
                className="w-full font-retro text-retro-base bg-arcade-black text-white border-3 border-arcade-cyan px-4 py-3 focus:border-arcade-yellow focus:shadow-neon-yellow transition-all placeholder:text-arcade-cyan/50 disabled:opacity-50"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full font-pixel text-pixel-sm py-4 border-4 border-white transition-all ${
                isSubmitting
                  ? 'bg-arcade-cyan/30 text-arcade-cyan cursor-not-allowed opacity-50'
                  : 'bg-arcade-cyan text-arcade-black hover:translate-y-[-2px] hover:shadow-[0_6px_30px_rgba(5,217,232,0.5)] cursor-pointer'
              }`}
            >
              {isSubmitting ? '가입 중...' : '가입하기'}
            </button>
          </form>

          <p className="mt-4 font-retro text-retro-sm text-arcade-cyan/50">
            가입하면 바로 로그인됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}