// 이메일 인증 모달 컴포넌트
// Supabase 이메일 인증 처리

import { useState } from 'react'
import { sendEmailVerification } from '../../lib/supabase'

interface EmailSignupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EmailSignupModal({
  isOpen,
  onClose,
  onSuccess
}: EmailSignupModalProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 모달이 닫히면 상태 초기화
  const handleClose = () => {
    if (!isSubmitting) {
      setEmail('')
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  // 이메일 유효성 검증
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 이메일 인증 요청
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    // 이메일 유효성 검증
    if (!email || !validateEmail(email)) {
      setError('유효한 이메일 주소를 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Supabase 이메일 OTP 발송 (사용자 생성 없이 OTP만 발송)
      await sendEmailVerification(email)
      setSuccess(true)

      // OTP 입력 페이지로 이동 (tmp/frontend 방식)
      setTimeout(() => {
        window.location.href = `/otp-verification?email=${encodeURIComponent(email)}`
      }, 2000)

    } catch (error) {
      console.error('이메일 인증 실패:', error)
      setError('이메일 전송에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 모달이 열리지 않았을 때는 렌더링하지 않음
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
        {/* 닫기 버튼 */}
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
          {!success ? (
            <>
              {/* 이메일 인증 폼 */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  이메일로 가입하기
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  이메일 주소를 입력하시면 인증 코드를 보내드립니다.
                </p>
              </div>

              {/* 에러 메시지 */}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '전송 중...' : '인증 코드 보내기'}
                </button>
              </form>

              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                인증 코드를 받지 못하셨나요? 스팸 폴더를 확인해주세요.
              </p>
            </>
          ) : (
            <>
              {/* 성공 메시지 */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  인증 코드를 보냈습니다!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>{email}</strong>로 6자리 인증 코드를 전송했습니다.<br />
                  이메일을 확인하여 인증 코드를 입력해주세요.
                </p>
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>이메일 예시:</strong> <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">123456</code>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}