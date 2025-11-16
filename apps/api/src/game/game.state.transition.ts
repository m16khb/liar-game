import { RoomStatus, GamePhase } from '../room/entities/room.entity';

/**
 * 게임 상태 전환 관리 클래스
 * 상태 전환 규칙을 캡슐화하고 검증 로직을 분리합니다.
 */
export class GameStateTransition {
  /**
   * 유효한 상태 전환 검증
   */
  static isValidStatusTransition(current: RoomStatus, target: RoomStatus): boolean {
    const validTransitions: Record<RoomStatus, RoomStatus[]> = {
      [RoomStatus.WAITING]: [RoomStatus.PLAYING],
      [RoomStatus.PLAYING]: [RoomStatus.FINISHED],
      [RoomStatus.FINISHED]: [],
    };

    return validTransitions[current]?.includes(target) || false;
  }

  /**
   * 유효한 단계 전환 검증
   */
  static isValidPhaseTransition(current: GamePhase, target: GamePhase): boolean {
    const validTransitions: Record<GamePhase, GamePhase[]> = {
      [GamePhase.LOBBY]: [GamePhase.DISCUSSION],
      [GamePhase.DISCUSSION]: [GamePhase.VOTING],
      [GamePhase.VOTING]: [GamePhase.RESULT],
      [GamePhase.RESULT]: [],
    };

    return validTransitions[current]?.includes(target) || false;
  }

  /**
   * 상태 업데이트 시 단계 자동 설정
   */
  static updatePhaseBasedOnStatus(status: RoomStatus): GamePhase {
    switch (status) {
      case RoomStatus.WAITING:
        return GamePhase.LOBBY;
      case RoomStatus.PLAYING:
        return GamePhase.DISCUSSION;
      case RoomStatus.FINISHED:
        return GamePhase.RESULT;
      default:
        return GamePhase.LOBBY;
    }
  }
}