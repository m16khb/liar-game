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
  const { gameState, updateGameState, addSpeech, isCurrentTurn } = useGamePlay();
  const [userRole, setUserRole] = useState<'LIAR' | 'CIVILIAN' | null>(null);
  const [keyword, setKeyword] = useState<{ word: string; category: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { remainingTime, progress, handleTimerUpdate, formatTime } = useGameTimer(
    gameState?.phase || '',
  );

  /**
   * 게임 시작 이벤트 처리
   */
  useEffect(() => {
    // TODO: WebSocket 이벤트 리스너 설정
    // socket.on('game-started', (event: GameStartedEvent) => {
    //   updateGameState({
    //     phase: 'DISCUSSION',
    //     currentTurn: event.currentTurn,
    //     turnOrder: event.turnOrder,
    //     players: event.players.map(p => ({
    //       id: p.id,
    //       nickname: p.nickname,
    //       status: 'ACTIVE' as const
    //     }))
    //   });
    // });

    setIsLoading(false);
  }, [roomId]);

  /**
   * 역할 할당 이벤트 처리
   */
  useEffect(() => {
    // TODO: WebSocket 이벤트 리스너 설정
    // socket.on('role-assigned', (event: RoleAssignedEvent) => {
    //   setUserRole(event.role);
    //   if (event.role === 'CIVILIAN') {
    //     setKeyword({ word: event.keyword!, category: event.category! });
    //   } else {
    //     setKeyword({ word: '???', category: event.category! });
    //   }
    // });
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
    return <div className="flex justify-center items-center h-screen">게임 로딩 중...</div>;
  }

  if (!gameState) {
    return <div className="flex justify-center items-center h-screen">게임 상태 로드 실패</div>;
  }

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
