// 게임방 헤더 컴포넌트 - Retro Arcade Theme
// 방 제목, 코드, 난이도, 인원 정보 표시

import { Room } from '../../types/game'

interface RoomHeaderProps {
  room: Room
  isLeaving: boolean
  onLeave: () => void
}

export default function RoomHeader({ room, isLeaving, onLeave }: RoomHeaderProps) {
  const difficultyConfig = {
    easy: { text: 'EASY', color: 'text-arcade-green' },
    normal: { text: 'NORMAL', color: 'text-arcade-cyan' },
    hard: { text: 'HARD', color: 'text-arcade-pink' }
  }

  const difficulty = difficultyConfig[room.difficulty] || difficultyConfig.normal

  return (
    <div className="bg-arcade-dark border-4 border-arcade-cyan p-4 md:p-6 mb-6 relative shadow-arcade-card">
      {/* 장식 */}
      <span className="absolute -top-3 left-5 text-xl text-arcade-yellow">◆</span>
      <span className="absolute -top-3 right-5 text-xl text-arcade-yellow">◆</span>

      {/* 상단: 상태 + 나가기 버튼 */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          <span className="font-pixel text-pixel-xs text-arcade-green animate-blink">
            ● {room.status === 'waiting' ? 'WAITING' : 'PLAYING'}
          </span>
          <span className="font-retro text-retro-sm md:text-retro-base text-arcade-cyan">
            ROOM: {room.code}
          </span>
        </div>
        <button
          onClick={onLeave}
          disabled={isLeaving}
          className={`font-pixel text-pixel-xs px-3 py-2 md:px-4 border-3 border-arcade-pink text-arcade-pink transition-all
            ${isLeaving
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-arcade-pink hover:text-arcade-black hover:shadow-neon-pink cursor-pointer'
            }`}
        >
          {isLeaving ? 'LEAVING...' : 'EXIT'}
        </button>
      </div>

      {/* 방 제목 */}
      <h1 className="font-pixel text-pixel-base md:text-pixel-xl text-arcade-yellow mb-4 glitch-hover break-words"
          style={{ textShadow: '2px 2px 0 #ff2a6d, 4px 4px 0 #05d9e8' }}>
        {room.title.toUpperCase()}
      </h1>

      {/* 방 정보 */}
      <div className="flex gap-3 md:gap-6 flex-wrap font-retro text-retro-sm md:text-retro-base">
        <div>
          <span className="text-arcade-cyan/70">DIFFICULTY: </span>
          <span className={`font-pixel text-pixel-xs ${difficulty.color}`}>
            {difficulty.text}
          </span>
        </div>
        <div>
          <span className="text-arcade-cyan/70">PLAYERS: </span>
          <span className="text-arcade-yellow font-pixel text-pixel-sm">
            {room.currentPlayers}
          </span>
          <span className="text-arcade-cyan/50"> / {room.maxPlayers}</span>
        </div>
        <div>
          <span className="text-arcade-cyan/70">MIN: </span>
          <span className="text-arcade-cyan">
            {room.minPlayers}
          </span>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className="mt-4 h-2 bg-arcade-black border border-arcade-cyan overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${(room.currentPlayers / room.maxPlayers) * 100}%`,
            backgroundColor: room.currentPlayers >= room.maxPlayers ? '#ff2a6d' : '#00ff41',
            boxShadow: `0 0 10px ${room.currentPlayers >= room.maxPlayers ? '#ff2a6d' : '#00ff41'}`
          }}
        />
      </div>
    </div>
  )
}
