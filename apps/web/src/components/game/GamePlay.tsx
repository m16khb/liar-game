import React, { useEffect, useState } from 'react';
import { useGamePlay, GamePlayState } from '@/hooks/useGamePlay';
import { useGameTimer } from '@/hooks/useGameTimer';
import { DiscussionPhase } from './DiscussionPhase';
import { VotingPhase } from './VotingPhase';
import { ResultPhase } from './ResultPhase';

interface GamePlayProps {
  roomId: number;
  userId: number;
  userNickname: string;
  onGameEnd?: () => void;
}

/**
 * 게임 진행 메인 컴포넌트
 * 토론, 투표, 결과 단계를 관리합니다
 */
export function GamePlay({
  roomId,
  userId,
  userNickname,
  onGameEnd,
}: GamePlayProps) {
  console.log('[GamePlay] 컴포넌트 렌더링', { roomId, userId, userNickname })

  const { gameState, updateGameState, addSpeech, isCurrentTurn } = useGamePlay();
  const [userRole, setUserRole] = useState<'LIAR' | 'CIVILIAN' | null>(null);
  const [keyword, setKeyword] = useState<{ word: string; category: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('[GamePlay] gameState:', gameState)
  console.log('[GamePlay] isLoading:', isLoading)

  const { remainingTime, progress, handleTimerUpdate, formatTime } = useGameTimer(
    gameState?.phase || '',
  );

  /**
   * 게임 시작 이벤트 처리
   */
  useEffect(() => {
    console.log('[GamePlay] useEffect 실행 - roomId:', roomId)

    // TODO: WebSocket 이벤트 리스너 설정
    // 임시: 테스트용 초기 gameState 설정
    console.log('[GamePlay] 임시 gameState 초기화')
    updateGameState({
      phase: 'DISCUSSION',
      currentTurn: userId,
      turnOrder: [userId],
      players: [{
        id: userId,
        nickname: userNickname,
        status: 'ACTIVE' as const
      }],
      speeches: []
    });

    console.log('[GamePlay] 로딩 완료로 설정')
    setIsLoading(false);
  }, [roomId, userId, userNickname, updateGameState]);

  /**
   * 역할 할당 이벤트 처리
   */
  useEffect(() => {
    // TODO: WebSocket 이벤트 리스너 설정
    // 임시: 테스트용 역할 설정
    console.log('[GamePlay] 임시 역할 설정: CIVILIAN')
    setUserRole('CIVILIAN');
    setKeyword({ word: '사과', category: '과일' });
  }, [userId]);

  /**
   * 발언 이벤트 처리
   */
  useEffect(() => {
    // TODO: WebSocket 이벤트 리스너 설정
    // socket.on('speech-submitted', (event: SpeechSubmittedEvent) => {
    //   addSpeech(event.userId, event.nickname, event.content);
    // });
  }, [addSpeech]);

  if (isLoading) {
    console.log('[GamePlay] 로딩 중 화면 표시')
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">게임 로딩 중...</div>;
  }

  if (!gameState) {
    console.log('[GamePlay] gameState 없음 - 에러 화면 표시')
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">게임 상태 로드 실패</div>;
  }

  console.log('[GamePlay] 메인 렌더링 시작')

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col">
      {/* 헤더: 게임 정보 */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">게임 진행 중</h1>
              <p className="text-sm text-gray-400">방 #{roomId}</p>
            </div>
          </div>

          {/* 역할 및 키워드 표시 */}
          {userRole && keyword && (
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-400">당신의 역할</p>
                <p className={`text-lg font-bold ${userRole === 'LIAR' ? 'text-red-500' : 'text-blue-500'}`}>
                  {userRole === 'LIAR' ? '라이어' : '시민'}
                </p>
              </div>
              <div className="border-l border-gray-600 pl-6">
                <p className="text-xs text-gray-400">카테고리</p>
                <p className="text-lg font-bold">{keyword.category}</p>
                {userRole === 'CIVILIAN' && (
                  <>
                    <p className="text-xs text-gray-400 mt-2">키워드</p>
                    <p className="text-lg font-bold text-green-500">{keyword.word}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-auto">
        {gameState.phase === 'DISCUSSION' && (
          <DiscussionPhase
            gameState={gameState}
            userId={userId}
            userNickname={userNickname}
            userRole={userRole}
            remainingTime={remainingTime}
            progress={progress}
            formatTime={formatTime}
            isCurrentTurn={isCurrentTurn(userId)}
            onSpeech={(content) => addSpeech(userId, userNickname, content)}
          />
        )}

        {gameState.phase === 'VOTING' && (
          <VotingPhase
            gameState={gameState}
            userId={userId}
            remainingTime={remainingTime}
            progress={progress}
            formatTime={formatTime}
          />
        )}

        {gameState.phase === 'RESULT' && (
          <ResultPhase
            gameState={gameState}
            userId={userId}
            userRole={userRole}
            onGameEnd={onGameEnd}
          />
        )}
      </div>
    </div>
  );
}
