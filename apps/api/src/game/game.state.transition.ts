import { GameStatus, GamePhase } from './entities/game-status.enum';

/**
 * 게임 상태 전환 관리 클래스
 * 상태 전환 규칙을 캡슐화하고 검증 로직을 분리합니다.
 */
export class GameStateTransition {
  /**
   * 유효한 상태 전환 검증
   */
  static isValidStatusTransition(current: GameStatus, target: GameStatus): boolean {
    const validTransitions: Record<GameStatus, GameStatus[]> = {
      [GameStatus.WAITING]: [GameStatus.PLAYING],
      [GameStatus.PLAYING]: [GameStatus.FINISHED],
      [GameStatus.FINISHED]: [],
      [GameStatus.CANCELLED]: [],
    };

    return validTransitions[current]?.includes(target) || false;
  }

  /**
   * 유효한 단계 전환 검증
   */
  static isValidPhaseTransition(current: GamePhase, target: GamePhase): boolean {
    const validTransitions: Record<GamePhase, GamePhase[]> = {
      [GamePhase.LOBBY]: [GamePhase.ASSIGNMENT],
      [GamePhase.ASSIGNMENT]: [GamePhase.DISCUSSION],
      [GamePhase.DISCUSSION]: [GamePhase.VOTING],
      [GamePhase.VOTING]: [GamePhase.RESULT],
      [GamePhase.RESULT]: [GamePhase.FINISHED],
      [GamePhase.FINISHED]: [],
    };

    return validTransitions[current]?.includes(target) || false;
  }

  /**
   * 상태 업데이트 시 단계 자동 설정
   */
  static updatePhaseBasedOnStatus(status: GameStatus): GamePhase {
    switch (status) {
      case GameStatus.WAITING:
        return GamePhase.LOBBY;
      case GameStatus.PLAYING:
        return GamePhase.ASSIGNMENT;
      case GameStatus.FINISHED:
        return GamePhase.FINISHED;
      case GameStatus.CANCELLED:
        return GamePhase.LOBBY;
      default:
        return GamePhase.LOBBY;
    }
  }
}