import React, { useEffect, useState } from 'react';
import { useGamePlay, GamePlayState } from '@/hooks/useGamePlay';
import { useGameTimer } from '@/hooks/useGameTimer';
import { useSocket } from '@/hooks/useSocket';
import { DiscussionPhase } from './DiscussionPhase';
import { VotingPhase } from './VotingPhase';
import { ResultPhase } from './ResultPhase';

interface GamePlayProps {
  roomId: number;
  roomCode: string; // roomCode 추가
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
  roomCode,
  userId,
  userNickname,
  onGameEnd,
}: GamePlayProps) {
  console.log('[GamePlay] 컴포넌트 렌더링', { roomId, roomCode, userId, userNickname })

  const { socket } = useSocket();
  const { gameState, updateGameState, addSpeech, isCurrentTurn } = useGamePlay();
  const [userRole, setUserRole] = useState<'LIAR' | 'CIVILIAN' | null>(null);
  const [keyword, setKeyword] = useState<{ word: string; category: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('[GamePlay] socket:', socket)
  console.log('[GamePlay] gameState:', gameState)
  console.log('[GamePlay] isLoading:', isLoading)

  const { remainingTime, progress, handleTimerUpdate, formatTime } = useGameTimer(
    gameState?.phase || '',
  );

  /**
   * 게임 시작 이벤트 처리
   */
  useEffect(() => {
    if (!socket) {
      console.log('[GamePlay] socket이 없음')
      return;
    }

    console.log('[GamePlay] WebSocket 리스너 설정 시작')

    // game-started 이벤트 리스너
    const handleGameStarted = (data: { room: any; players: any[] }) => {
      console.log('[GamePlay] game-started 이벤트 수신:', data)

      // TODO: 백엔드에서 turnOrder, currentTurn을 보내지 않으면 임시로 설정
      updateGameState({
        phase: 'DISCUSSION',
        currentTurn: data.players[0]?.userId || userId,
        turnOrder: data.players.map(p => p.userId),
        players: data.players.map(p => ({
          id: p.userId,
          nickname: p.nickname,
          status: 'ACTIVE' as const
        })),
        speeches: []
      });

      setIsLoading(false);
    };

    socket.on('game-started', handleGameStarted);

    console.log('[GamePlay] 리스너 등록 완료')

    // 백엔드에서 이벤트를 이미 보냈을 경우 대비: 3초 후에도 gameState가 없으면 임시 설정
    const timeout = setTimeout(() => {
      if (!gameState) {
        console.log('[GamePlay] game-started 이벤트 없음 - 임시 게임 상태 설정')
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
        setIsLoading(false);
      }
    }, 3000);

    // 클린업
    return () => {
      console.log('[GamePlay] 리스너 제거')
      socket.off('game-started', handleGameStarted);
      clearTimeout(timeout);
    };
  }, [socket, userId, userNickname, gameState, updateGameState]);

  /**
   * 역할 할당 이벤트 처리
   */
  useEffect(() => {
    if (!socket) return;

    // role-assigned 이벤트 리스너
    const handleRoleAssigned = (data: { role: 'LIAR' | 'CIVILIAN'; keyword?: string; category?: string }) => {
      console.log('[GamePlay] role-assigned 이벤트 수신:', data)
      setUserRole(data.role);

      if (data.role === 'CIVILIAN' && data.keyword) {
        setKeyword({ word: data.keyword, category: data.category || '알 수 없음' });
      } else {
        setKeyword({ word: '???', category: data.category || '알 수 없음' });
      }
    };

    socket.on('role-assigned', handleRoleAssigned);

    // 백엔드에서 이벤트를 보내지 않을 경우 대비: 3초 후에도 역할이 없으면 임시 설정
    const timeout = setTimeout(() => {
      if (!userRole) {
        console.log('[GamePlay] 역할 이벤트 없음 - 임시 CIVILIAN 설정')
        setUserRole('CIVILIAN');
        setKeyword({ word: '사과', category: '과일' });
      }
    }, 3000);

    return () => {
      socket.off('role-assigned', handleRoleAssigned);
      clearTimeout(timeout);
    };
  }, [socket, userRole]);

  /**
   * 발언 이벤트 처리
   */
  useEffect(() => {
    if (!socket) return;

    // speech-submitted: 발언이 제출되었을 때
    const handleSpeechSubmitted = (data: { userId: number; nickname: string; content: string }) => {
      console.log('[GamePlay] speech-submitted 이벤트 수신:', data);
      addSpeech(data.userId, data.nickname, data.content);
    };

    socket.on('speech-submitted', handleSpeechSubmitted);

    return () => {
      socket.off('speech-submitted', handleSpeechSubmitted);
    };
  }, [socket, addSpeech]);

  /**
   * 턴 변경 이벤트 처리
   */
  useEffect(() => {
    if (!socket) return;

    const handleTurnChanged = (data: { currentPlayer: number; turnOrder: number[] }) => {
      console.log('[GamePlay] turn-changed 이벤트 수신:', data);
      updateGameState({
        currentTurn: data.currentPlayer,
        turnOrder: data.turnOrder,
      });
    };

    socket.on('turn-changed', handleTurnChanged);

    return () => {
      socket.off('turn-changed', handleTurnChanged);
    };
  }, [socket, updateGameState]);

  /**
   * 투표 제출 이벤트 처리
   */
  useEffect(() => {
    if (!socket) return;

    const handleVoteSubmitted = (data: { voterId: number; totalVotes: number; requiredVotes: number }) => {
      console.log('[GamePlay] vote-submitted 이벤트 수신:', data);
      // 투표 진행률 업데이트
      updateGameState({
        votes: Array.from({ length: data.totalVotes }, (_, i) => ({
          voterId: i + 1,
          voteStatus: 'VOTED' as const,
        })),
      });
    };

    socket.on('vote-submitted', handleVoteSubmitted);

    return () => {
      socket.off('vote-submitted', handleVoteSubmitted);
    };
  }, [socket, updateGameState]);

  /**
   * 게임 종료 이벤트 처리
   */
  useEffect(() => {
    if (!socket) return;

    const handleGameEnded = (data: {
      winner: 'LIAR' | 'CIVILIAN';
      mostVotedPlayerId: number;
      roles: { userId: number; nickname: string; role: string }[];
      voteResults: { userId: number; nickname: string; votes: number }[];
    }) => {
      console.log('[GamePlay] game-ended 이벤트 수신:', data);

      updateGameState({
        phase: 'RESULT',
      });

      // 10초 후 대기실로 복귀
      setTimeout(() => {
        if (onGameEnd) {
          onGameEnd();
        }
      }, 10000);
    };

    socket.on('game-ended', handleGameEnded);

    return () => {
      socket.off('game-ended', handleGameEnded);
    };
  }, [socket, updateGameState, onGameEnd]);

  if (isLoading) {
    console.log('[GamePlay] 로딩 중 화면 표시')
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-arcade-black text-white">
        <div className="text-center">
          <div className="font-pixel text-pixel-base md:text-pixel-lg text-arcade-cyan animate-blink mb-6">
            ▼ LOADING GAME ▼
          </div>
          <div className="w-32 h-32 mx-auto border-4 border-arcade-cyan relative overflow-hidden">
            <div className="absolute inset-0 bg-arcade-cyan/20 animate-float" />
          </div>
          <p className="font-retro text-retro-lg text-arcade-yellow mt-6">게임 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    console.log('[GamePlay] gameState 없음 - 에러 화면 표시')
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-arcade-black text-white">
        <div className="text-center">
          <div className="font-pixel text-pixel-base md:text-pixel-lg text-arcade-pink animate-blink mb-4">
            ✗ ERROR ✗
          </div>
          <p className="font-retro text-retro-lg text-arcade-yellow">게임 상태 로드 실패</p>
        </div>
      </div>
    );
  }

  console.log('[GamePlay] 메인 렌더링 시작')

  // 발언 제출 핸들러
  const handleSubmitSpeech = (content: string) => {
    if (!socket) {
      console.error('[GamePlay] socket이 없습니다');
      return;
    }

    console.log('[GamePlay] 발언 제출:', content);
    socket.emit('submit-speech', { content });
  };

  // 투표 제출 핸들러
  const handleSubmitVote = (targetUserId: number) => {
    if (!socket) {
      console.error('[GamePlay] socket이 없습니다');
      return;
    }

    console.log('[GamePlay] 투표 제출:', targetUserId);
    socket.emit('submit-vote', { targetUserId });
  };

  return (
    <div className="w-full h-screen bg-arcade-black text-white flex flex-col">
      {/* CRT Scanline Effect */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-10"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
        }}
      />

      {/* Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(#05d9e8 1px, transparent 1px), linear-gradient(90deg, #05d9e8 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* 헤더: 게임 정보 */}
      <div className="bg-arcade-dark border-b-4 border-arcade-cyan p-4 md:p-6 relative z-10 shadow-[0_0_30px_rgba(5,217,232,0.3)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-pixel text-pixel-base md:text-pixel-lg text-arcade-cyan">GAME IN PROGRESS</h1>
              <p className="font-retro text-retro-sm text-arcade-yellow mt-1">방 코드: {roomCode}</p>
            </div>
          </div>

          {/* 역할 및 키워드 표시 */}
          {userRole && keyword && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div>
                <p className="font-pixel text-pixel-xs text-arcade-cyan mb-1">YOUR ROLE</p>
                <p className={`font-retro text-retro-lg ${userRole === 'LIAR' ? 'text-arcade-pink' : 'text-arcade-green'}`}>
                  {userRole === 'LIAR' ? '라이어' : '시민'}
                </p>
              </div>
              <div className="border-l-0 sm:border-l-2 border-arcade-purple pl-0 sm:pl-6">
                <p className="font-pixel text-pixel-xs text-arcade-cyan mb-1">CATEGORY</p>
                <p className="font-retro text-retro-lg text-white">{keyword.category}</p>
                {userRole === 'CIVILIAN' && (
                  <>
                    <p className="font-pixel text-pixel-xs text-arcade-yellow mt-2 mb-1">KEYWORD</p>
                    <p className="font-retro text-retro-lg text-arcade-green">{keyword.word}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-auto relative z-10">
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
            onSpeech={handleSubmitSpeech}
          />
        )}

        {gameState.phase === 'VOTING' && (
          <VotingPhase
            gameState={gameState}
            userId={userId}
            remainingTime={remainingTime}
            progress={progress}
            formatTime={formatTime}
            onVote={handleSubmitVote}
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
