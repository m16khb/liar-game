import { Injectable } from '@nestjs/common';

/**
 * 턴 정보
 */
export interface TurnManager {
  roomId: number;
  turnOrder: number[];
  currentTurnIndex: number;
  turnDuration: number; // 초 단위
  startedAt: Date;
  totalRounds: number; // 총 바퀴 수
  currentRound: number; // 현재 바퀴

  nextTurn(): boolean; // 모든 턴이 끝났으면 false 반환
  skipTurn(userId: number): boolean;
  getCurrentPlayer(): number;
  getRemainingTime(): number;
  isAllTurnsCompleted(): boolean;
  getTotalTurns(): number;
  getCurrentTurnNumber(): number;
}

/**
 * 턴 관리 서비스
 * 게임의 토론 단계에서 플레이어들의 턴을 관리합니다.
 * 턴 순서를 무작위로 생성하고, 턴 전환을 처리합니다.
 */
@Injectable()
export class TurnManagerService {
  private turnManagers: Map<number, TurnManager> = new Map();

  /**
   * 플레이어들의 턴 순서를 무작위로 생성합니다
   * @param playerIds 플레이어 ID 배열
   * @returns 무작위 턴 순서
   */
  generateTurnOrder(playerIds: number[]): number[] {
    // Fisher-Yates 셔플 알고리즘
    const shuffled = [...playerIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * 턴 매니저를 생성합니다
   * @param roomId 방 ID
   * @param playerIds 플레이어 ID 배열
   * @param turnDuration 각 턴의 지속 시간 (초, 기본값: 30)
   * @param totalRounds 총 바퀴 수 (기본값: 1)
   * @returns 턴 매니저
   */
  createTurnManager(
    roomId: number,
    playerIds: number[],
    turnDuration: number = 30,
    totalRounds: number = 1,
  ): TurnManager {
    const turnOrder = this.generateTurnOrder(playerIds);

    const manager: TurnManager = {
      roomId,
      turnOrder,
      currentTurnIndex: 0,
      turnDuration,
      startedAt: new Date(),
      totalRounds,
      currentRound: 1,

      nextTurn() {
        // 다음 인덱스 계산
        const nextIndex = this.currentTurnIndex + 1;

        // 한 바퀴 완료 시 다음 라운드로
        if (nextIndex >= this.turnOrder.length) {
          this.currentRound++;
          this.currentTurnIndex = 0;
        } else {
          this.currentTurnIndex = nextIndex;
        }

        this.startedAt = new Date();

        // 모든 라운드가 끝났는지 확인
        return !this.isAllTurnsCompleted();
      },

      skipTurn(userId: number) {
        return this.nextTurn();
      },

      getCurrentPlayer() {
        return this.turnOrder[this.currentTurnIndex];
      },

      getRemainingTime() {
        const elapsed = (Date.now() - this.startedAt.getTime()) / 1000;
        const remaining = this.turnDuration - elapsed;
        return Math.max(0, remaining);
      },

      isAllTurnsCompleted() {
        return this.currentRound > this.totalRounds;
      },

      getTotalTurns() {
        return this.turnOrder.length * this.totalRounds;
      },

      getCurrentTurnNumber() {
        return (this.currentRound - 1) * this.turnOrder.length + this.currentTurnIndex + 1;
      },
    };

    this.turnManagers.set(roomId, manager);
    return manager;
  }

  /**
   * 저장된 턴 매니저를 조회합니다
   * @param roomId 방 ID
   * @returns 턴 매니저 또는 null
   */
  getTurnManager(roomId: number): TurnManager | null {
    return this.turnManagers.get(roomId) ?? null;
  }

  /**
   * 턴 매니저를 삭제합니다
   * @param roomId 방 ID
   */
  deleteTurnManager(roomId: number): void {
    this.turnManagers.delete(roomId);
  }

  /**
   * 모든 턴 매니저를 조회합니다
   * @returns 턴 매니저 배열
   */
  getAllTurnManagers(): TurnManager[] {
    return Array.from(this.turnManagers.values());
  }
}
