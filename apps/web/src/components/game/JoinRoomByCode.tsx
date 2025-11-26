// 방 코드로 참가하는 컴포넌트 - Retro Arcade Theme

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useRooms } from '@/hooks/useRooms'

interface JoinRoomByCodeProps {
  onClose?: () => void
}

export default function JoinRoomByCode({ onClose }: JoinRoomByCodeProps) {
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { getRoomByCode } = useRooms()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!roomCode.trim()) {
      setError('방 코드를 입력해주세요.')
      return
    }

    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', `/join?code=${roomCode}`)
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const room = await getRoomByCode(roomCode.trim())

      if (!room) {
        setError('존재하지 않는 방입니다.')
        return
      }

      if (room.status !== 'waiting') {
        setError('이미 시작된 방입니다.')
        return
      }

      if (room.currentPlayers >= room.maxPlayers) {
        setError('정원이 가득 찬 방입니다.')
        return
      }

      // 비밀 방 체크 - 비밀번호 입력 없이 실패 처리
      if (room.isPrivate) {
        setError('ACCESS DENIED - PRIVATE ROOM')
        return
      }

      navigate(`/game/${room.code}`)
      onClose?.()
    } catch (err) {
      console.error('방 참가 실패:', err)
      const errorMessage = err instanceof Error ? err.message : '방 참가에 실패했습니다.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-arcade-dark border-4 border-arcade-cyan p-6 w-full max-w-sm relative shadow-[0_0_40px_rgba(5,217,232,0.4)]">
      {/* 장식 */}
      <span className="absolute -top-3 left-5 text-xl text-arcade-yellow">◆</span>
      <span className="absolute -top-3 right-5 text-xl text-arcade-yellow">◆</span>

      {/* 닫기 버튼 */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 font-pixel text-pixel-sm text-arcade-cyan hover:text-arcade-yellow transition-colors"
        >
          ✕
        </button>
      )}

      {/* 제목 */}
      <h2 className="font-pixel text-pixel-lg text-arcade-cyan text-center mb-6"
          style={{ textShadow: '2px 2px 0 #0f3460' }}>
        🎫 JOIN BY CODE
      </h2>

      <form onSubmit={handleSubmit}>
        {/* 코드 입력 */}
        <div className="mb-5">
          <input
            type="text"
            value={roomCode}
            onChange={(e) => {
              setRoomCode(e.target.value.toLowerCase())
              setError(null)
            }}
            placeholder="ENTER ROOM CODE"
            className="w-full font-mono text-sm text-center bg-arcade-black text-arcade-yellow border-4 border-arcade-blue px-4 py-4 focus:border-arcade-cyan focus:shadow-neon-cyan transition-all placeholder:text-arcade-blue placeholder:text-xs"
          />
          <p className="text-xs text-arcade-cyan opacity-50 text-center mt-2" style={{ fontFamily: 'VT323, Galmuri11, monospace' }}>
            EX: df786457578e456e85fe577a8a9984a3
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-arcade-dark border-3 border-arcade-pink">
            <p className="text-base text-arcade-pink text-center" style={{ fontFamily: 'VT323, Galmuri11, monospace' }}>
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 font-pixel text-pixel-xs py-4 bg-transparent text-arcade-cyan border-3 border-arcade-cyan hover:bg-arcade-cyan/20 transition-all"
            >
              CANCEL
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !roomCode.trim()}
            className={`font-pixel text-pixel-xs py-4 border-4 border-white transition-all ${
              onClose ? 'flex-[2]' : 'w-full'
            } ${
              loading || !roomCode.trim()
                ? 'bg-arcade-dark text-arcade-cyan/50 cursor-not-allowed'
                : 'bg-arcade-green text-arcade-black hover:translate-y-[-2px] hover:shadow-[0_6px_30px_rgba(0,255,65,0.5)]'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="arcade-spinner w-4 h-4" />
                JOINING...
              </span>
            ) : (
              'JOIN ▶'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
