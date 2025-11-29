import { useState, useCallback } from 'react';

/**
 * 게임 진행 상태 인터페이스
 */
export interface GamePlayState {
  phase: 'DISCUSSION' | 'VOTING' | 'LIAR_GUESS' | 'RESULT';
  currentTurn: number | null;
  turnOrder: number[];
  totalRounds: number; // 총 바퀴 수
  currentRound: number; // 현재 바퀴
  totalTurns: number; // 총 턴 수
  currentTurnNumber: number; // 현재 턴 번호
  players: {
    id: number;
    nickname: string;
    role?: 'LIAR' | 'CIVILIAN';
    status: 'ACTIVE' | 'DISCONNECTED';
    score?: number; // 플레이어 점수
  }[];
  speeches: {
    userId: number;
    nickname: string;
    content: string;
    timestamp: Date;
  }[];
  keyword?: {
    word: string;
    category: string;
  };
  votes?: {
    voterId: number;
    voteStatus: 'VOTED' | 'PENDING';
  }[];
  // 라이어 키워드 맞추기 관련
  liarGuess?: {
    liarId: number;
    category: string;
    timeLimit: number;
  };
  // 게임 결과 관련
  result?: {
    winner: 'LIAR' | 'CIVILIAN';
    liarId: number;
    liarCaughtByVote: boolean;
    liarGuessedKeyword: boolean;
    keyword?: { word: string; category: string };
    voteResults: { targetId: number; nickname: string; voteCount: number }[];
  };
  roleInfo?: { userId: number; nickname: string; role: string }[];
  scoreChanges?: {
    userId: number;
    nickname: string;
    previousScore: number;
    scoreChange: number;
    newScore: number;
    reason: string;
  }[];
}

/**
 * 게임 진행 훅
 * 게임의 현재 단계 및 상태를 관리합니다
 */
export function useGamePlay() {
  const [gameState, setGameState] = useState<GamePlayState | null>(null);

  /**
   * 게임 상태 업데이트
   */
  const updateGameState = useCallback((newState: Partial<GamePlayState>) => {
    setGameState((prev) => {
      // prev가 null이면 newState를 GamePlayState로 변환하여 설정
      if (!prev) {
        return {
          phase: newState.phase || 'DISCUSSION',
          currentTurn: newState.currentTurn || null,
          turnOrder: newState.turnOrder || [],
          totalRounds: newState.totalRounds || 1,
          currentRound: newState.currentRound || 1,
          totalTurns: newState.totalTurns || 0,
          currentTurnNumber: newState.currentTurnNumber || 1,
          players: newState.players || [],
          speeches: newState.speeches || [],
          ...newState
        } as GamePlayState;
      }
      return { ...prev, ...newState };
    });
  }, []);

  /**
   * 발언 추가
   */
  const addSpeech = useCallback(
    (userId: number, nickname: string, content: string) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          speeches: [
            ...prev.speeches,
            {
              userId,
              nickname,
              content,
              timestamp: new Date(),
            },
          ],
        };
      });
    },
    [],
  );

  /**
   * 현재 턴 플레이어인지 확인
   */
  const isCurrentTurn = useCallback(
    (userId: number): boolean => {
      return gameState?.currentTurn === userId;
    },
    [gameState?.currentTurn],
  );

  /**
   * 게임 상태 초기화
   */
  const resetGamePlay = useCallback(() => {
    setGameState(null);
  }, []);

  return {
    gameState,
    updateGameState,
    addSpeech,
    isCurrentTurn,
    resetGamePlay,
  };
}
