// @CODE:SETUP-001 | SPEC: .moai/specs/SPEC-SETUP-001/spec.md

/**
 * 플레이어 역할 정의
 */
export enum PlayerRole {
  CITIZEN = 'CITIZEN',
  LIAR = 'LIAR'
}

/**
 * 플레이어 인터페이스
 */
export interface Player {
  id: string;
  username: string;
  role: PlayerRole;
  isReady: boolean;
  votedFor: string | null;
}

/**
 * 게임 상태 인터페이스
 */
export interface GameState {
  roomId: string;
  round: number;
  phase: 'WAITING' | 'DISCUSSION' | 'VOTING' | 'RESULT';
  keyword: string;
  players: Player[];
  timeRemaining: number;
}

/**
 * 투표 결과 인터페이스
 */
export interface VoteResult {
  targetPlayerId: string;
  voteCount: number;
  isLiarFound: boolean;
}
