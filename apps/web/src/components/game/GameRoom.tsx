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
  room?: Room
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
  timeLimit?: number
  gameSettings?: {
    roundTime?: number
    rounds?: number
  }
  host?: {
    id: number
    nickname: string
  }
}

export default function GameRoom() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const { user, getAuthToken } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isReady, setIsReady] = useState(false)
  const [isConnecting, setIsConnecting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'warning' | 'info' | 'error'
    message: string
    isVisible: boolean
  }>(() => ({
    type: 'success',
    message: '',
    isVisible: false
  }))
  const [isGameStarting, setIsGameStarting] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const maxReconnectAttempts = 5

  // 알림 표시 함수
  const showNotification = useCallback((
    type: 'success' | 'warning' | 'info' | 'error',
    message: string
  ) => {
    setNotification({ type, message, isVisible: true })
  }, [])

  // WebSocket 연결
  useEffect(() => {
    if (!roomCode || !getAuthToken()) {
      navigate('/rooms')
      return
    }

    // WebSocket 연결 - HTTPS와 전송 프로토콜 강제
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:4000';
    const newSocket = io(wsUrl, {
      auth: {
        token: getAuthToken()
      },
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('Socket 연결 성공')
      setIsConnecting(false)

      // 방 참가 요청
      newSocket.emit('join-room', { roomCode })
    })

    newSocket.on('disconnect', (reason) => {
      console.log('Socket 연결 해제:', reason)
      setIsConnecting(true)

      // 재연결 시도
      if (reason === 'io server disconnect') {
        // 서버가 명시적으로 연결을 끊음 -> 재연결하지 않음
        showNotification('error', '서버와의 연결이 끊겼습니다. 페이지를 새로고침해주세요.')
      } else if (reconnectAttempts < maxReconnectAttempts) {
        // 자동 재연결 시도
        const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000)
        setReconnectAttempts(prev => prev + 1)

        setTimeout(() => {
          showNotification('info', `연결이 끊겼습니다. 재연결 시도 중... (${reconnectAttempts + 1}/${maxReconnectAttempts})`)
          newSocket.connect()
        }, timeout)
      } else {
        showNotification('error', '재연결에 실패했습니다. 페이지를 새로고침해주세요.')
      }
    })

    newSocket.on('error', (data) => {
      console.error('Socket 에러:', data)
      const errorMessage = data.message || '연결에 실패했습니다.'
      setError(errorMessage)
      setIsConnecting(false)
      showNotification('error', errorMessage)
    })

    // 재연결 성공
    newSocket.on('connect', () => {
      if (reconnectAttempts > 0) {
        showNotification('success', '서버에 다시 연결되었습니다!')
        setReconnectAttempts(0)
      }
    })

    // 이벤트 리스너들
    newSocket.on('room-joined', (data) => {
      console.log('방 참가 성공:', data)
      setRoom(data.room)
      setPlayers(data.players || [])
    })

    newSocket.on('room-updated', (data) => {
      console.log('방 정보 업데이트:', data)
      const prevPlayerCount = players.length
      const newPlayerCount = data.players?.length || 0

      setRoom(data.room)
      setPlayers(data.players || [])

      // 플레이어 입장/퇴장 알림
      if (newPlayerCount > prevPlayerCount) {
        const newPlayer = data.players?.find((p: Player) =>
          !players.some(existing => existing.userId === p.userId)
        )
        if (newPlayer) {
          showNotification('success', `${newPlayer.nickname || `플레이어 ${newPlayer.userId}`}님이 입장했습니다.`)
        }
      } else if (newPlayerCount < prevPlayerCount) {
        const leftPlayer = players.find(existing =>
          !data.players?.some((p: Player) => p.userId === existing.userId)
        )
        if (leftPlayer) {
          showNotification('info', `${leftPlayer.nickname || `플레이어 ${leftPlayer.userId}`}님이 퇴장했습니다.`)
        }
      }
    })

    newSocket.on('player-ready-changed', (data) => {
      console.log('플레이어 준비 상태 변경:', data)
      setPlayers(data.players || [])
      if (data.player?.userId === user?.id) {
        setIsReady(data.player.status === 'ready')
      }

      // 다른 플레이어 상태 변경 알림
      if (data.player?.userId !== user?.id) {
        const playerName = data.player?.nickname || `플레이어 ${data.player?.userId}`
        const statusText = data.player?.status === 'ready' ? '준비 완료' : '준비 취소'
        showNotification('info', `${playerName}님이 ${statusText}했습니다.`)
      }
    })

    newSocket.on('game-started', () => {
      console.log('게임 시작')
      // TODO: 게임 화면으로 전환
      navigate(`/game/${roomCode}/play`)
    })

    newSocket.on('host-changed', (data) => {
      console.log('방장 변경:', data)
      const newHost = players.find(p => p.userId === data.newHostId)

      setRoom(prev => prev ? {
        ...prev,
        host: newHost ? {
          id: data.newHostId,
          nickname: newHost.nickname
        } : undefined
      } : null)

      // 방장 변경 알림
      if (newHost) {
        if (data.newHostId === user?.id) {
          showNotification('success', '당신이 새로운 방장이 되었습니다!')
        } else {
          showNotification('info', `${newHost.nickname}님이 새로운 방장이 되었습니다.`)
        }
      }
    })

    newSocket.on('game-can-start', () => {
      console.log('모든 플레이어 준비 완료 - 게임 시작 가능')
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [roomCode, getAuthToken, navigate, user?.id])

  // 준비 상태 토글
  const handleToggleReady = useCallback(() => {
    if (socket && room?.status === 'waiting') {
      socket.emit('toggle-ready')
      showNotification('info', isReady ? '준비를 취소했습니다.' : '준비 완료!')
    }
  }, [socket, room, isReady, showNotification])

  // 게임 시작 (방장만)
  const handleStartGame = useCallback(() => {
    if (socket && room?.status === 'waiting' && canStartGame) {
      setIsGameStarting(true)
      showNotification('success', '게임을 시작합니다!')

      // 카운트다운 시작
      let count = 3
      setCountdown(count)

      const countdownInterval = setInterval(() => {
        count -= 1
        setCountdown(count)

        if (count === 0) {
          clearInterval(countdownInterval)
          socket.emit('start-game')
        }
      }, 1000)
    }
  }, [socket, room, canStartGame, showNotification])

  // 방 나가기
  const handleLeaveRoom = useCallback(() => {
    if (socket) {
      socket.emit('leave-room')
      // 명시적으로 소켓 연결 종료는 useEffect cleanup에서 처리
      navigate('/rooms')
    }
  }, [socket, navigate])

  // 초대 코드 복사
  const handleCopyInviteCode = useCallback(async () => {
    if (room?.code) {
      try {
        await navigator.clipboard.writeText(room.code)
        setNotification({
          type: 'success',
          message: '초대 코드가 복사되었습니다!',
          isVisible: true
        })
      } catch (error) {
        console.error('초대 코드 복사 실패:', error)
        setNotification({
          type: 'error',
          message: '초대 코드 복사에 실패했습니다.',
          isVisible: true
        })
      }
    }
  }, [room?.code])

  // 현재 유저가 방장인지 확인
  const isHost = players.some(p => p.userId === user?.id && p.isHost)

  // 게임 시작 가능 여부
  const canStartGame = room && room.status === 'waiting' &&
    room.currentPlayers >= room.minPlayers &&
    players.filter(p => p.status === 'ready' || p.isHost).length >= room.minPlayers

  // 게임 시작 상태 메시지
  const getGameStartMessage = () => {
    if (!room || room.status !== 'waiting') return null

    const readyCount = players.filter(p => p.status === 'ready' || p.isHost).length
    const nonHostReadyCount = players.filter(p => p.status === 'ready' && !p.isHost).length

    if (room.currentPlayers < room.minPlayers) {
      return {
        type: 'warning',
        message: `👥 최소 ${room.minPlayers}명의 플레이어가 필요합니다 (${room.currentPlayers}/${room.minPlayers})`,
        progress: (room.currentPlayers / room.minPlayers) * 100
      }
    }

    if (readyCount >= room.minPlayers) {
      return {
        type: 'success',
        message: '🎮 모든 플레이어가 준비되었습니다! 게임을 시작할 수 있습니다.',
        progress: 100
      }
    }

    return {
      type: 'info',
      message: `⏳ 플레이어 준비 중입니다... (${nonHostReadyCount}/${room.minPlayers - 1}명 준비 완료)`,
      progress: (readyCount / room.minPlayers) * 100
    }
  }

  const gameStatus = getGameStartMessage()

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
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleCopyInviteCode}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#4b5563'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#6b7280'
                }}
              >
                📋 초대 코드 복사
              </button>
              <button
                onClick={handleLeaveRoom}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444'
                }}
              >
                나가기
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '20px',
            marginBottom: '16px'
          }}>
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>방 코드</div>
              <div style={{
                color: '#1e293b',
                fontSize: '18px',
                fontWeight: '700',
                fontFamily: 'monospace',
                letterSpacing: '0.05em'
              }}>
                {room.code}
              </div>
            </div>
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>난이도</div>
              <div style={{
                color: '#1e293b',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  fontSize: '20px'
                }}>
                  {room.difficulty === 'easy' ? '😊' :
                   room.difficulty === 'normal' ? '🤔' : '😤'}
                </span>
                {room.difficulty === 'easy' ? '쉬움' :
                 room.difficulty === 'normal' ? '보통' : '어려움'}
              </div>
            </div>
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>참가 인원</div>
              <div style={{
                color: '#1e293b',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: room.currentPlayers >= room.minPlayers ? '#10b981' : '#f59e0b'
                }} />
                {room.currentPlayers} / {room.maxPlayers}명
                {room.currentPlayers < room.minPlayers && (
                  <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: '500' }}>
                    (최소 {room.minPlayers}명 필요)
                  </span>
                )}
              </div>
            </div>
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>방 상태</div>
              <div style={{
                color: room.status === 'waiting' ? '#059669' : '#3b82f6',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: room.status === 'waiting' ? '#10b981' : '#3b82f6',
                  animation: room.status === 'waiting' ? 'pulse 2s infinite' : 'none'
                }} />
                {room.status === 'waiting' ? '대기 중' :
                 room.status === 'playing' ? '게임 중' : '종료됨'}
              </div>
            </div>
          </div>

          {room.description && (
            <div style={{
              backgroundColor: '#fefce8',
              border: '1px solid #fde047',
              borderRadius: '8px',
              padding: '12px 16px',
              marginTop: '16px'
            }}>
              <div style={{ color: '#713f12', fontSize: '12px', marginBottom: '4px' }}>방 설명</div>
              <p style={{
                color: '#854d0e',
                fontSize: '14px',
                margin: 0,
                lineHeight: '1.5'
              }}>
                {room.description}
              </p>
            </div>
          )}

          {/* 게임 설정 정보 */}
          {room.gameSettings && (
            <div style={{
              display: 'flex',
              gap: '16px',
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#475569'
            }}>
              {room.gameSettings.roundTime && (
                <span>⏱️ 제한시간: {room.gameSettings.roundTime}초</span>
              )}
              {room.gameSettings.rounds && (
                <span>🎯 라운드: {room.gameSettings.rounds}회</span>
              )}
              {room.timeLimit && (
                <span>⏰ 전체 시간: {room.timeLimit}분</span>
              )}
            </div>
          )}
        </div>

        {/* 플레이어 목록 */}
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
            marginBottom: '20px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              👥 플레이어 목록
              <span style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: '400'
              }}>
                ({players.length} / {room.maxPlayers})
              </span>
            </h2>

            {/* 준비 상태 요약 */}
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              준비 완료: {players.filter(p => p.status === 'ready' || p.isHost).length}명
            </div>
          </div>

          <div style={{
            display: 'grid',
            gap: '12px'
          }}>
            {players.sort((a, b) => {
              // 방장을 맨 위로, 그다음은 준비 상태, 마지막으로 참가 순서
              if (a.isHost !== b.isHost) return b.isHost ? 1 : -1;
              if (a.status !== b.status) {
                const statusOrder = { 'ready': 0, 'not_ready': 1, 'playing': 2, 'eliminated': 3 };
                return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
              }
              return a.joinOrder - b.joinOrder;
            }).map((player) => (
              <div
                key={player.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: player.userId === user?.id ? '#eff6ff' : '#f9fafb',
                  borderRadius: '12px',
                  border: player.userId === user?.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: player.status === 'ready'
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  fontSize: '20px',
                  position: 'relative'
                }}>
                  {player.isHost ? '👑' : '👤'}
                  {player.status === 'ready' && (
                    <div style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      width: '16px',
                      height: '16px',
                      backgroundColor: '#10b981',
                      borderRadius: '50%',
                      border: '2px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px'
                    }}>
                      ✓
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px'
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
                        fontSize: '11px',
                        color: '#ffffff',
                        fontWeight: '700',
                        backgroundColor: '#8b5cf6',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        👑 방장
                      </span>
                    )}
                    {player.userId === user?.id && (
                      <span style={{
                        fontSize: '11px',
                        color: '#047857',
                        fontWeight: '600',
                        backgroundColor: '#d1fae5',
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        👤 나
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280'
                  }}>
                    참가 순서: {player.joinOrder + 1}번째
                  </div>
                </div>

                <div style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  backgroundColor: player.status === 'ready'
                    ? '#ecfdf5'
                    : player.status === 'playing'
                    ? '#dbeafe'
                    : player.status === 'eliminated'
                    ? '#fee2e2'
                    : '#fef3c7',
                  color: player.status === 'ready'
                    ? '#059669'
                    : player.status === 'playing'
                    ? '#1e40af'
                    : player.status === 'eliminated'
                    ? '#dc2626'
                    : '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: `1px solid ${
                    player.status === 'ready'
                      ? '#10b981'
                      : player.status === 'playing'
                      ? '#3b82f6'
                      : player.status === 'eliminated'
                      ? '#ef4444'
                      : '#f59e0b'
                  }`
                }}>
                  {player.status === 'ready' && '✅'}
                  {player.status === 'not_ready' && '⏳'}
                  {player.status === 'playing' && '🎮'}
                  {player.status === 'eliminated' && '❌'}
                  {player.status === 'ready' ? '준비 완료' :
                   player.status === 'playing' ? '게임 중' :
                   player.status === 'eliminated' ? '탈락' : '대기 중'}
                </div>
              </div>
            ))}

            {/* 빈 플레이어 슬롯 */}
            {Array.from({ length: Math.max(0, room.maxPlayers - players.length) }).map((_, index) => (
              <div
                key={`empty-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: '#fafafa',
                  borderRadius: '12px',
                  border: '2px dashed #e5e7eb',
                  opacity: 0.7,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px',
                  fontSize: '20px',
                  color: '#9ca3af'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: '2px dashed #9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}>
                    +
                  </div>
                </div>

                <div style={{
                  color: '#9ca3af',
                  fontSize: '16px',
                  fontWeight: '500'
                }}>
                  플레이어 대기 중...
                  <div style={{
                    fontSize: '13px',
                    marginTop: '2px',
                    fontWeight: '400'
                  }}>
                    {players.length + index + 1}번째 자리
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {!isHost && room.status === 'waiting' && (
            <button
              onClick={handleToggleReady}
              style={{
                padding: '16px 40px',
                fontSize: '16px',
                fontWeight: '700',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s',
                backgroundColor: isReady ? '#f59e0b' : '#10b981',
                color: 'white',
                boxShadow: isReady
                  ? '0 4px 14px rgba(245, 158, 11, 0.3)'
                  : '0 4px 14px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transform: 'scale(1)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = isReady ? '#d97706' : '#059669'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = isReady ? '#f59e0b' : '#10b981'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {isReady ? '⏸️ 준비 취소' : '✅ 준비하기'}
            </button>
          )}

          {isHost && room.status === 'waiting' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <button
                onClick={handleStartGame}
                disabled={!canStartGame}
                style={{
                  padding: '16px 40px',
                  fontSize: '16px',
                  fontWeight: '700',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: canStartGame ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s',
                  backgroundColor: canStartGame ? '#3b82f6' : '#9ca3af',
                  color: 'white',
                  opacity: canStartGame ? 1 : 0.6,
                  boxShadow: canStartGame
                    ? '0 4px 14px rgba(59, 130, 246, 0.3)'
                    : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transform: canStartGame ? 'scale(1)' : 'scale(0.95)'
                }}
                onMouseOver={(e) => {
                  if (canStartGame) {
                    e.currentTarget.style.backgroundColor = '#2563eb'
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }
                }}
                onMouseOut={(e) => {
                  if (canStartGame) {
                    e.currentTarget.style.backgroundColor = '#3b82f6'
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                {canStartGame ? '🎮 게임 시작' : '⏳ 대기 중'}
              </button>

              {!canStartGame && (
                <div style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  textAlign: 'center',
                  maxWidth: '300px',
                  lineHeight: '1.4'
                }}>
                  {room.currentPlayers < room.minPlayers
                    ? `👥 최소 ${room.minPlayers}명의 플레이어가 필요합니다`
                    : `✋ 모든 플레이어가 준비 상태여야 합니다 (${players.filter(p => p.status === 'ready').length}/${room.minPlayers - 1}명 준비 완료)`}
                </div>
              )}
            </div>
          )}

          {room.status === 'playing' && (
            <div style={{
              padding: '20px 32px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#3b82f6',
              backgroundColor: '#eff6ff',
              borderRadius: '12px',
              border: '2px solid #dbeafe',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                animation: 'pulse 2s infinite'
              }}>
                🎮
              </div>
              게임이 진행 중입니다...
            </div>
          )}

          {/* 게임 시작 가능 상태 알림 */}
          {canStartGame && isHost && room.status === 'waiting' && (
            <div style={{
              padding: '12px 20px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #10b981',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#065f46',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'slideInUp 0.3s ease-out'
            }}>
              ✅ 모든 플레이어가 준비되었습니다! 게임을 시작할 수 있습니다.
            </div>
          )}

          {/* 게임 상태 알림 바 */}
          {room.status === 'waiting' && gameStatus && (
            <div style={{
              backgroundColor: gameStatus.type === 'success' ? '#ecfdf5' :
                           gameStatus.type === 'warning' ? '#fffbeb' : '#eff6ff',
              border: `1px solid ${
                gameStatus.type === 'success' ? '#10b981' :
                gameStatus.type === 'warning' ? '#f59e0b' : '#3b82f6'
              }`,
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                fontSize: '24px',
                filter: 'hue-rotate(0deg) saturate(1.2)'
              }}>
                {gameStatus.type === 'success' ? '🎉' :
                 gameStatus.type === 'warning' ? '⚠️' : '⏱️'}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: gameStatus.type === 'success' ? '#065f46' :
                         gameStatus.type === 'warning' ? '#92400e' : '#1e40af',
                  marginBottom: '6px'
                }}>
                  {gameStatus.message}
                </div>

                {/* 진행 상태 바 */}
                <ProgressBar
                  value={gameStatus.progress}
                  max={100}
                  type={gameStatus.type as 'success' | 'warning' | 'info'}
                  size="medium"
                  animated={true}
                />
              </div>

              {gameStatus.type === 'success' && isHost && (
                <div style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  animation: 'pulse 2s infinite'
                }}>
                  시작 버튼을 눌러주세요!
                </div>
              )}
            </div>
          )}

          {/* 게임 시작 카운트다운 */}
          {isGameStarting && countdown !== null && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              backdropFilter: 'blur(4px)'
            }}>
              <div style={{
                textAlign: 'center',
                animation: 'countdownPulse 1s ease-out'
              }}>
                <div style={{
                  fontSize: '120px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textShadow: '0 0 40px rgba(59, 130, 246, 0.8)',
                  marginBottom: '20px',
                  animation: 'countdownScale 1s ease-out'
                }}>
                  {countdown > 0 ? countdown : '🎮'}
                </div>
                <div style={{
                  fontSize: '24px',
                  color: '#ffffff',
                  fontWeight: '500',
                  opacity: 0.9
                }}>
                  {countdown > 0 ? '게임 시작 전...' : '게임 시작!'}
                </div>
              </div>

              <style>{`
                @keyframes countdownPulse {
                  0% { transform: scale(0.8); opacity: 0; }
                  50% { transform: scale(1.1); }
                  100% { transform: scale(1); opacity: 1; }
                }

                @keyframes countdownScale {
                  0% { transform: scale(0.5); opacity: 0; }
                  50% { transform: scale(1.2); }
                  100% { transform: scale(1); opacity: 1; }
                }
              `}</style>
            </div>
          )}
        </div>
      </div>

      {/* 전역 알림 */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes slideInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}