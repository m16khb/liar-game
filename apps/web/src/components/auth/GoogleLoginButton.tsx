// Google OAuth 로그인 버튼 컴포넌트
// Google 계정으로 빠른 로그인

import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

interface GoogleLoginButtonProps {
  onSuccess?: () => void
  onError?: (error: Error) => void
  disabled?: boolean
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
}

export default function GoogleLoginButton({
  onSuccess,
  onError,
  disabled = false,
  className = '',
  variant = 'primary',
}: GoogleLoginButtonProps) {
  const { loginWithGoogle, loading, isAuthenticated } = useAuth()
  const [wasClicked, setWasClicked] = useState(false)

  // isAuthenticated 상태 변화 감지
  React.useEffect(() => {
    // 버튼이 클릭된 후에 인증 상태가 변경되면 성공 콜백 호출
    if (wasClicked && isAuthenticated) {
      onSuccess?.()
      setWasClicked(false) // 초기화
    }
  }, [wasClicked, isAuthenticated, onSuccess])

  // 타임아웃 처리: 30초 안에 인증이 없으면 초기화
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (wasClicked) {
      timeoutId = setTimeout(() => {
        setWasClicked(false)
      }, 30000) // 30초 타임아웃
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [wasClicked])

  const handleClick = async () => {
    if (disabled || loading || wasClicked) return

    try {
      setWasClicked(true) // 클릭 상태 표시
      await loginWithGoogle()
      // onSuccess는 useEffect에서 isAuthenticated 상태 변경 시 호출됨
    } catch (error) {
      setWasClicked(false) // 에러 시 초기화

      // 사용자 친화적인 에러 메시지 생성
      let errorMessage = 'Google 로그인에 실패했습니다.'
      if (error instanceof Error) {
        if (error.message.includes('popup')) {
          errorMessage = '팝업이 차단되었습니다. 팝업을 허용해주세요.'
        } else if (error.message.includes('access_denied')) {
          errorMessage = 'Google 계정 접근이 거부되었습니다.'
        } else if (error.message.includes('network')) {
          errorMessage = '네트워크 연결을 확인해주세요.'
        } else if (error.message.includes('Provider is not supported')) {
          errorMessage = 'Google Provider가 활성화되지 않았습니다.'
        }
      }

      onError?.(new Error(errorMessage))
    }
  }

  // 버튼 스타일 클래스
  const baseClasses = 'w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses = {
    primary: 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600',
    secondary: 'text-white bg-blue-600 hover:bg-blue-700',
    outline: 'text-blue-600 border-blue-500 bg-transparent hover:bg-blue-50 hover:text-blue-700',
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={classes}
    >
      {/* 로딩 상태 */}
      {loading && (
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
            d="M4 12a8 8 0 018-8V0C4.477 0 0 1 0 0v0l8-8z"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4V12z"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M12 4a8 8 0 0 1 8 8v8H4V4z"
          />
        </svg>
      )}

      {/* Google 아이콘 */}
      <svg
        className="w-5 h-5 mr-2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>

      <span>{loading ? 'Google 로그인 중...' : 'Google로 로그인'}</span>
    </button>
  )
}