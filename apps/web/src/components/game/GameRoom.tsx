// 게임방 메인 컴포넌트 - Retro Arcade Theme
// 리팩토링: 739줄 → ~120줄

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameRoomSocket } from '@/hooks/useGameRoomSocket'
import { useAuth } from '@/hooks/useAuth'
import { Player, ContextMenuState } from '@/types/game'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorPage from '../common/ErrorPage'
import RoomHeader from './RoomHeader'
import PlayerList from './PlayerList'
import ActionButtons from './ActionButtons'
import PlayerContextMenu from './PlayerContextMenu'

export default function GameRoom() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const {
    room,
    players,
    isReady,
    isHost,
    isConnecting,
    error,
    isLeaving,
    toggleReady,
    startGame,
    leaveRoom,
    transferHost
  } = useGameRoomSocket(roomCode)

  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetPlayer: null
  })

  // 컨텍스트 메뉴 핸들러
  const handleContextMenu = useCallback((e: React.MouseEvent, player: Player) => {
    e.preventDefault()

    // 방장이 자신이 아닌 플레이어를 우클릭할 때만 메뉴 표시
    if (isHost && player.userId !== user?.backendUserId && room?.status === 'waiting') {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        targetPlayer: player
      })
    }
  }, [isHost, user?.backendUserId, room?.status])

  // 컨텍스트 메뉴 닫기
  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }))
  }, [])

  // 방장 위임 핸들러
  const handleTransferHost = useCallback((player: Player) => {
    transferHost(player.userId)
  }, [transferHost])

  // 전역 클릭 시 컨텍스트 메뉴 닫기
  useEffect(() => {
    const handleClick = () => closeContextMenu()
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [closeContextMenu])

  // 로딩 상태
  if (isConnecting) {
    return <LoadingSpinner message="방에 연결 중..." />
  }

  // 에러 상태
  if (error) {
    return (
      <ErrorPage
        message={error}
        buttonText="방 목록으로 돌아가기"
        onButtonClick={() => navigate('/rooms')}
      />
    )
  }

  // 방 정보 로딩 중
  if (!room) {
    return <LoadingSpinner message="방 정보를 불러오는 중..." />
  }

  return (
    <div className="min-h-screen bg-arcade-black text-white">
      {/* CRT Scanline Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-10"
           style={{
             background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
           }} />

      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-5"
           style={{
             backgroundImage: 'linear-gradient(#05d9e8 1px, transparent 1px), linear-gradient(90deg, #05d9e8 1px, transparent 1px)',
             backgroundSize: '50px 50px'
           }} />

      <div className="max-w-3xl mx-auto px-4 py-8 relative z-10">
        {/* 방 정보 헤더 */}
        <RoomHeader
          room={room}
          isLeaving={isLeaving}
          onLeave={leaveRoom}
        />

        {/* 플레이어 목록 */}
        <PlayerList
          players={players}
          currentUserId={user?.backendUserId}
          onContextMenu={handleContextMenu}
        />

        {/* 액션 버튼 */}
        <ActionButtons
          room={room}
          players={players}
          isHost={isHost}
          isReady={isReady}
          onToggleReady={toggleReady}
          onStartGame={startGame}
        />
      </div>

      {/* 컨텍스트 메뉴 */}
      <PlayerContextMenu
        contextMenu={contextMenu}
        onTransferHost={handleTransferHost}
        onClose={closeContextMenu}
      />

      {/* Bottom prompt */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 font-pixel text-[10px] text-arcade-yellow text-center animate-blink">
        LIAR GAME<br />▼ ▼ ▼
      </div>
    </div>
  )
}
