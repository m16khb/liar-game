// 게임방 헤더 컴포넌트
// 방 제목, 코드, 난이도, 인원 정보 표시

import { Room } from '../../types/game'

interface RoomHeaderProps {
  room: Room
  isLeaving: boolean
  onLeave: () => void
}

export default function RoomHeader({ room, isLeaving, onLeave }: RoomHeaderProps) {
  const difficultyText = {
    easy: '쉬움',
    normal: '보통',
    hard: '어려움'
  }

  return (
    <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          {room.title}
        </h1>
        <button
          onClick={onLeave}
          disabled={isLeaving}
          className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors
            ${isLeaving
              ? 'bg-gray-400 cursor-not-allowed opacity-70'
              : 'bg-red-500 hover:bg-red-600 cursor-pointer'
            }`}
        >
          {isLeaving ? '나가는 중...' : '나가기'}
        </button>
      </div>

      <div className="flex gap-8 flex-wrap text-sm">
        <div>
          <span className="text-gray-500">방 코드: </span>
          <span className="text-gray-800 font-semibold font-mono">
            {room.code}
          </span>
        </div>
        <div>
          <span className="text-gray-500">난이도: </span>
          <span className="text-gray-800 font-semibold">
            {difficultyText[room.difficulty]}
          </span>
        </div>
        <div>
          <span className="text-gray-500">인원: </span>
          <span className="text-gray-800 font-semibold">
            {room.currentPlayers} / {room.maxPlayers}
          </span>
        </div>
      </div>
    </div>
  )
}
