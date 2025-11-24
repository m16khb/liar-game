// 플레이어 목록 컴포넌트
// 방에 참가한 플레이어들의 상태 표시

import { Player } from '../../types/game'

interface PlayerListProps {
  players: Player[]
  currentUserId?: number
  onContextMenu: (e: React.MouseEvent, player: Player) => void
}

export default function PlayerList({ players, currentUserId, onContextMenu }: PlayerListProps) {
  const sortedPlayers = [...players].sort((a, b) => a.joinOrder - b.joinOrder)

  return (
    <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-5">
        플레이어 ({players.length})
      </h2>

      <div className="grid gap-3">
        {sortedPlayers.map((player) => (
          <div
            key={player.userId}
            className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors
              ${player.userId === currentUserId
                ? 'border-2 border-blue-500 bg-blue-50'
                : 'border border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
            onContextMenu={(e) => onContextMenu(e, player)}
          >
            {/* 아바타 */}
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-4 text-lg">
              👤
            </div>

            {/* 플레이어 정보 */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">
                  {player.nickname || `플레이어 ${player.userId}`}
                </span>
                {player.isHost && (
                  <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                    방장
                  </span>
                )}
                {player.userId === currentUserId && (
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded">
                    나
                  </span>
                )}
              </div>
            </div>

            {/* 준비 상태 */}
            <div className={`px-3 py-1 rounded-md text-sm font-semibold
              ${player.status === 'ready'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
              }`}
            >
              {player.status === 'ready' ? '준비' : '대기'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
