import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '@/hooks/useSocket'
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

export default function GameRoom() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket, isConnected, isConnecting, error: socketError, connect, disconnect } = useSocket()
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLeaving, setIsLeaving] = useState(false)

  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    targetPlayer: Player | null
  }>({
    visible: false,
    x: 0,
    y: 0,
    targetPlayer: null
  })

  // 소켓 연결 및 이벤트 처리
  useEffect(() => {
    if (!roomCode) {
      navigate('/rooms')
      return
    }

    // 소켓 연결 시작
    connect(roomCode)

    // 컴포넌트 unmount 시 연결 정리
    return () => {
      disconnect()
    }
  }, [roomCode, navigate, connect, disconnect])

  // 소켓 이벤트 리스너 설정
  useEffect(() => {
    if (!socket) return

    // 방 참가 성공
    const handleRoomJoined = (data: any) => {
      console.log('✅ 방 참가 성공:', data)
      console.log('✅ 플레이어 상세:', data.players?.map((p: any) => ({ userId: p.userId, isHost: p.isHost, email: p.user?.email })))
      setRoom(data.room)
      setPlayers(data.players || [])
    }

    // 방 정보 업데이트
    const handleRoomUpdated = (data: any) => {
      console.log('📝 방 정보 업데이트:', data)
      console.log('📝 플레이어 상세:', data.players?.map((p: any) => ({ userId: p.userId, isHost: p.isHost, email: p.user?.email })))
      setRoom(data.room)
      setPlayers(data.players || [])
      console.log('🔍 setPlayers 후 상태:', data.players?.map((p: any) => ({ userId: p.userId, isHost: p.isHost, email: p.user?.email })))
    }

    // 플레이어 준비 상태 변경
    const handlePlayerReadyChanged = (data: any) => {
      console.log('🔄 플레이어 준비 상태 변경:', data)
      setPlayers(data.players || [])
      // 현재 유저의 준비 상태 업데이트
      const myPlayer = data.players?.find((p: any) =>
        p.user?.email === user?.email || p.userId === user?.id
      )
      if (myPlayer) {
        setIsReady(myPlayer.status === 'ready')
      }
    }

    // 게임 시작
    const handleGameStarted = () => {
      console.log('🎮 게임 시작')
      navigate(`/game/${roomCode}/play`)
    }

    // 방장 위임
    const handleHostTransferred = (data: any) => {
      console.log('👑 방장 위임:', data)
      setPlayers(data.players || [])
    }

    // 방 삭제
    const handleRoomDeleted = (data: any) => {
      console.log('❌ 방 삭제:', data)
      alert(data.message || '방이 삭제되었습니다.')
      navigate('/rooms')
    }

    // 이벤트 리스너 등록
    socket.on('room-joined', handleRoomJoined)
    socket.on('room-updated', handleRoomUpdated)
    socket.on('player-ready-changed', handlePlayerReadyChanged)
    socket.on('game-started', handleGameStarted)
    socket.on('host-transferred', handleHostTransferred)
    socket.on('room-deleted', handleRoomDeleted)

    // cleanup
    return () => {
      socket.off('room-joined', handleRoomJoined)
      socket.off('room-updated', handleRoomUpdated)
      socket.off('player-ready-changed', handlePlayerReadyChanged)
      socket.off('game-started', handleGameStarted)
      socket.off('host-transferred', handleHostTransferred)
      socket.off('room-deleted', handleRoomDeleted)
    }
  }, [socket, user?.id, navigate, roomCode])

  // 에러 상태 동기화
  useEffect(() => {
    if (socketError) {
      setError(socketError)
    }
  }, [socketError])

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
    if (socket && !isLeaving) {
      setIsLeaving(true)
      socket.emit('leave-room')
      // 0.5초 후에 방 목록으로 이동
      setTimeout(() => {
        navigate('/rooms', { replace: true })
      }, 500)
    }
  }, [socket, navigate, isLeaving])

  // 컨텍스트 메뉴 핸들러
  const handleContextMenu = useCallback((e: React.MouseEvent, player: Player) => {
    e.preventDefault()
    const isHost = players.some(p => p.userId === user?.id && p.isHost)

    // 방장이 자신이 아니고, 대상이 자신이 아니고, 방이 대기 상태일 때만 메뉴 표시
    if (isHost && player.userId !== user?.id && room?.status === 'waiting') {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        targetPlayer: player
      })
    }
  }, [players, user?.id, room?.status])

  // 컨텍스트 메뉴 닫기
  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }))
  }, [])

  // 방장 위임
  const handleTransferHost = useCallback((targetPlayer: Player) => {
    if (socket && targetPlayer) {
      socket.emit('transfer-host', { targetUserId: targetPlayer.userId })
      closeContextMenu()
    }
  }, [socket, closeContextMenu])

  // 전역 클릭 시 컨텍스트 메뉴 닫기
  useEffect(() => {
    const handleClick = () => closeContextMenu()
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [closeContextMenu])

  // 현재 유저가 방장인지 확인 - 이메일로 비교
  const isHost = players.some(p => p.user?.email === user?.email && p.isHost)

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
    // 방 정보가 아직 로드되지 않은 경우
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
            방 정보를 불러오는 중...
          </p>
        </div>
      </div>
    )
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
              disabled={isLeaving}
              style={{
                padding: '8px 16px',
                backgroundColor: isLeaving ? '#9ca3af' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: isLeaving ? 'not-allowed' : 'pointer',
                opacity: isLeaving ? 0.7 : 1
              }}
            >
              {isLeaving ? '나가는 중...' : '나가기'}
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
                  border: player.userId === user?.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  cursor: 'pointer'
                }}
                onContextMenu={(e) => handleContextMenu(e, player)}
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
                      {player.user?.email || `플레이어 ${player.userId}`}
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

      {/* 컨텍스트 메뉴 */}
      {contextMenu.visible && contextMenu.targetPlayer && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            padding: '8px 0',
            minWidth: '180px',
            zIndex: 1000
          }}
        >
          <button
            onClick={() => handleTransferHost(contextMenu.targetPlayer!)}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              textAlign: 'left',
              fontSize: '14px',
              color: '#1f2937',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span>👑</span>
            <span>방장 위임</span>
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#6b7280' }}>
              {contextMenu.targetPlayer.nickname || `플레이어 ${contextMenu.targetPlayer.userId}`}
            </span>
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}