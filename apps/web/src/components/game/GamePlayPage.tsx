// 게임 플레이 페이지 - 라우팅 래퍼
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'
import { fetchRoomByCode } from '@/api/rooms'
import { GamePlay } from './GamePlay'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorPage from '../common/ErrorPage'

export default function GamePlayPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { connect } = useSocket()
  const [roomId, setRoomId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeGame = async () => {
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

      // 방 정보 조회
      try {
        console.log('[GamePlayPage] 방 정보 조회 시작:', roomCode)
        const response = await fetchRoomByCode(roomCode)

        if (response.error) {
          console.error('[GamePlayPage] 방 조회 실패:', response.error)
          setError(response.error.message || '방을 찾을 수 없습니다.')
          setIsLoading(false)
          return
        }

        if (!response.data) {
          console.error('[GamePlayPage] 방 데이터 없음')
          setError('방을 찾을 수 없습니다.')
          setIsLoading(false)
          return
        }

        console.log('[GamePlayPage] 방 정보 조회 완료:', response.data)

        // roomId를 숫자로 변환 (string일 수 있음)
        const id = typeof response.data.id === 'string'
          ? parseInt(response.data.id, 10)
          : response.data.id
        setRoomId(id)
      } catch (err) {
        console.error('[GamePlayPage] 방 조회 에러:', err)
        setError('방 정보를 불러오는데 실패했습니다.')
        setIsLoading(false)
        return
      }

      // 소켓 연결
      try {
        console.log('[GamePlayPage] 소켓 연결 시작:', roomCode)
        await connect(roomCode)
        console.log('[GamePlayPage] 소켓 연결 완료')
      } catch (err) {
        console.error('[GamePlayPage] 소켓 연결 실패:', err)
        setError('게임 서버 연결에 실패했습니다.')
        setIsLoading(false)
        return
      }

      setIsLoading(false)
    }

    initializeGame()
  }, [roomCode, user, connect])

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
