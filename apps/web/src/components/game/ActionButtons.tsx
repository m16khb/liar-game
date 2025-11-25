// 게임방 액션 버튼 컴포넌트 - Retro Arcade Theme
// 준비하기/게임 시작 버튼

import { Room, Player } from '../../types/game'

interface ActionButtonsProps {
  room: Room
  players: Player[]
  isHost: boolean
  isReady: boolean
  onToggleReady: () => void
  onStartGame: () => void
}

export default function ActionButtons({
  room,
  players,
  isHost,
  isReady,
  onToggleReady,
  onStartGame
}: ActionButtonsProps) {
  // 게임 시작 가능 여부 계산
  const hostCount = players.filter(p => p.isHost).length
  const readyNonHostCount = players.filter(p => p.status === 'ready' && !p.isHost).length
  const totalReady = hostCount + readyNonHostCount

  const canStartGame = room.currentPlayers >= room.minPlayers && totalReady >= room.minPlayers

  // 시작 버튼 텍스트
  const getStartButtonText = () => {
    if (room.currentPlayers < room.minPlayers) {
      return `NEED ${room.minPlayers} PLAYERS`
    }
    if (!canStartGame) {
      return 'WAITING FOR READY...'
    }
    return 'START GAME!'
  }

  if (room.status !== 'waiting') {
    return null
  }

  return (
    <div className="bg-arcade-dark border-4 border-arcade-pink p-8 shadow-[0_0_30px_rgba(255,42,109,0.3)]">
      <div className="flex gap-6 justify-center flex-wrap">
        {/* 일반 플레이어: 준비 버튼 */}
        {!isHost && (
          <button
            onClick={onToggleReady}
            className={`font-pixel text-pixel-sm px-8 py-4 border-4 border-white transition-all cursor-pointer
              ${isReady
                ? 'bg-arcade-orange text-white hover:translate-y-[-4px] hover:shadow-[0_8px_30px_rgba(255,107,53,0.5)]'
                : 'bg-arcade-cyan text-arcade-black hover:translate-y-[-4px] hover:shadow-[0_8px_30px_rgba(5,217,232,0.5)]'
              }`}
          >
            {isReady ? 'CANCEL' : 'READY'}
          </button>
        )}

        {/* 방장: 게임 시작 버튼 */}
        {isHost && (
          <button
            onClick={onStartGame}
            disabled={!canStartGame}
            className={`font-pixel text-pixel-sm px-10 py-5 border-4 border-white transition-all
              ${canStartGame
                ? 'bg-arcade-green text-arcade-black cursor-pointer hover:translate-y-[-4px] hover:shadow-[0_8px_40px_rgba(0,255,65,0.6)]'
                : 'bg-arcade-dark text-arcade-cyan/50 cursor-not-allowed border-arcade-cyan/30'
              }`}
          >
            {getStartButtonText()}
          </button>
        )}
      </div>

      {/* 상태 안내 */}
      <div className="mt-6 text-center">
        <p className="font-retro text-retro-base text-arcade-cyan">
          {isHost
            ? `준비 완료: ${totalReady} / ${room.minPlayers} (최소)`
            : isReady
              ? '다른 플레이어들을 기다리는 중...'
              : 'READY 버튼을 눌러 준비해주세요'
          }
        </p>
      </div>
    </div>
  )
}
