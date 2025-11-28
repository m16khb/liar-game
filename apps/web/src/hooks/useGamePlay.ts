import { useState, useCallback } from 'react';

/**
 * 게임 진행 상태 인터페이스
 */
export interface GamePlayState {
  phase: 'DISCUSSION' | 'VOTING' | 'RESULT';
  currentTurn: number | null;
  turnOrder: number[];
  players: {
    id: number;
    nickname: string;
    role?: 'LIAR' | 'CIVILIAN';
    status: 'ACTIVE' | 'DISCONNECTED';
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
      if (!prev) return prev;
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
