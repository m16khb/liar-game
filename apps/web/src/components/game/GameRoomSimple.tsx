import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/hooks/useAuth'

// Types
interface Player {
  id: number
  userId: number
  nickname: string
  isHost: boolean
  status: 'ready' | 'not_ready' | 'playing' | 'eliminated'
  joinOrder: number
}

interface Room {
  id: number
  code: string
  title: string
  status: 'waiting' | 'playing' | 'finished'
  difficulty: 'easy' | 'normal' | 'hard'
  minPlayers: number
  maxPlayers: number
  currentPlayers: number
  isPrivate: boolean
  description?: string
  host?: {
    id: number
    nickname: string
  }
}

export default function GameRoomSimple() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const { user, getAuthToken } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isReady, setIsReady] = useState(false)
  const [isConnecting, setIsConnecting] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // WebSocket 연결
  useEffect(() => {
    const initSocket = async () => {
      if (!roomCode) {
        navigate('/rooms')
        return
      }

      const token = await getAuthToken()
      console.log('Token:', token ? 'exists' : 'missing')
      console.log('Token length:', token?.length || 0)
      console.log('Token prefix:', token?.substring(0, 20) + '...')

      if (!token) {
        navigate('/rooms')
        return
      }

      // WebSocket 연결 - HTTPS와 전송 프로토콜 강제
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:4000';
    const newSocket = io(wsUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      })

      newSocket.on('connect', () => {
        console.log('Socket 연결 성공')
        setIsConnecting(false)
        newSocket.emit('join-room', { roomCode })
      })

      newSocket.on('disconnect', () => {
        console.log('Socket 연결 해제')
        setIsConnecting(true)
      })

      newSocket.on('error', (data) => {
        console.error('Socket 에러:', data)
        setError(data.message || '연결에 실패했습니다.')
        setIsConnecting(false)
      })

      // 이벤트 리스너들
      newSocket.on('room-joined', (data) => {
        console.log('방 참가 성공:', data)
        setRoom(data.room)
        setPlayers(data.players || [])
      })

      newSocket.on('room-updated', (data) => {
        console.log('방 정보 업데이트:', data)
        setRoom(data.room)
        setPlayers(data.players || [])
      })

      newSocket.on('player-ready-changed', (data) => {
        console.log('플레이어 준비 상태 변경:', data)
        setPlayers(data.players || [])
        if (data.player?.userId === user?.id) {
          setIsReady(data.player.status === 'ready')
        }
      })

      newSocket.on('game-started', () => {
        console.log('게임 시작')
        navigate(`/game/${roomCode}/play`)
      })

      setSocket(newSocket)
    }

    initSocket()
  }, [roomCode, navigate, user?.id])

  // 준비 상태 토글
  const handleToggleReady = useCallback(() => {
    if (socket && room?.status === 'waiting') {
      socket.emit('toggle-ready')
    }
  }, [socket, room])

  // 게임 시작 (방장만)
  const handleStartGame = useCallback(() => {
    if (socket && room?.status === 'waiting') {
      socket.emit('start-game')
    }
  }, [socket, room])

  // 방 나가기
  const handleLeaveRoom = useCallback(() => {
    if (socket) {
      socket.emit('leave-room')
      navigate('/rooms')
    }
  }, [socket, navigate])

  // 현재 유저가 방장인지 확인
  const isHost = players.some(p => p.userId === user?.id && p.isHost)

  // 게임 시작 가능 여부
  const canStartGame = room &&
    room.currentPlayers >= room.minPlayers &&
    players.filter(p => p.status === 'ready' || p.isHost).length >= room.minPlayers

  if (isConnecting) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            방에 연결 중...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        padding: '16px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <h2 style={{
            color: '#dc2626',
            fontSize: '20px',
            marginBottom: '16px'
          }}>
            오류 발생
          </h2>
          <p style={{
            color: '#6b7280',
            marginBottom: '24px'
          }}>
            {error}
          </p>
          <button
            onClick={() => navigate('/rooms')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            방 목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  if (!room) {
    return null
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '16px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* 방 정보 헤더 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: 0
            }}>
              {room.title}
            </h1>
            <button
              onClick={handleLeaveRoom}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              나가기
            </button>
          </div>

          <div style={{
            display: 'flex',
            gap: '32px',
            flexWrap: 'wrap'
          }}>
            <div>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>방 코드: </span>
              <span style={{
                color: '#1f2937',
                fontSize: '16px',
                fontWeight: '600',
                fontFamily: 'monospace'
              }}>
                {room.code}
              </span>
            </div>
            <div>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>난이도: </span>
              <span style={{
                color: '#1f2937',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                {room.difficulty === 'easy' ? '쉬움' :
                 room.difficulty === 'normal' ? '보통' : '어려움'}
              </span>
            </div>
            <div>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>인원: </span>
              <span style={{
                color: '#1f2937',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                {room.currentPlayers} / {room.maxPlayers}
              </span>
            </div>
          </div>
        </div>

        {/* 플레이어 목록 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '20px',
            margin: 0
          }}>
            플레이어 ({players.length})
          </h2>

          <div style={{
            display: 'grid',
            gap: '12px'
          }}>
            {players.sort((a, b) => a.joinOrder - b.joinOrder).map((player) => (
              <div
                key={player.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: player.userId === user?.id ? '2px solid #3b82f6' : '1px solid #e5e7eb'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  fontSize: '18px'
                }}>
                  👤
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      {player.nickname || `플레이어 ${player.userId}`}
                    </span>
                    {player.isHost && (
                      <span style={{
                        fontSize: '12px',
                        color: '#3b82f6',
                        fontWeight: '600',
                        backgroundColor: '#eff6ff',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        방장
                      </span>
                    )}
                    {player.userId === user?.id && (
                      <span style={{
                        fontSize: '12px',
                        color: '#10b981',
                        fontWeight: '600',
                        backgroundColor: '#ecfdf5',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        나
                      </span>
                    )}
                  </div>
                </div>

                <div style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: player.status === 'ready' ? '#ecfdf5' : '#fef3c7',
                  color: player.status === 'ready' ? '#059669' : '#d97706'
                }}>
                  {player.status === 'ready' ? '준비' : '대기'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center'
        }}>
          {!isHost && room.status === 'waiting' && (
            <button
              onClick={handleToggleReady}
              style={{
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isReady ? '#f59e0b' : '#10b981',
                color: 'white'
              }}
            >
              {isReady ? '준비 취소' : '준비하기'}
            </button>
          )}

          {isHost && room.status === 'waiting' && (
            <button
              onClick={handleStartGame}
              disabled={!canStartGame}
              style={{
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '8px',
                border: 'none',
                cursor: canStartGame ? 'pointer' : 'not-allowed',
                backgroundColor: canStartGame ? '#3b82f6' : '#9ca3af',
                color: 'white',
                opacity: canStartGame ? 1 : 0.6
              }}
            >
              {!canStartGame && room.currentPlayers < room.minPlayers
                ? `최소 ${room.minPlayers}명 필요`
                : !canStartGame
                ? '모든 플레이어가 준비되어야 합니다'
                : '게임 시작'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}