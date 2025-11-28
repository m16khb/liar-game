// 게임 플레이 페이지 - 라우팅 래퍼
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { GamePlay } from './GamePlay'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorPage from '../common/ErrorPage'

export default function GamePlayPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [roomId, setRoomId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // TODO: roomCode로 room 정보 가져오기
    // 지금은 임시로 roomCode를 roomId로 사용
    console.log('[GamePlayPage] roomCode:', roomCode)
    console.log('[GamePlayPage] user:', user)
    console.log('[GamePlayPage] user.backendUserId:', user?.backendUserId)
    console.log('[GamePlayPage] user.nickname:', user?.nickname)

    if (!roomCode) {
      console.error('[GamePlayPage] roomCode 없음')
      setError('방 코드가 없습니다.')
      setIsLoading(false)
      return
    }

    if (!user) {
      console.error('[GamePlayPage] user 없음, 로그인 필요')
      setError('로그인이 필요합니다.')
      setIsLoading(false)
      return
    }

    if (!user.backendUserId) {
      console.error('[GamePlayPage] backendUserId 없음:', user)
      setError('사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.')
      setIsLoading(false)
      return
    }

    // 임시: roomId를 1로 설정 (실제로는 API 호출 필요)
    // TODO: API 호출하여 roomCode로 room 정보 가져오기
    console.log('[GamePlayPage] roomId 설정: 1 (임시)')
    setRoomId(1)
    setIsLoading(false)
  }, [roomCode, user])

  const handleGameEnd = () => {
    // 게임 종료 시 대기실로 복귀
    navigate(`/game/${roomCode}`)
  }

  if (isLoading) {
    return <LoadingSpinner message="게임 준비 중..." />
  }

  if (error) {
    return (
      <ErrorPage
        message={error}
        buttonText="방 목록으로"
        onButtonClick={() => navigate('/rooms')}
      />
    )
  }

  if (!roomId || !user?.backendUserId) {
    return (
      <ErrorPage
        message="게임 정보를 불러올 수 없습니다."
        buttonText="방 목록으로"
        onButtonClick={() => navigate('/rooms')}
      />
    )
  }

  // nickname이 없으면 email 사용
  const displayName = user?.nickname || user?.email || 'Guest'
  console.log('[GamePlayPage] displayName:', displayName)

  return (
    <GamePlay
      roomId={roomId}
      roomCode={roomCode}
      userId={user.backendUserId}
      userNickname={displayName}
      onGameEnd={handleGameEnd}
    />
  )
}
