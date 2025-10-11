// @CODE:SETUP-001 | SPEC: .moai/specs/SPEC-SETUP-001/spec.md
import type { Player, GameState, VoteResult } from './game';

/**
 * 서버에서 클라이언트로 전송하는 이벤트 타입
 */
export interface ServerToClientEvents {
  playerJoined: (player: Player) => void;
  gameStart: (state: GameState) => void;
  gameUpdate: (state: GameState) => void;
  gameEnd: (result: VoteResult) => void;
}

/**
 * 클라이언트에서 서버로 전송하는 이벤트 타입
 */
export interface ClientToServerEvents {
  joinRoom: (data: { roomId: string; player: Player }) => void;
  vote: (data: { targetPlayerId: string }) => void;
  guessKeyword: (keyword: string) => void;
}
