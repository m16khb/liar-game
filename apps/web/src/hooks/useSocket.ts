// 소켓 관리 커스텀 훅
// 중복 연결 방지 및 상태 관리

import { useState, useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './useAuth'

interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connect: (roomCode: string) => void
  disconnect: () => void
}

// 전역 소켓 인스턴스 관리 (싱글톤 패턴)
let globalSocket: Socket | null = null
let connectionCount = 0

export function useSocket(): UseSocketReturn {
  const { getAuthToken } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(globalSocket)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currentRoomCode = useRef<string | null>(null)

  const connect = useCallback(async (roomCode: string) => {
    // 이미 연결된 방인지 확인
    if (currentRoomCode.current === roomCode && globalSocket?.connected) {
      console.log('이미 같은 방에 연결됨')
      return
    }

    // 새로운 방이거나 연결이 끊어진 경우
    if (globalSocket) {
      console.log('기존 소켓 연결 정리')
      globalSocket.disconnect()
      globalSocket.removeAllListeners()
      globalSocket = null
      connectionCount = 0
    }

    setIsConnecting(true)
    setError(null)
    currentRoomCode.current = roomCode

    try {
      const token = await getAuthToken()

      if (!token) {
        throw new Error('인증 토큰이 없습니다')
      }

      console.log(`소켓 연결 시도 (${++connectionCount}번째):`, roomCode)

      const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:4000'
      globalSocket = io(`${wsUrl}/room`, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        forceNew: true
      })

      // 이벤트 리스너 설정
      globalSocket.on('connect', () => {
        console.log('✅ 소켓 연결 성공')
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        globalSocket?.emit('join-room', { roomCode })
      })

      globalSocket.on('disconnect', (reason) => {
        console.log('❌ 소켓 연결 해제:', reason)
        setIsConnected(false)
        setIsConnecting(false)
      })

      globalSocket.on('error', (data) => {
        console.error('❌ 소켓 에러:', data)
        setError(data.message || '연결에 실패했습니다.')
        setIsConnecting(false)
        setIsConnected(false)
      })

      setSocket(globalSocket)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류'
      console.error('❌ 소켓 연결 초기화 실패:', err)
      setError(errorMessage)
      setIsConnecting(false)
    }
  }, [getAuthToken])

  const disconnect = useCallback(() => {
    if (globalSocket) {
      console.log('🧹 소켓 연결 정리')
      globalSocket.disconnect()
      globalSocket.removeAllListeners()
      globalSocket = null
      connectionCount = 0
      currentRoomCode.current = null

      setSocket(null)
      setIsConnected(false)
      setIsConnecting(false)
    }
  }, [])

  // 컴포넌트 unmount 시 정리
  useEffect(() => {
    return () => {
      // 다른 컴포넌트가 사용 중일 수 있으므로 바로 정리하지 않음
      console.log('useSocket cleanup')
    }
  }, [])

  return {
    socket: globalSocket,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect
  }
}