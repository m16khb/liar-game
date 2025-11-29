// 게임방 소켓 이벤트 관리 훅
// 소켓 연결, 이벤트 핸들링, 상태 관리

import { useState, useEffect, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useSocket } from './useSocket'
import { useAuth } from './useAuth'
import {
  Room,
  Player,
  RoomJoinedData,
  RoomUpdatedData,
  PlayerReadyChangedData,
  HostTransferredData,
  RoomDeletedData
} from '../types/game'

interface UseGameRoomSocketReturn {
  // 상태
  room: Room | null
  players: Player[]
  isReady: boolean
  isHost: boolean
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  isLeaving: boolean
  // 액션
  toggleReady: () => void
  startGame: () => void
  leaveRoom: () => void
  transferHost: (targetUserId: number) => void
}

export function useGameRoomSocket(roomCode: string | undefined): UseGameRoomSocketReturn {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket, isConnected, isConnecting, error: socketError, connect, disconnect } = useSocket()

  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isReady, setIsReady] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLeaving, setIsLeaving] = useState(false)

  // 소켓 연결
  useEffect(() => {
    if (!roomCode) {
      navigate('/rooms')
      return
    }

    connect(roomCode)

    return () => {
      disconnect()
    }
  }, [roomCode, navigate, connect, disconnect])

  // 에러 상태 동기화
  useEffect(() => {
    if (socketError) {
      setError(socketError)
    }
  }, [socketError])

  // 방 참가 성공 핸들러
  const handleRoomJoined = useCallback((data: RoomJoinedData) => {
    console.log('[useGameRoomSocket] 방 참가 성공:', data.room?.code)
    setRoom(data.room)
    setPlayers(data.players || [])

    const myPlayer = data.players?.find((p) =>
      p.user?.email === user?.email || p.userId === user?.backendUserId
    )
    if (myPlayer) {
      setIsReady(myPlayer.status === 'ready')
    }
  }, [user?.backendUserId, user?.email])

  // 방 업데이트 핸들러
  const handleRoomUpdated = useCallback((data: RoomUpdatedData) => {
    console.log('[useGameRoomSocket] 방 정보 업데이트')

    const amIHost = data.players?.some((p) => p.userId === user?.backendUserId && p.isHost)

    if (data.hostChanged) {
      // 방장 변경 시 동기적 업데이트
      flushSync(() => {
        setRoom(data.room)
        setPlayers(data.players || [])
        setIsHost(amIHost)

        const myPlayer = data.players?.find((p) =>
          p.user?.email === user?.email || p.userId === user?.backendUserId
        )
        if (myPlayer) {
          setIsReady(myPlayer.status === 'ready')
        }
      })
    } else {
      setRoom(data.room)
      setPlayers(data.players || [])

      const myPlayer = data.players?.find((p) =>
        p.user?.email === user?.email || p.userId === user?.backendUserId
      )
      if (myPlayer) {
        setIsReady(myPlayer.status === 'ready')
      }
    }
  }, [user?.backendUserId, user?.email])

  // 플레이어 준비 상태 변경 핸들러
  const handlePlayerReadyChanged = useCallback((data: PlayerReadyChangedData) => {
    console.log('[useGameRoomSocket] 플레이어 준비 상태 변경')
    setPlayers(data.players || [])

    const myPlayer = data.players?.find((p) =>
      p.user?.email === user?.email || p.userId === user?.backendUserId
    )
    if (myPlayer) {
      setIsReady(myPlayer.status === 'ready')
    }
  }, [user?.backendUserId, user?.email])

  // 게임 시작 핸들러
  const handleGameStarted = useCallback(() => {
    console.log('[useGameRoomSocket] 게임 시작')
    navigate(`/game/${roomCode}/play`)
  }, [navigate, roomCode])

  // 방장 위임 핸들러
  const handleHostTransferred = useCallback((data: HostTransferredData) => {
    console.log('[useGameRoomSocket] 방장 위임:', data.newHostId)
    setPlayers(data.players || [])
  }, [])

  // 방 삭제 핸들러
  const handleRoomDeleted = useCallback((data: RoomDeletedData) => {
    console.log('[useGameRoomSocket] 방 삭제')
    alert(data.message || '방이 삭제되었습니다.')
    navigate('/rooms')
  }, [navigate])

  // 소켓 이벤트 리스너 설정
  useEffect(() => {
    if (!socket) return

    socket.on('room-joined', handleRoomJoined)
    socket.on('room-updated', handleRoomUpdated)
    socket.on('player-ready-changed', handlePlayerReadyChanged)
    socket.on('game-started', handleGameStarted)
    socket.on('host-transferred', handleHostTransferred)
    socket.on('room-deleted', handleRoomDeleted)

    return () => {
      socket.off('room-joined', handleRoomJoined)
      socket.off('room-updated', handleRoomUpdated)
      socket.off('player-ready-changed', handlePlayerReadyChanged)
      socket.off('game-started', handleGameStarted)
      socket.off('host-transferred', handleHostTransferred)
      socket.off('room-deleted', handleRoomDeleted)
    }
  }, [socket, handleRoomJoined, handleRoomUpdated, handlePlayerReadyChanged, handleGameStarted, handleHostTransferred, handleRoomDeleted])

  // 방장 상태 계산
  useEffect(() => {
    const result = players.some(p => p.userId === user?.backendUserId && p.isHost)
    setIsHost(result)
  }, [players, user?.backendUserId])

  // 액션: 준비 상태 토글
  const toggleReady = useCallback(() => {
    if (socket && room?.status === 'waiting') {
      console.log('[useGameRoomSocket] toggle-ready 이벤트 전송')
      socket.emit('toggle-ready')
    }
  }, [socket, room])

  // 액션: 게임 시작 (방장만)
  const startGame = useCallback(() => {
    if (socket && room?.status === 'waiting') {
      socket.emit('start-game')
    }
  }, [socket, room])

  // 액션: 방 나가기
  const leaveRoom = useCallback(() => {
    if (socket && !isLeaving) {
      setIsLeaving(true)
      socket.emit('leave-room')
      setTimeout(() => {
        navigate('/rooms', { replace: true })
      }, 500)
    }
  }, [socket, navigate, isLeaving])

  // 액션: 방장 위임
  const transferHost = useCallback((targetUserId: number) => {
    if (socket) {
      socket.emit('transfer-host', { targetUserId })
    }
  }, [socket])

  return {
    room,
    players,
    isReady,
    isHost,
    isConnected,
    isConnecting,
    error,
    isLeaving,
    toggleReady,
    startGame,
    leaveRoom,
    transferHost
  }
}
