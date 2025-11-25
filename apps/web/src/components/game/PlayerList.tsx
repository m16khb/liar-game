// 플레이어 목록 컴포넌트 - Retro Arcade Theme
// 방에 참가한 플레이어들의 상태 표시

import { Player } from '../../types/game'

interface PlayerListProps {
  players: Player[]
  currentUserId?: number
  onContextMenu: (e: React.MouseEvent, player: Player) => void
}

const playerEmojis = ['👾', '🎮', '🕹️', '🎲', '🎯', '🎪', '🎰', '🃏']

export default function PlayerList({ players, currentUserId, onContextMenu }: PlayerListProps) {
  const sortedPlayers = [...players].sort((a, b) => a.joinOrder - b.joinOrder)

  return (
    <div className="bg-arcade-dark border-4 border-arcade-blue p-6 mb-6 shadow-arcade-card">
      {/* 헤더 */}
      <div className="flex items-center gap-4 pb-4 mb-4 border-b-3 border-dashed border-arcade-cyan">
        <h2 className="font-pixel text-pixel-sm text-arcade-yellow"
            style={{ textShadow: '2px 2px 0 #ff6b35' }}>
          ★ PLAYERS ★
        </h2>
        <span className="font-retro text-retro-lg text-arcade-green ml-auto">
          {players.length} JOINED
        </span>
      </div>

      {/* 플레이어 그리드 */}
      <div className="grid gap-3">
        {sortedPlayers.map((player, index) => {
          const isMe = player.userId === currentUserId
          const emoji = playerEmojis[index % playerEmojis.length]

          return (
            <div
              key={player.userId}
              className={`flex items-center gap-4 p-4 transition-all cursor-pointer relative
                ${isMe
                  ? 'bg-arcade-dark border-3 border-arcade-pink'
                  : 'bg-arcade-dark border-3 border-arcade-blue hover:border-arcade-cyan hover:translate-x-2'
                }`}
              onContextMenu={(e) => onContextMenu(e, player)}
            >
              {/* 좌측 악센트 바 */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                player.isHost ? 'bg-arcade-yellow' : isMe ? 'bg-arcade-pink' : 'bg-arcade-cyan'
              }`} />

              {/* 순위 */}
              <span className="font-pixel text-pixel-sm text-arcade-yellow w-8">
                {index + 1}P
              </span>

              {/* 아바타 */}
              <div className={`w-12 h-12 flex items-center justify-center text-2xl border-2 relative
                ${isMe ? 'border-arcade-pink bg-arcade-purple' : 'border-arcade-cyan bg-arcade-purple'}`}>
                {emoji}
                {/* 준비 완료 체크 */}
                {player.status === 'ready' && (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-arcade-green text-arcade-black text-xs flex items-center justify-center font-bold">
                    ✓
                  </span>
                )}
              </div>

              {/* 플레이어 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-retro text-retro-lg text-white truncate">
                    {player.nickname || `PLAYER_${player.userId}`}
                  </span>
                  {player.isHost && (
                    <span className="font-pixel text-[6px] px-2 py-1 bg-arcade-yellow text-arcade-black animate-pulse-badge">
                      HOST
                    </span>
                  )}
                  {isMe && (
                    <span className="font-pixel text-[6px] px-2 py-1 bg-arcade-pink text-white">
                      YOU
                    </span>
                  )}
                </div>
                <div className={`font-retro text-retro-sm ${
                  player.status === 'ready' ? 'text-arcade-green animate-blink' : 'text-arcade-cyan/50'
                }`}>
                  {player.status === 'ready' ? 'READY!' : 'WAITING...'}
                </div>
              </div>

              {/* 점수 (데코레이션) */}
              <div className="font-pixel text-pixel-xs text-arcade-orange text-right">
                0 PTS
              </div>
            </div>
          )
        })}
      </div>

      {/* 빈 슬롯 */}
      {players.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4 animate-float">👾</div>
          <p className="font-pixel text-pixel-xs text-arcade-cyan animate-blink">
            WAITING FOR PLAYERS...
          </p>
        </div>
      )}
    </div>
  )
}
