// 마이페이지 모달 컴포넌트 - Retro Arcade Theme
// 사용자 정보 표시 및 로그아웃 기능

import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      onClose()
      window.location.href = '/'
    } catch (error) {
      console.error('로그아웃 실패:', error)
      setIsLoggingOut(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-arcade-dark border-4 border-arcade-cyan w-full max-w-md max-h-[90vh] overflow-auto relative animate-in shadow-[0_0_60px_rgba(5,217,232,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 장식 */}
        <span className="absolute -top-3 left-5 text-xl text-arcade-yellow">◆</span>
        <span className="absolute -top-3 right-5 text-xl text-arcade-yellow">◆</span>

        {/* 헤더 */}
        <div className="p-6 pb-4 border-b-3 border-dashed border-arcade-cyan relative">
          <h2 className="font-pixel text-pixel-lg text-arcade-yellow pr-8"
              style={{ textShadow: '2px 2px 0 #ff2a6d' }}>
            MY PAGE
          </h2>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 font-pixel text-pixel-sm text-arcade-cyan hover:text-arcade-yellow transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 프로필 정보 */}
        <div className="p-6">
          <div className="flex flex-col items-center mb-6">
            {/* 아바타 */}
            <div className="w-20 h-20 border-4 border-arcade-cyan bg-arcade-purple flex items-center justify-center mb-4 relative">
              <span className="font-pixel text-pixel-xl text-arcade-cyan">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
              {/* 활동 상태 */}
              <span className="absolute -bottom-2 -right-2 w-6 h-6 bg-arcade-green border-2 border-arcade-dark rounded-full flex items-center justify-center">
                <span className="w-2 h-2 bg-arcade-black rounded-full animate-pulse" />
              </span>
            </div>

            {/* 이메일 */}
            <div className="text-center mb-4 w-full">
              <p className="font-pixel text-pixel-xs text-arcade-cyan/70 mb-1 tracking-wider">
                EMAIL
              </p>
              <p className="font-retro text-retro-base text-white break-all px-4">
                {user?.email || 'NO EMAIL'}
              </p>
            </div>

            {/* 닉네임 */}
            <div className="text-center mb-4">
              <p className="font-pixel text-pixel-xs text-arcade-cyan/70 mb-1 tracking-wider">
                NICKNAME
              </p>
              <p className="font-retro text-retro-lg text-arcade-yellow">
                {user?.user_metadata?.nickname || user?.email?.split('@')[0] || 'PLAYER'}
              </p>
            </div>

            {/* 가입일 */}
            <div className="text-center mb-4">
              <p className="font-pixel text-pixel-xs text-arcade-cyan/70 mb-1 tracking-wider">
                JOINED
              </p>
              <p className="font-retro text-retro-base text-arcade-cyan">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    }).replace(/\. /g, '/').replace('.', '')
                  : new Date().toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    }).replace(/\. /g, '/').replace('.', '')
                }
              </p>
            </div>

            {/* 상태 배지 */}
            <div className="flex items-center gap-2 px-3 py-1 bg-arcade-green/20 border border-arcade-green">
              <span className="w-2 h-2 bg-arcade-green rounded-full animate-pulse" />
              <span className="font-pixel text-pixel-xs text-arcade-green">ONLINE</span>
            </div>
          </div>

          {/* 통계 정보 */}
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-arcade-black border-2 border-arcade-blue">
            <div className="text-center border-r border-arcade-blue">
              <p className="font-pixel text-pixel-lg text-arcade-cyan mb-1"
                 style={{ textShadow: '0 0 10px #05d9e8' }}>
                0
              </p>
              <p className="font-retro text-retro-sm text-arcade-cyan/70">
                PLAYED
              </p>
            </div>
            <div className="text-center">
              <p className="font-pixel text-pixel-lg text-arcade-green mb-1"
                 style={{ textShadow: '0 0 10px #00ff41' }}>
                0
              </p>
              <p className="font-retro text-retro-sm text-arcade-cyan/70">
                WINS
              </p>
            </div>
          </div>

          {/* 메뉴 */}
          <div className="mb-6 bg-arcade-black border-2 border-arcade-blue p-2">
            <button className="w-full p-3 bg-arcade-dark hover:bg-arcade-purple border-2 border-transparent hover:border-arcade-cyan transition-all text-left flex justify-between items-center group">
              <span className="font-pixel text-pixel-xs text-arcade-cyan group-hover:text-arcade-yellow">
                ⚙️ SETTINGS
              </span>
              <span className="font-retro text-retro-lg text-arcade-cyan/50 group-hover:text-arcade-yellow">›</span>
            </button>
            <div className="h-px bg-arcade-blue my-2" />
            <button className="w-full p-3 bg-arcade-dark hover:bg-arcade-purple border-2 border-transparent hover:border-arcade-cyan transition-all text-left flex justify-between items-center group">
              <span className="font-pixel text-pixel-xs text-arcade-cyan group-hover:text-arcade-yellow">
                📝 HISTORY
              </span>
              <span className="font-retro text-retro-lg text-arcade-cyan/50 group-hover:text-arcade-yellow">›</span>
            </button>
          </div>

          {/* 로그아웃 버튼 */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`w-full font-pixel text-pixel-xs py-4 border-4 border-white transition-all ${
              isLoggingOut
                ? 'bg-arcade-dark text-arcade-pink/50 cursor-not-allowed'
                : 'bg-arcade-pink text-white hover:translate-y-[-2px] hover:shadow-[0_6px_30px_rgba(255,42,109,0.5)] cursor-pointer'
            }`}
          >
            {isLoggingOut ? 'LOGGING OUT...' : 'LOGOUT'}
          </button>

          {/* 버전 정보 */}
          <p className="font-pixel text-[8px] text-arcade-cyan/30 text-center mt-4">
            LIAR GAME v1.0.0
          </p>
        </div>
      </div>
    </div>
  )
}
