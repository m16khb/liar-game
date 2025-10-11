// @CODE:SETUP-001 | SPEC: .moai/specs/SPEC-SETUP-001/spec.md

/**
 * Socket.IO 이벤트 이름 상수
 */
export const SOCKET_EVENTS = {
  // Client → Server
  JOIN_ROOM: 'joinRoom',
  VOTE: 'vote',
  GUESS_KEYWORD: 'guessKeyword',

  // Server → Client
  PLAYER_JOINED: 'playerJoined',
  GAME_START: 'gameStart',
  GAME_UPDATE: 'gameUpdate',
  GAME_END: 'gameEnd',
} as const;
