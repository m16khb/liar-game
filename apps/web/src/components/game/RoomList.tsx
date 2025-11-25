// 게임방 목록 컴포넌트 - Retro Arcade Theme

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfileModal from '../user/ProfileModal'
import JoinRoomByCode from './JoinRoomByCode'
import CreateRoomModal, { CreateRoomRequest } from './CreateRoomModal'
import { useAuth } from '../../hooks/useAuth'
import { useRooms } from '../../hooks/useRooms'
import { RoomResponse, RoomStatus } from '@/types/api'

export default function RoomList({
  onRoomJoin,
  onRoomCreate
}: {
  onRoomJoin?: (roomCode: string) => void
  onRoomCreate?: () => void
}) {
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showJoinByCodeModal, setShowJoinByCodeModal] = useState(false)
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false)
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { rooms, loading, error, setError: setRoomsError, refresh, createRoom: createNewRoom } = useRooms(RoomStatus.WAITING)

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) refresh()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refresh])

  const handleJoinRoom = async (room: RoomResponse) => {
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', `/game/${room.code}`)
      navigate('/login')
      return
    }
    if (room.currentPlayers >= room.maxPlayers) {
      setRoomsError('이 방은 정원이 가득 찼습니다.')
      return
    }
    try {
      setJoiningRoomId(room.id)
      await new Promise(resolve => setTimeout(resolve, 500))
      onRoomJoin?.(room.code)
      navigate(`/game/${room.code}`)
    } catch {
      setRoomsError('방 참가에 실패했습니다.')
    } finally {
      setJoiningRoomId(null)
    }
  }

  const handleCreateRoomClick = () => {
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', '/rooms?action=create')
      navigate('/login')
      return
    }
    setShowCreateRoomModal(true)
  }

  const handleCreateRoom = async (roomData: CreateRoomRequest) => {
    try {
      setCreatingRoom(true)
      const newRoom = await createNewRoom(roomData)
      onRoomCreate?.()
      navigate(`/game/${newRoom.code}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '방 생성에 실패했습니다.'
      setRoomsError(errorMessage)
      throw err
    } finally {
      setCreatingRoom(false)
    }
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

      <div className="max-w-5xl mx-auto px-6 py-10 relative z-10">
        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="font-pixel text-2xl md:text-3xl text-arcade-yellow mb-3"
                  style={{ textShadow: '3px 3px 0 #ff2a6d, 6px 6px 0 #05d9e8' }}>
                LIAR GAME
              </h1>
              <p className="font-retro text-xl md:text-2xl text-arcade-cyan">
                {'>> 다른 플레이어들과 함께 라이어 게임을 즐겨보세요! <<'}
              </p>
            </div>

            {isAuthenticated ? (
              <button
                onClick={() => setShowProfileModal(true)}
                className="font-pixel text-xs px-4 py-3 bg-arcade-cyan text-arcade-black border-4 border-white hover:shadow-[0_0_20px_#05d9e8] transition-all"
              >
                👤 MY PAGE
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="font-pixel text-xs px-4 py-3 bg-arcade-cyan text-arcade-black border-4 border-white hover:shadow-[0_0_20px_#05d9e8] transition-all"
              >
                LOGIN
              </button>
            )}
          </div>
        </header>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <button
            onClick={handleCreateRoomClick}
            disabled={creatingRoom}
            className="font-pixel text-sm px-8 py-4 bg-arcade-green text-arcade-black border-4 border-white hover:translate-y-[-4px] hover:shadow-[0_8px_30px_#00ff41] transition-all disabled:opacity-50"
          >
            {creatingRoom ? 'CREATING...' : '+ NEW ROOM'}
          </button>
          <button
            onClick={() => setShowJoinByCodeModal(true)}
            className="font-pixel text-sm px-8 py-4 bg-arcade-cyan text-white border-4 border-white hover:translate-y-[-4px] hover:shadow-[0_8px_30px_#05d9e8] transition-all"
          >
            🎫 JOIN BY CODE
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-arcade-dark border-3 border-arcade-pink flex justify-between items-center">
            <span className="font-retro text-xl text-arcade-pink">⚠️ {error}</span>
            <button onClick={() => setRoomsError(null)} className="font-pixel text-arcade-pink hover:text-arcade-yellow">✕</button>
          </div>
        )}

        {/* Room List */}
        <main>
          <div className="flex items-center gap-4 pb-3 mb-6 border-b-3 border-dashed border-arcade-cyan">
            <h2 className="font-pixel text-sm text-arcade-yellow" style={{ textShadow: '2px 2px 0 #ff6b35' }}>
              ★ WAITING ROOMS ★
            </h2>
            <span className="font-retro text-xl text-arcade-green ml-auto">{rooms.length} ROOMS</span>
            <button
              onClick={refresh}
              className="w-10 h-10 flex items-center justify-center bg-arcade-dark border-2 border-arcade-cyan text-arcade-cyan hover:bg-arcade-cyan hover:text-arcade-black transition-all"
            >
              🔄
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 border-4 border-arcade-dark border-t-arcade-cyan rounded-full animate-spin mx-auto mb-4" />
              <p className="font-pixel text-xs text-arcade-cyan animate-blink">LOADING...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="bg-arcade-dark border-4 border-arcade-cyan p-12 text-center shadow-[0_0_20px_rgba(5,217,232,0.3)]">
              <div className="text-6xl mb-4 animate-float">🎮</div>
              <h3 className="font-pixel text-sm text-arcade-yellow mb-3">NO ROOMS FOUND</h3>
              <p className="font-retro text-xl text-arcade-cyan mb-6">새 방을 생성하거나 잠시 후 다시 확인해주세요</p>
              <button
                onClick={refresh}
                className="font-pixel text-xs px-6 py-3 bg-arcade-cyan text-arcade-black border-4 border-white hover:shadow-[0_0_20px_#05d9e8] transition-all"
              >
                🔄 REFRESH
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => {
                const isFull = room.currentPlayers >= room.maxPlayers
                const isJoining = joiningRoomId === room.id

                return (
                  <div
                    key={room.id}
                    className="bg-arcade-dark border-3 border-arcade-blue p-5 cursor-pointer transition-all hover:border-arcade-cyan hover:translate-y-[-4px] hover:shadow-[0_0_25px_rgba(5,217,232,0.3)] relative group"
                    onClick={() => !isFull && !isJoining && handleJoinRoom(room)}
                  >
                    {/* Left accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-arcade-cyan group-hover:bg-arcade-yellow transition-colors" />

                    <div className="mb-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-pixel text-xs text-white truncate flex-1">{room.title}</h3>
                        {isFull && (
                          <span className="font-pixel text-[8px] px-2 py-1 bg-arcade-pink text-white">FULL</span>
                        )}
                      </div>
                      <p className="font-retro text-base text-arcade-cyan truncate">
                        CODE: {room.code} | HOST: {room.host?.nickname || '???'}
                      </p>
                    </div>

                    {/* Player count */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="font-pixel text-sm text-arcade-yellow">{room.currentPlayers}</span>
                      <span className="font-retro text-base text-arcade-cyan">/ {room.maxPlayers}</span>
                      <div className="flex-1 h-3 bg-arcade-black border border-arcade-cyan overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${(room.currentPlayers / room.maxPlayers) * 100}%`,
                            backgroundColor: isFull ? '#ff2a6d' : '#00ff41',
                            boxShadow: isFull ? '0 0 10px #ff2a6d' : '0 0 10px #00ff41'
                          }}
                        />
                      </div>
                    </div>

                    {/* Join button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isFull && !isJoining) handleJoinRoom(room)
                      }}
                      disabled={isFull || isJoining}
                      className={`w-full font-pixel text-xs py-3 border-4 border-white transition-all
                        ${isFull
                          ? 'bg-arcade-dark text-arcade-cyan cursor-not-allowed opacity-50'
                          : 'bg-arcade-green text-arcade-black hover:shadow-[0_0_20px_#00ff41]'
                        }`}
                    >
                      {isJoining ? 'JOINING...' : isFull ? 'ROOM FULL' : 'JOIN ▶'}
                    </button>

                    {/* Hover arrow */}
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl text-arcade-cyan opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      ▶
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </main>

        {/* Bottom prompt */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 font-pixel text-[10px] text-arcade-yellow text-center animate-blink">
          PRESS START TO BEGIN<br />▼ ▼ ▼
        </div>
      </div>

      {/* Modals */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

      {showJoinByCodeModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowJoinByCodeModal(false)}
        >
          <JoinRoomByCode onClose={() => setShowJoinByCodeModal(false)} />
        </div>
      )}

      <CreateRoomModal
        isOpen={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        onCreateRoom={handleCreateRoom}
        creating={creatingRoom}
      />
    </div>
  )
}
