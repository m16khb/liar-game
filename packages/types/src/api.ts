// @CODE:SETUP-001 | SPEC: .moai/specs/SPEC-SETUP-001/spec.md
import type { GameState, Player } from './game';

/**
 * 게임 생성 요청 DTO
 */
export interface CreateGameRequest {
  maxPlayers: number;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
}

/**
 * 게임 생성 응답 DTO
 */
export interface CreateGameResponse {
  roomId: string;
  state: GameState;
}

/**
 * 게임 참가 요청 DTO
 */
export interface JoinGameRequest {
  roomId: string;
  player: Player;
}
