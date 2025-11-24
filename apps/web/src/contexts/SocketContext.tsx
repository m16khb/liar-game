// 소켓 컨텍스트 - 전역 소켓 상태 관리
// 앱 전체에서 하나의 소켓 인스턴스를 공유

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '../hooks/useAuth'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  currentRoomCode: string | null
  connect: (roomCode: string) => Promise<void>
  disconnect: () => void
}

const SocketContext = createContext<SocketContextType | null>(null)

export function SocketProvider({ children }: { children: ReactNode }) {
  const { getAuthToken } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  const connect = useCallback(async (roomCode: string) => {
    // 이미 연결된 방인지 확인
    if (currentRoomCode === roomCode && socketRef.current?.connected) {
      console.log('[SocketContext] 이미 같은 방에 연결됨')
      return
    }

    // 새로운 방이거나 연결이 끊어진 경우 기존 연결 정리
    if (socketRef.current) {
      console.log('[SocketContext] 기존 소켓 연결 정리')
      socketRef.current.disconnect()
      socketRef.current.removeAllListeners()
      socketRef.current = null
    }

    setIsConnecting(true)
    setError(null)
    setCurrentRoomCode(roomCode)

    try {
      const token = await getAuthToken()

      if (!token) {
        throw new Error('인증 토큰이 없습니다')
      }

      console.log('[SocketContext] 소켓 연결 시도:', roomCode)

      const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:4000'
      const newSocket = io(`${wsUrl}/room`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        forceNew: true
      })

      // 이벤트 리스너 설정
      newSocket.on('connect', () => {
        console.log('[SocketContext] 소켓 연결 성공')
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        newSocket.emit('join-room', { roomCode })
      })

      newSocket.on('disconnect', (reason) => {
        console.log('[SocketContext] 소켓 연결 해제:', reason)
        setIsConnected(false)
        setIsConnecting(false)
      })

      newSocket.on('error', (data) => {
        console.error('[SocketContext] 소켓 에러:', data)
        setError(data.message || '연결에 실패했습니다.')
        setIsConnecting(false)
        setIsConnected(false)
      })

      socketRef.current = newSocket
      setSocket(newSocket)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류'
      console.error('[SocketContext] 소켓 연결 초기화 실패:', err)
      setError(errorMessage)
      setIsConnecting(false)
    }
  }, [getAuthToken, currentRoomCode])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('[SocketContext] 소켓 연결 정리')
      socketRef.current.disconnect()
      socketRef.current.removeAllListeners()
      socketRef.current = null

      setSocket(null)
      setIsConnected(false)
      setIsConnecting(false)
      setCurrentRoomCode(null)
      setError(null)
    }
  }, [])

  const value: SocketContextType = {
    socket,
    isConnected,
    isConnecting,
    error,
    currentRoomCode,
    connect,
    disconnect
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}
