// @CODE:SETUP-001 | SPEC: .moai/specs/SPEC-SETUP-001/spec.md

/**
 * 게임 규칙 상수
 */
export const GAME_RULES = {
  MIN_PLAYERS: 3,
  MAX_PLAYERS: 8,
  DISCUSSION_TIME: 180, // 3분
  VOTING_TIME: 60, // 1분
  LIAR_COUNT: 1,
} as const;

/**
 * 난이도별 설정
 */
export const DIFFICULTY = {
  EASY: {
    keywordHintLevel: 3,
    discussionTime: 240,
  },
  NORMAL: {
    keywordHintLevel: 2,
    discussionTime: 180,
  },
  HARD: {
    keywordHintLevel: 1,
    discussionTime: 120,
  },
} as const;
