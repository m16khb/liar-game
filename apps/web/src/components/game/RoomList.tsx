// 게임방 목록 컴포넌트
// 대기중인 방 목록 표시 및 방 참가 기능

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfileModal from '../user/ProfileModal'
import JoinRoomByCode from './JoinRoomByCode'
import { useAuth } from '../../hooks/useAuth'
import { useRooms } from '../../hooks/useRooms'
import { RoomResponse, CreateRoomRequest, GameDifficulty } from '@/types/api'

// 윈도우 크기를 추적하는 커스텀 훅
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowSize
}

interface RoomListProps {
  isAuthenticated?: boolean
  onRoomJoin?: (roomCode: string) => void
  onRoomCreate?: () => void
}

export default function RoomList({
  onRoomJoin,
  onRoomCreate
}: Omit<RoomListProps, 'isAuthenticated'>) {
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showJoinByCodeModal, setShowJoinByCodeModal] = useState(false)
  const navigate = useNavigate()
  const { width } = useWindowSize()
  const { isAuthenticated, user } = useAuth() // 직접 인증 상태 구독

  // useRooms 훅을 사용하여 방 목록 관리
  const { rooms, loading, error, setError: setRoomsError, refresh, createRoom: createNewRoom } = useRooms('waiting')

  // 반응형 breakpoint
  const isMobile = width < 768
  const isTablet = width >= 768 && width < 1024
  const isDesktop = width >= 1024

  // 에러 상태 통합
  const handleError = (message: string) => {
    setRoomsError(message)
  }

  // 방 참가
  const handleJoinRoom = async (room: RoomResponse) => {
    // 로그인 체크
    if (!isAuthenticated) {
      // 로그인 페이지로 이동, 참가하려는 방 정보 저장
      sessionStorage.setItem('redirectAfterLogin', `/game/${room.code}`)
      navigate('/login')
      return
    }

    if (room.currentPlayers >= room.maxPlayers) {
      handleError('이 방은 정원이 가득 찼습니다.')
      return
    }

    try {
      setJoiningRoomId(room.id)

      // TODO: 향후 방 참가 API 구현
      // const response = await fetch(`/api/rooms/${room.id}/join`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' }
      // })

      // 임시 지연 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 500))

      // 방 참가 성공
      onRoomJoin?.(room.code)
      navigate(`/game/${room.code}`)
    } catch (err) {
      console.error('방 참가 실패:', err)
      handleError('방 참가에 실패했습니다.')
    } finally {
      setJoiningRoomId(null)
    }
  }

  // 새 방 생성
  const handleCreateRoom = async () => {
    // 로그인 체크
    if (!isAuthenticated) {
      // 로그인 페이지로 이동, 방 생성 의도 저장
      sessionStorage.setItem('redirectAfterLogin', '/rooms?action=create')
      navigate('/login')
      return
    }

    try {
      setCreatingRoom(true)

      // 실제 API 호출
      const createRoomData: CreateRoomRequest = {
        title: `${user?.nickname || '플레이어'}의 방`,
        maxPlayers: 8,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
        description: '새로 생성된 방입니다. 참가해주세요!',
      };

      const newRoom = await createNewRoom(createRoomData);

      // 방 생성 성공
      onRoomCreate?.()
      navigate(`/game/${newRoom.code}`)
    } catch (err) {
      console.error('방 생성 실패:', err)
      const errorMessage = err instanceof Error ? err.message : '방 생성에 실패했습니다.'
      handleError(errorMessage)
    } finally {
      setCreatingRoom(false)
    }
  }


  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 헤더 */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '24px' : '0'
        }}>
          {/* 제목과 설명 */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: isMobile ? '28px' : isTablet ? '32px' : '36px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '8px',
              lineHeight: '1.2'
            }}>
              라이어 게임
            </h1>
            <p style={{
              fontSize: isMobile ? '16px' : '18px',
              color: '#6b7280',
              marginBottom: isMobile ? '24px' : '32px',
              lineHeight: '1.5'
            }}>
              다른 플레이어들과 함께 재미있는 라이어 게임을 즐겨보세요!
            </p>
          </div>

          {/* 로그인 상태와 버튼 */}
          <div style={{
            textAlign: 'right',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center',
            minHeight: isMobile ? 'auto' : '85px'
          }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <button
                  onClick={() => setShowProfileModal(true)}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: isMobile ? '8px 16px' : '10px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>👤</span>
                  마이페이지
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: isMobile ? '8px 16px' : '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6'
                }}
              >
                로그인
              </button>
            )}
          </div>
        </header>

        {/* 새 방 생성 및 코드 참가 버튼 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <button
            onClick={handleCreateRoom}
            disabled={creatingRoom}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: isMobile ? '12px 24px' : '14px 28px',
              borderRadius: '8px',
              border: 'none',
              fontSize: isMobile ? '15px' : '16px',
              fontWeight: '600',
              cursor: creatingRoom ? 'not-allowed' : 'pointer',
              opacity: creatingRoom ? '0.7' : '1',
              transition: 'all 0.2s',
              width: isMobile ? '100%' : 'auto',
              maxWidth: isMobile ? '280px' : 'none'
            }}
            onMouseOver={(e) => {
              if (!creatingRoom) {
                e.currentTarget.style.backgroundColor = '#059669'
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#10b981'
            }}
          >
            {creatingRoom ? '방 생성 중...' : '새 방 생성'}
          </button>

          <button
            onClick={() => setShowJoinByCodeModal(true)}
            style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              padding: isMobile ? '12px 24px' : '14px 28px',
              borderRadius: '8px',
              border: 'none',
              fontSize: isMobile ? '15px' : '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              width: isMobile ? '100%' : 'auto',
              maxWidth: isMobile ? '280px' : 'none'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#7c3aed'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#8b5cf6'
            }}
          >
            코드로 참가
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: isMobile ? '12px 16px' : '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #fecaca',
            fontSize: isMobile ? '14px' : '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ flex: 1 }}>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                fontSize: isMobile ? '20px' : '18px',
                cursor: 'pointer',
                padding: '0',
                marginLeft: '16px',
                lineHeight: '1',
                flexShrink: 0
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* 방 목록 */}
        <main>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0
            }}>
              대기중인 방 ({rooms.length})
            </h2>

            {/* 새로고침 아이콘 */}
            <button
              onClick={refresh}
              style={{
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                color: '#3b82f6',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
                e.currentTarget.style.transform = 'rotate(180deg)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
                e.currentTarget.style.transform = 'rotate(0deg)'
              }}
              title="새로고침"
            >
              🔄
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: isMobile ? '32px' : '48px' }}>
              <div style={{
                width: isMobile ? '32px' : '40px',
                height: isMobile ? '32px' : '40px',
                border: '4px solid #e5e7eb',
                borderTop: '4px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }} />
              <p style={{
                color: '#6b7280',
                fontSize: isMobile ? '14px' : '16px'
              }}>
                방 목록을 불러오는 중...
              </p>
            </div>
          ) : rooms.length === 0 ? (
            <div style={{
              backgroundColor: '#ffffff',
              padding: isMobile ? '32px 24px' : '48px',
              borderRadius: '8px',
              textAlign: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                fontSize: isMobile ? '40px' : '48px',
                marginBottom: '16px'
              }}>
                🎮
              </div>
              <h3 style={{
                fontSize: isMobile ? '18px' : '20px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '8px'
              }}>
                대기중인 방이 없습니다
              </h3>
              <p style={{
                color: '#6b7280',
                fontSize: isMobile ? '14px' : '16px',
                marginBottom: '24px',
                lineHeight: '1.5'
              }}>
                새 방을 생성하거나 잠시 후 다시 확인해주세요.
              </p>
              <button
                onClick={refresh}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  width: isMobile ? '44px' : '48px',
                  height: isMobile ? '44px' : '48px',
                  borderRadius: '50%',
                  border: 'none',
                  fontSize: isMobile ? '18px' : '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb'
                  e.currentTarget.style.transform = 'rotate(180deg)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6'
                  e.currentTarget.style.transform = 'rotate(0deg)'
                }}
                title="새로고침"
              >
                🔄
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: isMobile ? '12px' : '16px',
              gridTemplateColumns: width < 640 ? '1fr' :
                                   isTablet ? 'repeat(2, 1fr)' :
                                   'repeat(auto-fill, minmax(320px, 1fr))'
            }}>
              {rooms.map((room) => (
                <div
                  key={room.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: isMobile ? '16px' : '24px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {/* 방 헤더 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: isMobile ? '12px' : '16px'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontSize: isMobile ? '16px' : '18px',
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '4px',
                        wordBreak: 'break-word'
                      }}>
                        {room.title}
                      </h3>
                      <p style={{
                        fontSize: isMobile ? '13px' : '14px',
                        color: '#6b7280',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        방 코드: {room.code} | 방장: {room.host?.nickname || '알 수 없음'}
                      </p>
                    </div>
                  </div>

                  {/* 방 정보 */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: isMobile ? '16px' : '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: isMobile ? '28px' : '32px',
                        height: isMobile ? '28px' : '32px',
                        borderRadius: '50%',
                        backgroundColor: '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMobile ? '13px' : '14px',
                        fontWeight: '600',
                        color: '#4b5563'
                      }}>
                        {room.currentPlayers}
                      </div>
                      <span style={{
                        fontSize: isMobile ? '13px' : '14px',
                        color: '#6b7280'
                      }}>
                        / {room.maxPlayers}명
                      </span>
                    </div>

                    {/* 플레이어 상태 바 */}
                    <div style={{
                      width: isMobile ? '60px' : '80px',
                      height: '8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          width: `${(room.currentPlayers / room.maxPlayers) * 100}%`,
                          height: '100%',
                          backgroundColor: room.currentPlayers >= room.maxPlayers ? '#ef4444' : '#10b981',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  </div>

                  {/* 참가 버튼 */}
                  <button
                    onClick={() => handleJoinRoom(room)}
                    disabled={joiningRoomId === room.id || room.currentPlayers >= room.maxPlayers}
                    style={{
                      width: '100%',
                      backgroundColor: room.currentPlayers >= room.maxPlayers ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      padding: isMobile ? '10px 14px' : '10px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: isMobile ? '14px' : '14px',
                      fontWeight: '500',
                      cursor: (joiningRoomId === room.id || room.currentPlayers >= room.maxPlayers) ? 'not-allowed' : 'pointer',
                      opacity: (joiningRoomId === room.id || room.currentPlayers >= room.maxPlayers) ? '0.7' : '1',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (joiningRoomId !== room.id && room.currentPlayers < room.maxPlayers) {
                        e.currentTarget.style.backgroundColor = '#2563eb'
                      }
                    }}
                    onMouseOut={(e) => {
                      if (room.currentPlayers >= room.maxPlayers) {
                        e.currentTarget.style.backgroundColor = '#9ca3af'
                      } else {
                        e.currentTarget.style.backgroundColor = '#3b82f6'
                      }
                    }}
                  >
                    {joiningRoomId === room.id ? '참가 중...' :
                     room.currentPlayers >= room.maxPlayers ? '정원 초과' :
                     '참가하기'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>

        </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* 마이페이지 모달 */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* 코드로 참가 모달 */}
      {showJoinByCodeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowJoinByCodeModal(false);
          }
        }}
        >
          <JoinRoomByCode
            onClose={() => setShowJoinByCodeModal(false)}
          />
        </div>
      )}
    </div>
  )
}