// 게임방 액션 버튼 컴포넌트
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
      return `최소 ${room.minPlayers}명 필요`
    }
    if (!canStartGame) {
      return '모든 플레이어가 준비되어야 합니다'
    }
    return '게임 시작'
  }

  if (room.status !== 'waiting') {
    return null
  }

  return (
    <div className="flex gap-4 justify-center">
      {/* 일반 플레이어: 준비 버튼 */}
      {!isHost && (
        <button
          onClick={onToggleReady}
          className={`px-8 py-3.5 text-base font-semibold rounded-lg text-white transition-colors cursor-pointer
            ${isReady
              ? 'bg-amber-500 hover:bg-amber-600'
              : 'bg-green-500 hover:bg-green-600'
            }`}
        >
          {isReady ? '준비 취소' : '준비하기'}
        </button>
      )}

      {/* 방장: 게임 시작 버튼 */}
      {isHost && (
        <button
          onClick={onStartGame}
          disabled={!canStartGame}
          className={`px-8 py-3.5 text-base font-semibold rounded-lg text-white transition-colors
            ${canStartGame
              ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
              : 'bg-gray-400 cursor-not-allowed opacity-60'
            }`}
        >
          {getStartButtonText()}
        </button>
      )}
    </div>
  )
}
