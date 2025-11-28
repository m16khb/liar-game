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

  nextTurn(): void;
  skipTurn(userId: number): void;
  getCurrentPlayer(): number;
  getRemainingTime(): number;
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
   * @returns 턴 매니저
   */
  createTurnManager(
    roomId: number,
    playerIds: number[],
    turnDuration: number = 30,
  ): TurnManager {
    const turnOrder = this.generateTurnOrder(playerIds);

    const manager: TurnManager = {
      roomId,
      turnOrder,
      currentTurnIndex: 0,
      turnDuration,
      startedAt: new Date(),

      nextTurn() {
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
        this.startedAt = new Date(); // 새로운 턴의 시작 시간 업데이트
      },

      skipTurn(userId: number) {
        this.nextTurn();
      },

      getCurrentPlayer() {
        return this.turnOrder[this.currentTurnIndex];
      },

      getRemainingTime() {
        const elapsed = (Date.now() - this.startedAt.getTime()) / 1000;
        const remaining = this.turnDuration - elapsed;
        return Math.max(0, remaining);
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
