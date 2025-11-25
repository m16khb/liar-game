// Google OAuth 로그인 버튼 컴포넌트 - Retro Arcade Theme
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

  React.useEffect(() => {
    if (wasClicked && isAuthenticated) {
      onSuccess?.()
      setWasClicked(false)
    }
  }, [wasClicked, isAuthenticated, onSuccess])

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (wasClicked) {
      timeoutId = setTimeout(() => {
        setWasClicked(false)
      }, 30000)
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
      setWasClicked(true)
      await loginWithGoogle()
    } catch (error) {
      setWasClicked(false)

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

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={`w-full flex items-center justify-center font-retro text-retro-base px-4 py-3 bg-white border-3 border-arcade-cyan hover:border-arcade-yellow hover:shadow-neon-yellow transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {/* 로딩 스피너 */}
      {loading && (
        <span className="arcade-spinner w-4 h-4 mr-3" />
      )}

      {/* Google 아이콘 */}
      {!loading && (
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
      )}

      <span className="text-arcade-black">
        {loading ? 'LOGGING IN...' : 'LOGIN WITH GOOGLE'}
      </span>
    </button>
  )
}
