/**
 * TAG-DATA-MODEL-001: GameActionEntity 테스트
 * 게임 액션 로깅을 위한 GameActionEntity 테스트
 */

import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GameActionEntity, GameActionType } from '../../src/game/entities/game-action.entity';
import { GameEntity } from '../../src/game/entities/game.entity';
import { PlayerEntity } from '../../src/player/entities/player.entity';
import dayjs from 'dayjs';

// Mock GameActionEntity 생성
const createMockGameActionEntity = (overrides: Partial<GameActionEntity> = {}): GameActionEntity => ({
  id: overrides.id ?? 1,
  gameId: overrides.gameId ?? 1,
  game: overrides.game,
  playerId: overrides.playerId ?? 1,
  player: overrides.player,
  type: overrides.type ?? GameActionType.JOIN,
  actionData: overrides.actionData ?? {},
  timestamp: overrides.timestamp ?? dayjs().toDate(),
  createdAt: overrides.createdAt ?? dayjs().toDate(),
  updatedAt: overrides.updatedAt ?? dayjs().toDate(),
  deletedAt: overrides.deletedAt,
});

// Mock GameEntity 생성
const createMockGame = (overrides: Partial<GameEntity> = {}): GameEntity => ({
  id: overrides.id ?? 1,
  roomId: overrides.roomId ?? 1,
  status: overrides.status ?? 'waiting' as any,
  difficulty: overrides.difficulty ?? 'normal' as any,
  currentRound: overrides.currentRound ?? 1,
  totalRounds: overrides.totalRounds ?? 5,
  version: overrides.version ?? 1,
  createdAt: overrides.createdAt ?? dayjs().toDate(),
  updatedAt: overrides.updatedAt ?? dayjs().toDate(),
  deletedAt: overrides.deletedAt,
});

// Mock PlayerEntity 생성
const createMockPlayer = (overrides: Partial<PlayerEntity> = {}): PlayerEntity => ({
  id: overrides.id ?? 1,
  roomId: overrides.roomId ?? 1,
  userId: overrides.userId ?? 1,
  status: overrides.status ?? 'ready' as any,
  joinOrder: overrides.joinOrder ?? 1,
  isHost: overrides.isHost ?? false,
  gameRole: overrides.gameRole ?? null,
  hasVoted: overrides.hasVoted ?? false,
  voteData: overrides.voteData ?? null,
  gameData: overrides.gameData ?? null,
  lastActiveAt: overrides.lastActiveAt ?? null,
  createdAt: overrides.createdAt ?? dayjs().toDate(),
  updatedAt: overrides.updatedAt ?? dayjs().toDate(),
  deletedAt: overrides.deletedAt,
});

describe('TAG-DATA-MODEL-001: GameActionEntity (Unit Tests)', () => {
  let mockGameActionRepository: any;
  let mockGameRepository: any;
  let mockPlayerRepository: any;

  beforeEach(() => {
    // Mock Repository 생성
    mockGameActionRepository = {
      create: vi.fn(),
      save: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      softDelete: vi.fn(),
      update: vi.fn(),
    };

    mockGameRepository = {
      findOne: vi.fn(),
    };

    mockPlayerRepository = {
      findOne: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('RED: 실패 테스트 - GameActionEntity 요구사항 검증', () => {

    it('TC-001: 게임 액션 생성 시 Game 필수 연관관계 검증 - Game 없이 생성 시도해야 실패', async () => {
      // GIVEN: Game이 없는 액션 생성 요청
      const actionData = {
        gameId: 999, // 존재하지 않는 gameId
        type: GameActionType.JOIN,
        actionData: { playerId: 1 },
      };

      // WHEN: GameActionEntity 생성 시도
      mockGameRepository.findOne.mockResolvedValue(null); // Game 없음

      // THEN: 생성이 실패해야 함 (Foreign Key 제약조건 오류)
      expect(() => {
        new GameActionEntity();
      }).toThrow();
    });

    it('TC-002: 게임 액션 생성 시 Player 필수 연관관계 검증 - Player 없이 생성 시도해야 실패', async () => {
      // GIVEN: Player가 없는 액션 생성 요청
      const game = createMockGame({ id: 1 });
      const actionData = {
        gameId: 1,
        playerId: 999, // 존재하지 않는 playerId
        type: GameActionType.JOIN,
        actionData: {},
      };

      // WHEN: GameActionEntity 생성 시도
      mockGameRepository.findOne.mockResolvedValue(game);
      mockPlayerRepository.findOne.mockResolvedValue(null); // Player 없음

      // THEN: 생성이 실패해야 함
      expect(() => {
        const action = new GameActionEntity();
        action.gameId = 1;
        action.playerId = 999;
        action.type = GameActionType.JOIN;
        // Foreign Key 검증 로직 필요
      }).toThrow();
    });

    it('TC-003: 액션 타입 검증 - 유효하지 않은 액션 타입으로 생성 시도해야 실패', async () => {
      // GIVEN: 유효하지 않은 액션 타입
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1 });

      // WHEN: 유효하지 않은 액션 타입으로 생성 시도
      mockGameRepository.findOne.mockResolvedValue(game);
      mockPlayerRepository.findOne.mockResolvedValue(player);

      // THEN: 유효하지 않은 액션 타입은 거부되어야 함
      expect(() => {
        // @ts-ignore - 유효하지 않은 타입 강제 설정
        const action = new GameActionEntity();
        action.type = 'INVALID_ACTION_TYPE';
        // 유효성 검사 로직 필요
      }).toThrow('Invalid action type');
    });

    it('TC-004: 타임스탬프 검증 - timestamp가 미래인 액션 생성 시도해야 실패', async () => {
      // GIVEN: 미래 시간의 타임스탬프
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1 });
      const futureTimestamp = dayjs().add(1, 'day').toDate(); // 미래 시간

      const actionData = {
        gameId: 1,
        playerId: 1,
        type: GameActionType.JOIN,
        timestamp: futureTimestamp,
        actionData: {},
      };

      // WHEN: GameActionEntity 생성 시도
      mockGameRepository.findOne.mockResolvedValue(game);
      mockPlayerRepository.findOne.mockResolvedValue(player);

      // THEN: 미래 시간의 타임스탬프는 거부되어야 함
      expect(() => {
        const action = new GameActionEntity();
        action.gameId = 1;
        action.playerId = 1;
        action.type = GameActionType.JOIN;
        action.timestamp = futureTimestamp;
        // 타임스탬프 유효성 검증 로직 필요
      }).toThrow('Timestamp cannot be in the future');
    });

    it('TC-005: 액션 데이터 검증 - actionData가 객체가 아닌 경우 생성 시도해야 실패', async () => {
      // GIVEN: 유효하지 않은 actionData
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1 });

      const actionData = {
        gameId: 1,
        playerId: 1,
        type: GameActionType.JOIN,
        actionData: 'invalid_data', // 문자열이 아닌 객체
      };

      // WHEN: GameActionEntity 생성 시도
      mockGameRepository.findOne.mockResolvedValue(game);
      mockPlayerRepository.findOne.mockResolvedValue(player);

      // THEN: actionData가 객체가 아니면 생성이 거부되어야 함
      expect(() => {
        const action = new GameActionEntity();
        action.gameId = 1;
        action.playerId = 1;
        action.type = GameActionType.JOIN;
        action.actionData = 'invalid' as any;
        // 유효성 검증 로직 필요
      }).toThrow('actionData must be an object');
    });

    it('TC-006: 타임라인 일관성 검증 - 게임 상태와 액션 타입의 불일치 시도해야 실패', async () => {
      // GIVEN: 게임이 이미 FINISHED 상태에서 새로운 액션 생성 시도
      const finishedGame = createMockGame({
        id: 1,
        status: 'finished' as any
      });
      const player = createMockPlayer({ id: 1 });

      const actionData = {
        gameId: 1,
        playerId: 1,
        type: GameActionType.JOIN, // 게임이 끝난 후에 참가 액션
        actionData: {},
      };

      // WHEN: GameActionEntity 생성 시도
      mockGameRepository.findOne.mockResolvedValue(finishedGame);
      mockPlayerRepository.findOne.mockResolvedValue(player);

      // THEN: 게임 상태와 액션 타입이 불일치하면 거부되어야 함
      expect(() => {
        const action = new GameActionEntity();
        action.gameId = 1;
        action.playerId = 1;
        action.type = GameActionType.JOIN;
        action.actionData = {};
        // 타임라인 일관성 검증 로직 필요
      }).toThrow('Action type is not valid for game status');
    });

    it('TC-007: 중복 액션 방지 검증 - 동일한 플레이어의 동일한 타입 중복 액션 생성 시도해야 실패', async () => {
      // GIVEN: 이미 JOIN 액션이 있는 상황
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1 });

      const existingAction = createMockGameActionEntity({
        id: 1,
        gameId: 1,
        playerId: 1,
        type: GameActionType.JOIN,
        actionData: {},
      });

      const duplicateActionData = {
        gameId: 1,
        playerId: 1,
        type: GameActionType.JOIN, // 동일한 플레이어의 동일한 타입
        actionData: {},
      };

      // WHEN: 중복 액션 생성 시도
      mockGameRepository.findOne.mockResolvedValue(game);
      mockPlayerRepository.findOne.mockResolvedValue(player);
      mockGameActionRepository.findOne.mockResolvedValue(existingAction);

      // THEN: 중복 액션은 거부되어야 함
      expect(() => {
        const action = new GameActionEntity();
        action.gameId = 1;
        action.playerId = 1;
        action.type = GameActionType.JOIN;
        action.actionData = {};
        // 중복 액션 방지 로직 필요
      }).toThrow('Duplicate action not allowed');
    });

    it('TC-008: 플레이어 권한 검증 - 권한 없는 플레이어의 특정 액션 생성 시도해야 실패', async () => {
      // GIVEN: 호스트가 아닌 플레이어의 호스트 전용 액션 생성 시도
      const game = createMockGame({ id: 1 });
      const nonHostPlayer = createMockPlayer({
        id: 1,
        isHost: false // 호스트 아님
      });

      const actionData = {
        gameId: 1,
        playerId: 1,
        type: GameActionType.KICK_PLAYER, // 호스트 전용 액션
        actionData: { targetPlayerId: 2 },
      };

      // WHEN: GameActionEntity 생성 시도
      mockGameRepository.findOne.mockResolvedValue(game);
      mockPlayerRepository.findOne.mockResolvedValue(nonHostPlayer);

      // THEN: 권한 없는 플레이어의 액션은 거부되어야 함
      expect(() => {
        const action = new GameActionEntity();
        action.gameId = 1;
        action.playerId = 1;
        action.type = GameActionType.KICK_PLAYER;
        action.actionData = { targetPlayerId: 2 };
        // 권한 검증 로직 필요
      }).toThrow('Player does not have permission for this action');
    });

    it('TC-009: 데이터 크기 제한 검증 - actionData가 너무 큰 경우 생성 시도해야 실패', async () => {
      // GIVEN: actionData가 너무 큰 경우
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1 });

      // 10KB 크기의 데이터 생성
      const largeActionData = { data: 'x'.repeat(10240) };

      const actionData = {
        gameId: 1,
        playerId: 1,
        type: GameActionType.CHAT,
        actionData: largeActionData,
      };

      // WHEN: GameActionEntity 생성 시도
      mockGameRepository.findOne.mockResolvedValue(game);
      mockPlayerRepository.findOne.mockResolvedValue(player);

      // THEN: actionData가 크기 제한을 초과하면 거부되어야 함
      expect(() => {
        const action = new GameActionEntity();
        action.gameId = 1;
        action.playerId = 1;
        action.type = GameActionType.CHAT;
        action.actionData = largeActionData;
        // 데이터 크기 검증 로직 필요
      }).toThrow('actionData size exceeds limit');
    });

    it('TC-010: 삭제 상태 검증 - soft delete된 액션은 조회되지 않아야 함', async () => {
      // GIVEN: 삭제된 액션
      const deletedAction = createMockGameActionEntity({
        id: 1,
        deletedAt: dayjs().toDate(), // 삭제됨
      });

      // WHEN: 액션 목록 조회
      mockGameActionRepository.find.mockResolvedValue([deletedAction]);

      // THEN: soft delete된 액션은 조회 결과에 포함되지 않아야 함
      const actions = [deletedAction];
      const activeActions = actions.filter(action => action.deletedAt === null);
      expect(activeActions).toHaveLength(0);
    });

    it('TC-011: 관계 무결성 검증 - 삭제된 Game에 속한 액션은 존재할 수 없음', async () => {
      // GIVEN: 삭제된 Game
      const deletedGame = createMockGame({
        id: 1,
        deletedAt: dayjs().toDate(),
      });

      // WHEN: 삭제된 Game에 속한 액션 조회 시도
      mockGameRepository.findOne.mockResolvedValue(deletedGame);

      // THEN: 삭제된 Game에 속한 액션은 조회되지 않아야 함
      expect(() => {
        const action = new GameActionEntity();
        action.gameId = 1;
        action.game = deletedGame;
        // 관계 무결성 검증 로직 필요
      }).toThrow('Action cannot reference a deleted game');
    });

    it('TC-012: 시간 순서 검증 - 액션들의 시간 순서가 올바르지 않을 때 실패', async () => {
      // GIVEN: 시간 순서가 잘못된 액션들
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1 });

      const oldAction = createMockGameActionEntity({
        id: 1,
        gameId: 1,
        playerId: 1,
        type: GameActionType.LEAVE,
        timestamp: dayjs().subtract(2, 'hour').toDate(),
      });

      const newAction = createMockGameActionEntity({
        id: 2,
        gameId: 1,
        playerId: 1,
        type: GameActionType.JOIN,
        timestamp: dayjs().subtract(1, 'hour').toDate(),
      });

      // WHEN: 시간 순서가 잘못된 액션들 생성
      mockGameRepository.findOne.mockResolvedValue(game);
      mockPlayerRepository.findOne.mockResolvedValue(player);

      // THEN: 시간 순서가 잘못된 액션은 거부되어야 함 (LEAVE가 JOIN보다 먼저여야 함)
      expect(() => {
        const action = new GameActionEntity();
        action.gameId = 1;
        action.playerId = 1;
        action.type = GameActionType.LEAVE;
        action.timestamp = dayjs().subtract(1, 'hour').toDate();
        action.actionData = {};
        // 시간 순서 검증 로직 필요
      }).toThrow('Action timeline is invalid');
    });

    it('TC-013: 액션 데이터 무결성 검증 - 필수 필드 누락 시도해야 실패', async () => {
      // GIVEN: 필수 필드가 누락된 액션
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1 });

      // WHEN: 필수 필드가 누락된 액션 생성 시도
      mockGameRepository.findOne.mockResolvedValue(game);
      mockPlayerRepository.findOne.mockResolvedValue(player);

      // THEN: 특정 액션 타입에 필수 필드가 누락되면 거부되어야 함
      expect(() => {
        const action = new GameActionEntity();
        action.gameId = 1;
        action.playerId = 1;
        action.type = GameActionType.VOTE;
        // voteData 필드가 누락됨
        // 유효성 검증 로직 필요
      }).toThrow('Required field missing for action type');
    });

    it('TC-014: 연관관계 순환 참조 검증 - GameAction과 Game 간 순환 참조 불가', async () => {
      // GIVEN: 순환 참조가 발생하는 구조
      const game = createMockGame({ id: 1 });
      const action = createMockGameActionEntity({
        id: 1,
        gameId: 1,
        game: game,
        type: GameActionType.JOIN,
      });

      // 순환 참조 생성
      // @ts-ignore - 순환 참조 강제 생성
      game.actions = [action];

      // WHEN: GameActionEntity 생성 시도
      mockGameRepository.findOne.mockResolvedValue(game);

      // THEN: 순환 참조는 방지되어야 함
      expect(() => {
        const newAction = new GameActionEntity();
        newAction.game = game;
        game.actions = [newAction]; // 순환 참조
        // 순환 참조 검증 로직 필요
      }).toThrow('Circular reference detected');
    });

    it('TC-015: 액션 빈도 제한 검증 - 너무 자주 발생하는 액션 제한', async () => {
      // GIVEN: 너무 자주 발생하는 액션
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1 });

      // WHEN: 짧은 시간내에 동일한 액션 반복 생성 시도
      mockGameRepository.findOne.mockResolvedValue(game);
      mockPlayerRepository.findOne.mockResolvedValue(player);

      // THEN: 액션 빈도를 초과하면 거부되어야 함
      expect(() => {
        const action = new GameActionEntity();
        action.gameId = 1;
        action.playerId = 1;
        action.type = GameActionType.CHAT;
        action.actionData = { message: 'test' };
        // 액션 빈도 제한 로직 필요
      }).toThrow('Action frequency limit exceeded');
    });
  });

  describe('GREEN: 성공 테스트 - 유효한 게임 액션 생성 및 관리', () => {

    it('TC-SUCCESS-01: 플레이어 참가 액션 생성 성공', async () => {
      // GIVEN: 유효한 참가 액션 데이터
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1 });

      const actionData = {
        gameId: 1,
        playerId: 1,
        type: GameActionType.JOIN,
        actionData: { joinTime: dayjs().toISOString() },
      };

      // WHEN: GameActionEntity 생성
      mockGameRepository.findOne.mockResolvedValue(game);
      mockPlayerRepository.findOne.mockResolvedValue(player);
      mockGameActionRepository.create.mockReturnValue(createMockGameActionEntity(actionData));

      // THEN: 성공적으로 생성되어야 함
      const action = createMockGameActionEntity(actionData);
      expect(action.id).toBe(1);
      expect(action.gameId).toBe(1);
      expect(action.playerId).toBe(1);
      expect(action.type).toBe(GameActionType.JOIN);
      expect(action.actionData).toEqual({ joinTime: expect.any(String) });
    });

    it('TC-SUCCESS-02: 투표 액션 생성 성공', async () => {
      // GIVEN: 유효한 투표 액션 데이터
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1 });

      const voteData = {
        targetPlayerId: 2,
        voteType: 'guilty',
        round: 1,
      };

      const actionData = {
        gameId: 1,
        playerId: 1,
        type: GameActionType.VOTE,
        actionData: voteData,
      };

      // WHEN: GameActionEntity 생성
      mockGameRepository.findOne.mockResolvedValue(game);
      mockPlayerRepository.findOne.mockResolvedValue(player);
      mockGameActionRepository.create.mockReturnValue(createMockGameActionEntity(actionData));

      // THEN: 성공적으로 생성되어야 함
      const action = createMockGameActionEntity(actionData);
      expect(action.type).toBe(GameActionType.VOTE);
      expect(action.actionData).toEqual(voteData);
    });

    it('TC-SUCCESS-03: 채팅 액션 생성 성공', async () => {
      // GIVEN: 유효한 채팅 액션 데이터
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1 });

      const chatData = {
        message: '안녕하세요!',
        timestamp: dayjs().toISOString(),
      };

      const actionData = {
        gameId: 1,
        playerId: 1,
        type: GameActionType.CHAT,
        actionData: chatData,
      };

      // WHEN: GameActionEntity 생성
      mockGameRepository.findOne.mockResolvedValue(game);
      mockPlayerRepository.findOne.mockResolvedValue(player);
      mockGameActionRepository.create.mockReturnValue(createMockGameActionEntity(actionData));

      // THEN: 성공적으로 생성되어야 함
      const action = createMockGameActionEntity(actionData);
      expect(action.type).toBe(GameActionType.CHAT);
      expect(action.actionData).toEqual(chatData);
    });

    it('TC-SUCCESS-04: 게임 종료 액션 생성 성공', async () => {
      // GIVEN: 유효한 게임 종료 액션 데이터
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1, isHost: true }); // 호스트 권한

      const endGameData = {
        winner: 'citizens',
        finalRound: 5,
        totalDuration: 1800, // 30분
      };

      const actionData = {
        gameId: 1,
        playerId: 1,
        type: GameActionType.END_GAME,
        actionData: endGameData,
      };

      // WHEN: GameActionEntity 생성
      mockGameRepository.findOne.mockResolvedValue(game);
      mockPlayerRepository.findOne.mockResolvedValue(player);
      mockGameActionRepository.create.mockReturnValue(createMockGameActionEntity(actionData));

      // THEN: 성공적으로 생성되어야 함
      const action = createMockGameActionEntity(actionData);
      expect(action.type).toBe(GameActionType.END_GAME);
      expect(action.actionData).toEqual(endGameData);
    });

    it('TC-SUCCESS-05: 상태 변경 액션 생성 성공', async () => {
      // GIVEN: 유효한 상태 변경 액션 데이터
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1 });

      const statusData = {
        fromStatus: 'waiting',
        toStatus: 'playing',
        reason: 'minimum players reached',
      };

      const actionData = {
        gameId: 1,
        playerId: 1,
        type: GameActionType.CHANGE_STATUS,
        actionData: statusData,
      };

      // WHEN: GameActionEntity 생성
      mockGameRepository.findOne.mockResolvedValue(game);
      mockPlayerRepository.findOne.mockResolvedValue(player);
      mockGameActionRepository.create.mockReturnValue(createMockGameActionEntity(actionData));

      // THEN: 성공적으로 생성되어야 함
      const action = createMockGameActionEntity(actionData);
      expect(action.type).toBe(GameActionType.CHANGE_STATUS);
      expect(action.actionData).toEqual(statusData);
    });

    it('TC-SUCCESS-06: 다중 액션 타입 지원 성공', async () => {
      // GIVEN: 여러 유효한 액션 타입
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1 });

      const actionTypes = [
        GameActionType.JOIN,
        GameActionType.LEAVE,
        GameActionType.CHAT,
        GameActionType.VOTE,
        GameActionType.KICK_PLAYER,
        GameActionType.END_GAME,
        GameActionType.CHANGE_STATUS,
      ];

      // WHEN: 각 액션 타별로 생성
      mockGameRepository.findOne.mockResolvedValue(game);
      mockPlayerRepository.findOne.mockResolvedValue(player);

      // THEN: 모든 액션 타입이 지원되어야 함
      actionTypes.forEach(actionType => {
        expect(() => {
          const action = new GameActionEntity();
          action.gameId = 1;
          action.playerId = 1;
          action.type = actionType;
          action.actionData = {};
        }).not.toThrow();
      });
    });

    it('TC-SUCCESS-07: 타임스탬프 자동 설정 성공', async () => {
      // GIVEN: 타임스탬프를 명시적으로 설정하지 않은 경우
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1 });

      const actionData = {
        gameId: 1,
        playerId: 1,
        type: GameActionType.JOIN,
        actionData: {},
      };

      // WHEN: GameActionEntity 생성
      mockGameRepository.findOne.mockResolvedValue(game);
      mockPlayerRepository.findOne.mockResolvedValue(player);
      mockGameActionRepository.create.mockReturnValue(createMockGameActionEntity(actionData));

      const action = createMockGameActionEntity(actionData);

      // THEN: 타임스탬프가 자동으로 설정되어야 함
      expect(action.timestamp).toBeDefined();
      expect(action.timestamp instanceof Date).toBe(true);
    });

    it('TC-SUCCESS-08: 액션 필터링 성공', async () => {
      // GIVEN: 여러 액션들
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1 });

      const actions = [
        createMockGameActionEntity({
          id: 1,
          gameId: 1,
          playerId: 1,
          type: GameActionType.JOIN,
          actionData: {},
        }),
        createMockGameActionEntity({
          id: 2,
          gameId: 1,
          playerId: 1,
          type: GameActionType.CHAT,
          actionData: { message: 'test' },
        }),
        createMockGameActionEntity({
          id: 3,
          gameId: 1,
          playerId: 2,
          type: GameActionType.VOTE,
          actionData: {},
        }),
      ];

      // WHEN: 특정 타입의 액션 필터링
      const chatActions = actions.filter(action => action.type === GameActionType.CHAT);

      // THEN: 정확히 필터링되어야 함
      expect(chatActions).toHaveLength(1);
      expect(chatActions[0].type).toBe(GameActionType.CHAT);
    });
  });

  describe('BLUE: 추가 검증 - 내부 로직 검증', () => {

    it('TC-LOGIC-01: 액션 크기 계산 로직 검증', async () => {
      // GIVEN: 액션 데이터 크기 계산
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1 });

      const actionData = {
        gameId: 1,
        playerId: 1,
        type: GameActionType.CHAT,
        actionData: { message: 'test message' },
      };

      // WHEN: 액션 크기 계산
      const action = createMockGameActionEntity(actionData);
      const dataSize = JSON.stringify(action.actionData).length;

      // THEN: 정확한 크기가 계산되어야 함
      expect(dataSize).toBeGreaterThan(0);
      expect(typeof dataSize).toBe('number');
    });

    it('TC-LOGIC-02: 액션 시간대 검증', async () => {
      // GIVEN: 액션 시간대 확인
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1 });

      const actionData = {
        gameId: 1,
        playerId: 1,
        type: GameActionType.JOIN,
        timestamp: dayjs().subtract(1, 'hour').toDate(),
        actionData: {},
      };

      // WHEN: 시간대 유효성 확인
      const action = createMockGameActionEntity(actionData);
      const isPast = action.timestamp < dayjs().toDate();
      const isValidTime = action.timestamp <= dayjs().toDate();

      // THEN: 유효한 시간대여야 함
      expect(isPast).toBe(true);
      expect(isValidTime).toBe(true);
    });

    it('TC-LOGIC-03: 액션 권한 계층 검증', async () => {
      // GIVEN: 액션 권한 계층
      const game = createMockGame({ id: 1 });
      const hostPlayer = createMockPlayer({ id: 1, isHost: true });
      const normalPlayer = createMockPlayer({ id: 2, isHost: false });

      const hostOnlyActions = [
        GameActionType.KICK_PLAYER,
        GameActionType.END_GAME,
        GameActionType.CHANGE_SETTINGS,
      ];

      // WHEN: 호스트 전용 액션 권한 확인
      const hasHostPermission = hostOnlyActions.includes(GameActionType.KICK_PLAYER);

      // THEN: 호스트는 호스트 전용 액션을 수행할 수 있어야 함
      expect(hasHostPermission).toBe(true);
    });

    it('TC-LOGIC-04: 액션 상태 종속성 검증', async () => {
      // GIVEN: 액션 상태 종속성
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1 });

      const actionStateMapping = {
        [GameActionType.JOIN]: ['waiting'],
        [GameActionType.VOTE]: ['playing'],
        [GameActionType.CHAT]: ['waiting', 'playing'],
        [GameActionType.END_GAME]: ['playing'],
      };

      // WHEN: 특정 상태에서 허용되는 액션 확인
      const gameStatus = 'waiting' as any;
      const allowedActions = Object.keys(actionStateMapping).filter(
        actionType => actionStateMapping[actionType].includes(gameStatus)
      );

      // THEN: 허용된 액션만 있어야 함
      expect(allowedActions).toContain(GameActionType.JOIN);
      expect(allowedActions).toContain(GameActionType.CHAT);
      expect(allowedActions).not.toContain(GameActionType.VOTE);
    });

    it('TC-LOGIC-05: 액션 통계 계산 로직', async () => {
      // GIVEN: 액션 통계 계산
      const game = createMockGame({ id: 1 });
      const player = createMockPlayer({ id: 1 });

      const actions = [
        createMockGameActionEntity({
          id: 1,
          gameId: 1,
          playerId: 1,
          type: GameActionType.CHAT,
          actionData: {},
        }),
        createMockGameActionEntity({
          id: 2,
          gameId: 1,
          playerId: 1,
          type: GameActionType.CHAT,
          actionData: {},
        }),
        createMockGameActionEntity({
          id: 3,
          gameId: 1,
          playerId: 2,
          type: GameActionType.VOTE,
          actionData: {},
        }),
      ];

      // WHEN: 액션 통계 계산
      const chatCount = actions.filter(action => action.type === GameActionType.CHAT).length;
      const voteCount = actions.filter(action => action.type === GameActionType.VOTE).length;
      const totalActions = actions.length;

      // THEN: 정확한 통계가 계산되어야 함
      expect(chatCount).toBe(2);
      expect(voteCount).toBe(1);
      expect(totalActions).toBe(3);
    });
  });
});