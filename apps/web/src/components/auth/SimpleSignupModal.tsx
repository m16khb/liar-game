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
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            회원가입
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            간단하게 가입하고 바로 시작하세요
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-600 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '가입 중...' : '가입하기'}
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            가입하면 바로 로그인됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}