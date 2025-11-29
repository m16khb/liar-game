// GitHub OAuth 로그인 버튼 컴포넌트
// GitHub 계정으로 빠른 로그인

import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

interface GitHubLoginButtonProps {
  onSuccess?: () => void
  onError?: (error: Error) => void
  disabled?: boolean
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
}

export default function GitHubLoginButton({
  onSuccess,
  onError,
  disabled = false,
  className = '',
  variant = 'primary',
}: GitHubLoginButtonProps) {
  const { loginWithGitHub, loading } = useAuth()
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleClick = async () => {
    if (disabled || isLoggingIn) return

    setIsLoggingIn(true)

    try {
      await loginWithGitHub()
      onSuccess?.()
    } catch (error) {
      console.error('GitHub 로그인 실패:', error)

      // 사용자 친화적인 에러 메시지 생성
      let errorMessage = 'GitHub 로그인에 실패했습니다.'
      if (error instanceof Error) {
        if (error.message.includes('popup')) {
          errorMessage = '팝업이 차단되었습니다. 팝업을 허용해주세요.'
        } else if (error.message.includes('access_denied')) {
          errorMessage = 'GitHub 계정 접근이 거부되었습니다.'
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

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading || isLoggingIn}
      className={`w-full flex items-center justify-center font-retro text-retro-base px-4 py-3 bg-[#24292e] border-3 border-arcade-purple hover:border-arcade-cyan hover:shadow-neon-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {/* 로딩 상태 */}
      {(loading || isLoggingIn) && (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
      )}

      {/* GitHub 아이콘 */}
      {!loading && !isLoggingIn && (
        <svg
          className="w-5 h-5 mr-2"
          fill="white"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      )}

      <span className="text-white">{loading || isLoggingIn ? 'GitHub 로그인 중...' : 'GitHub으로 로그인'}</span>
    </button>
  )
}