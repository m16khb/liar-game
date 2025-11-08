// Discord OAuth 로그인 버튼 컴포넌트
// Discord 계정으로 빠른 로그인

import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

interface DiscordLoginButtonProps {
  onSuccess?: () => void
  onError?: (error: Error) => void
  disabled?: boolean
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
}

export default function DiscordLoginButton({
  onSuccess,
  onError,
  disabled = false,
  className = '',
  variant = 'primary',
}: DiscordLoginButtonProps) {
  const { loginWithDiscord, loading } = useAuth()
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleClick = async () => {
    if (disabled || isLoggingIn) return

    setIsLoggingIn(true)

    try {
      await loginWithDiscord()
      onSuccess?.()
    } catch (error) {
      console.error('Discord 로그인 실패:', error)

      // 사용자 친화적인 에러 메시지 생성
      let errorMessage = 'Discord 로그인에 실패했습니다.'
      if (error instanceof Error) {
        if (error.message.includes('popup')) {
          errorMessage = '팝업이 차단되었습니다. 팝업을 허용해주세요.'
        } else if (error.message.includes('access_denied')) {
          errorMessage = 'Discord 계정 접근이 거부되었습니다.'
        } else if (error.message.includes('network')) {
          errorMessage = '네트워크 연결을 확인해주세요.'
        }
      }

      const customError = new Error(errorMessage)
      onError?.(customError)
    } finally {
      setIsLoggingIn(false)
    }
  }

  // 버튼 스타일 클래스
  const baseClasses = 'w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses = {
    primary: 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600',
    secondary: 'text-white bg-indigo-600 hover:bg-indigo-700',
    outline: 'text-indigo-600 border-indigo-500 bg-transparent hover:bg-indigo-50 hover:text-indigo-700',
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading || isLoggingIn}
      className={classes}
    >
      {/* 로딩 상태 */}
      {(loading || isLoggingIn) && (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C4.477 0 0 4.477 0 10h4l-4 4z"
          />
        </svg>
      )}

      {/* Discord 아이콘 */}
      <svg
        className="w-5 h-5 mr-2"
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>

      <span>{loading || isLoggingIn ? 'Discord 로그인 중...' : 'Discord으로 로그인'}</span>
    </button>
  )
}