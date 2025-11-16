/**
 * SPEC-GAME-001: Game State Management 테스트
 * 게임 상태 전환 및 관리 기능 검증을 위한 실패 테스트
 */

import { GameStateManager } from './game.state.manager';
import { RoomEntity, RoomStatus, GamePhase, GameDifficulty } from '../room/entities/room.entity';
import { PlayerEntity, PlayerStatus } from '../player/entities/player.entity';
import { GameRoleType } from './entities/game-role.enum';
import { CreateGameRoomDto } from './dto/create-game-room.dto';
import { NotFoundException, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import dayjs from 'dayjs';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

describe('SPEC-GAME-001: Game State Management', () => {
  let gameStateManager: GameStateManager;
  let gameRoomRepository: Repository<RoomEntity>;
  let playerRepository: Repository<PlayerEntity>;
  
  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GameStateManager,
        {
          provide: getRepositoryToken(RoomEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(PlayerEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    gameStateManager = moduleRef.get<GameStateManager>(GameStateManager);
    gameRoomRepository = moduleRef.get<Repository<RoomEntity>>(getRepositoryToken(RoomEntity));
    playerRepository = moduleRef.get<Repository<PlayerEntity>>(getRepositoryToken(PlayerEntity));
  });

  describe('RED: 실패 테스트 - 게임 상태 전환 요구사항 검증', () => {

    it('TC-001: 게임 시작 전 검증 - 최소 인원 미달 시 시작 불가', async () => {
      // GIVEN: 최소 인원 미달인 게임 방
      const room = {
        id: 1,
        code: 'testgame12345678901234567890123456',
        title: '테스트 게임',
        status: RoomStatus.WAITING,
        phase: GamePhase.LOBBY,
        minPlayers: 4,
        maxPlayers: 8,
        currentPlayers: 2, // 최소 인원 미달
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
        timeLimit: 600,
        gameSettings: {},
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
        deletedAt: null,
      } as unknown as RoomEntity;

      const mockFindOne = jest.spyOn(gameRoomRepository, 'findOne').mockResolvedValue(room);
      const mockFind = jest.spyOn(playerRepository, 'find').mockResolvedValue([
        {
          id: 1,
          roomId: 1,
          userId: 1,
          room: {} as RoomEntity,
          user: {} as any,
          status: PlayerStatus.ACTIVE,
          joinOrder: 1,
          isHost: false,
          gameRole: null,
          hasVoted: false,
          voteData: null,
          gameData: null,
          lastActiveAt: null,
          createdAt: dayjs().toDate(),
          updatedAt: dayjs().toDate(),
          deletedAt: null,
        },
        {
          id: 2,
          roomId: 1,
          userId: 2,
          room: {} as RoomEntity,
          user: {} as any,
          status: PlayerStatus.ACTIVE,
          joinOrder: 2,
          isHost: false,
          gameRole: null,
          hasVoted: false,
          voteData: null,
          gameData: null,
          lastActiveAt: null,
          createdAt: dayjs().toDate(),
          updatedAt: dayjs().toDate(),
          deletedAt: null,
        },
      ] as PlayerEntity[]);

      // WHEN: 게임 시작 시도
      // THEN: BadRequestException 발생해야 함
      await expect(gameStateManager.startGame(room.id)).rejects.toThrow(BadRequestException);

      mockFindOne.mockRestore();
      mockFind.mockRestore();
    });

    it('TC-002: 게임 시작 전 검증 - 방 상태가 WAITING이 아니면 시작 불가', async () => {
      // GIVEN: 이미 시작된 게임 방
      const room = {
        id: 1,
        code: 'testgame12345678901234567890123456',
        title: '진행중인 게임',
        status: RoomStatus.PLAYING, // 이미 PLAYING 상태
        phase: GamePhase.DISCUSSION,
        minPlayers: 4,
        maxPlayers: 8,
        currentPlayers: 6,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
        timeLimit: 600,
        gameSettings: {},
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
        deletedAt: null,
      } as unknown as RoomEntity;

      const mockFindOne = jest.spyOn(gameRoomRepository, 'findOne').mockResolvedValue(room);

      // WHEN: 게임 시작 시도 (이미 시작된 방에서)
      // THEN: ConflictException 발생해야 함
      await expect(gameStateManager.startGame(room.id)).rejects.toThrow(ConflictException);

      mockFindOne.mockRestore();
    });

    it('TC-003: 게임 시작 검증 - 호스트만 게임을 시작할 수 있음', async () => {
      // GIVEN: 게임 방 (호스트가 아닌 사용자로 시도)
      const room = {
        id: 1,
        code: 'testgame12345678901234567890123456',
        title: '테스트 게임',
        status: RoomStatus.WAITING,
        phase: GamePhase.LOBBY,
        minPlayers: 4,
        maxPlayers: 8,
        currentPlayers: 6,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
        timeLimit: 600,
        gameSettings: {},
        hostId: 1, // 호스트 ID가 1
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
        deletedAt: null,
      } as unknown as RoomEntity;

      const mockFindOne = jest.spyOn(gameRoomRepository, 'findOne').mockResolvedValue(room);

      // WHEN: 호스트가 아닌 사용자(ID: 2)로 게임 시작 시도
      // THEN: UnauthorizedException 발생해야 함
      await expect(gameStateManager.startGame(room.id, 2)).rejects.toThrow('호스트만 게임을 시작할 수 있습니다.');

      mockFindOne.mockRestore();
    });

    it('TC-004: 게임 상태 전환 검증 - INVALID 상태로의 직접 전환 불가', async () => {
      // GIVEN: 게임 방
      const room = {
        id: 1,
        code: 'testgame12345678901234567890123456',
        title: '테스트 게임',
        status: RoomStatus.WAITING,
        phase: GamePhase.LOBBY,
        minPlayers: 4,
        maxPlayers: 8,
        currentPlayers: 6,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
        timeLimit: 600,
        gameSettings: {},
        hostId: 1,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
        deletedAt: null,
      } as unknown as RoomEntity;

      const mockFindOne = jest.spyOn(gameRoomRepository, 'findOne').mockResolvedValue(room);

      // WHEN: 유효하지 않은 상태로 직접 전환 시도
      // THEN: BadRequestException 발생해야 함
      await expect(gameStateManager.updateRoomStatus(room, 'INVALID' as RoomStatus)).rejects.toThrow(BadRequestException);

      mockFindOne.mockRestore();
    });

    it('TC-005: 게임 상태 전환 검증 - 상태 전환 규칙 위반', async () => {
      // GIVEN: 대기중인 게임 방
      const room = {
        id: 1,
        code: 'testgame12345678901234567890123456',
        title: '테스트 게임',
        status: RoomStatus.WAITING,
        phase: GamePhase.LOBBY,
        minPlayers: 4,
        maxPlayers: 8,
        currentPlayers: 6,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
        timeLimit: 600,
        gameSettings: {},
        hostId: 1,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
        deletedAt: null,
      } as unknown as RoomEntity;

      const mockFindOne = jest.spyOn(gameRoomRepository, 'findOne').mockResolvedValue(room);

      // WHEN: 대기중인 상태에서 FINISHED 상태로 직접 전환 시도
      // THEN: BadRequestException 발생해야 함 (중간 상태 건너뛰기)
      await expect(gameStateManager.updateRoomStatus(room, RoomStatus.FINISHED)).rejects.toThrow('유효하지 않은 상태 전환입니다.');

      mockFindOne.mockRestore();
    });

    it('TC-006: 플레이어 역할 할당 검증 - 중복 역할 할당 불가', async () => {
      // GIVEN: 이미 역할이 할당된 플레이어
      const existingPlayer = {
        id: 1,
        roomId: 1,
        userId: 1,
        room: {} as RoomEntity,
        user: {} as any,
        status: PlayerStatus.ACTIVE,
        joinOrder: 1,
        isHost: false,
        gameRole: GameRoleType.LIAR,
        hasVoted: false,
        voteData: null,
        gameData: null,
        lastActiveAt: null,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
        deletedAt: null,
      } as PlayerEntity;

      const mockFindOne = jest.spyOn(playerRepository, 'findOne').mockResolvedValue(existingPlayer);

      // WHEN: 동일한 플레이어에게 다른 역할 할당 시도
      // THEN: ConflictException 발생해야 함
      await expect(gameStateManager.assignPlayerRole(1, 1, GameRoleType.CITIZEN)).rejects.toThrow('플레이어에게는 이미 역할이 할당되어 있습니다.');

      mockFindOne.mockRestore();
    });

    it('TC-007: 플레이어 역할 할당 검증 - 존재하지 않는 플레이어에게 역할 할당 불가', async () => {
      // GIVEN: 존재하지 않는 플레이어
      const mockFindOne = jest.spyOn(playerRepository, 'findOne').mockResolvedValue(null);

      // WHEN: 존재하지 않는 플레이어에게 역할 할당 시도
      // THEN: NotFoundException 발생해야 함
      await expect(gameStateManager.assignPlayerRole(999, 1, GameRoleType.LIAR)).rejects.toThrow('플레이어를 찾을 수 없습니다.');

      mockFindOne.mockRestore();
    });

    it('TC-008: 게임 단계 전환 검증 - 현재 단계에서 허용되지 않은 전환 불가', async () => {
      // GIVEN: 토론 단계인 게임 방
      const room = {
        id: 1,
        code: 'testgame12345678901234567890123456',
        title: '토론 중인 게임',
        status: RoomStatus.PLAYING,
        phase: GamePhase.DISCUSSION, // 현재 토론 단계
        minPlayers: 4,
        maxPlayers: 8,
        currentPlayers: 6,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
        timeLimit: 600,
        gameSettings: {},
        hostId: 1,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
        deletedAt: null,
      } as unknown as RoomEntity;

      const mockFindOne = jest.spyOn(gameRoomRepository, 'findOne').mockResolvedValue(room);

      // WHEN: 토론 단계에서 LOBBY 단계로 직접 전환 시도 (허용되지 않는 전환)
      // THEN: BadRequestException 발생해야 함
      await expect(gameStateManager.updateGamePhase(room.id, GamePhase.LOBBY)).rejects.toThrow('유효하지 않은 단계 전환입니다.');

      mockFindOne.mockRestore();
    });

    it('TC-009: 게임 종료 검증 - 진행 중인 게임만 종료 가능', async () => {
      // GIVEN: 이미 종료된 게임 방
      const room = {
        id: 1,
        code: 'testgame12345678901234567890123456',
        title: '종료된 게임',
        status: RoomStatus.FINISHED, // 이미 종료된 상태
        phase: GamePhase.RESULT,
        minPlayers: 4,
        maxPlayers: 8,
        currentPlayers: 6,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
        timeLimit: 600,
        gameSettings: {},
        hostId: 1,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
        deletedAt: null,
      } as unknown as RoomEntity;

      const mockFindOne = jest.spyOn(gameRoomRepository, 'findOne').mockResolvedValue(room);

      // WHEN: 이미 종료된 게임을 종료 시도
      // THEN: ConflictException 발생해야 함
      await expect(gameStateManager.endGame(room.id)).rejects.toThrow('이미 종료된 게임입니다.');

      mockFindOne.mockRestore();
    });

    it('TC-010: 타이머 관리 검증 - 30초 타이머 시작 시 유효한 상태에서만 가능', async () => {
      // GIVEN: 게임이 아닌 상태의 방
      const room = {
        id: 1,
        code: 'testgame12345678901234567890123456',
        title: '대기중인 방',
        status: RoomStatus.WAITING, // 게임 상태가 아님
        phase: GamePhase.LOBBY,
        minPlayers: 4,
        maxPlayers: 8,
        currentPlayers: 6,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
        timeLimit: 600,
        gameSettings: {},
        hostId: 1,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
        deletedAt: null,
      } as unknown as RoomEntity;

      const mockFindOne = jest.spyOn(gameRoomRepository, 'findOne').mockResolvedValue(room);

      // WHEN: 대기중인 상태에서 타이머 시작 시도
      // THEN: BadRequestException 발생해야 함
      await expect(gameStateManager.startTimer(room.id, 30)).rejects.toThrow('게임 진행 중에만 타이머를 시작할 수 있습니다.');

      mockFindOne.mockRestore();
    });

    it('TC-011: 암호화된 역할 할당 검증 - 게임 시작 전에는 역할 할당 불가', async () => {
      // GIVEN: 게임 시작 전 대기중인 방
      const room = {
        id: 1,
        code: 'testgame12345678901234567890123456',
        title: '대기중인 게임',
        status: RoomStatus.WAITING,
        phase: GamePhase.LOBBY,
        minPlayers: 4,
        maxPlayers: 8,
        currentPlayers: 6,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
        timeLimit: 600,
        gameSettings: {},
        hostId: 1,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
        deletedAt: null,
      } as unknown as RoomEntity;

      const mockFindOne = jest.spyOn(gameRoomRepository, 'findOne').mockResolvedValue(room);

      // WHEN: 게임 시작 전에 역할 암호화 할당 시도
      // THEN: BadRequestException 발생해야 함
      await expect(gameStateManager.assignEncryptedRoles(room.id)).rejects.toThrow('게임이 시작된 후에만 역할을 할당할 수 있습니다.');

      mockFindOne.mockRestore();
    });

    it('TC-012: 익명 투표 검증 - 참가하지 않은 플레이어 투표 불가', async () => {
      // GIVEN: 참가하지 않은 사용자
      const mockFindOne = jest.spyOn(playerRepository, 'findOne').mockResolvedValue(null);

      // WHEN: 참가하지 않은 사용자의 투표 시도
      // THEN: NotFoundException 발생해야 함
      await expect(gameStateManager.castVote(999, 1, 1)).rejects.toThrow('플레이어를 찾을 수 없습니다.');

      mockFindOne.mockRestore();
    });

    it('TC-013: 투표 검증 - 동일한 플레이어 중복 투표 불가', async () => {
      // GIVEN: 이미 투표한 플레이어
      const player = {
        id: 1,
        roomId: 1,
        userId: 1,
        room: {} as RoomEntity,
        user: {} as any,
        status: PlayerStatus.ACTIVE,
        joinOrder: 1,
        isHost: false,
        gameRole: null,
        hasVoted: true, // 이미 투표함
        voteData: null,
        gameData: null,
        lastActiveAt: null,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
        deletedAt: null,
      } as PlayerEntity;

      const mockFindOne = jest.spyOn(playerRepository, 'findOne').mockResolvedValue(player);

      // WHEN: 이미 투표한 플레이어의 재투표 시도
      // THEN: ConflictException 발생해야 함
      await expect(gameStateManager.castVote(1, 1, 1)).rejects.toThrow('이미 투표한 플레이어입니다.');

      mockFindOne.mockRestore();
    });

    it('TC-014: 투표 검증 - 대상 플레이어가 존재하지 않음', async () => {
      // GIVEN: 존재하는 플레이어 (투표자)
      const voter = {
        id: 1,
        roomId: 1,
        userId: 1,
        room: {} as RoomEntity,
        user: {} as any,
        status: PlayerStatus.ACTIVE,
        joinOrder: 1,
        isHost: false,
        gameRole: null,
        hasVoted: false,
        voteData: null,
        gameData: null,
        lastActiveAt: null,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
        deletedAt: null,
      } as PlayerEntity;

      // WHEN: 존재하지 않는 대상 플레이어에게 투표 시도
      const mockFindOneVoter = jest.spyOn(playerRepository, 'findOne').mockImplementation(async (options) => {
        if ((options as any).where.id === 1) {
          return voter;
        }
        return null; // 대상 플레이어는 null
      });

      // THEN: NotFoundException 발생해야 함
      await expect(gameStateManager.castVote(1, 1, 999)).rejects.toThrow('대상 플레이어를 찾을 수 없습니다.');

      mockFindOneVoter.mockRestore();
    });

    it('TC-015: 게임 재시작 검증 - 완전히 종료된 게임만 재시작 가능', async () => {
      // GIVEN: 완전히 종료된 게임 방
      const room = {
        id: 1,
        code: 'testgame12345678901234567890123456',
        title: '완전 종료된 게임',
        status: RoomStatus.FINISHED,
        phase: GamePhase.RESULT,
        minPlayers: 4,
        maxPlayers: 8,
        currentPlayers: 6,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
        timeLimit: 600,
        gameSettings: {},
        hostId: 1,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
        deletedAt: null,
      } as unknown as RoomEntity;

      const mockFindOne = jest.spyOn(gameRoomRepository, 'findOne').mockResolvedValue(room);

      // WHEN: 완전 종료된 게임 재시작 시도
      // THEN: 성공적으로 재시작되어야 함
      await expect(gameStateManager.restartGame(room.id, 1)).resolves.not.toThrow();

      mockFindOne.mockRestore();
    });

    it('TC-016: 게임 재시작 검증 - 호스트만 재시작 가능', async () => {
      // GIVEN: 게임 방 (호스트가 아닌 사용자로 시도)
      const room = {
        id: 1,
        code: 'testgame12345678901234567890123456',
        title: '테스트 게임',
        status: RoomStatus.FINISHED,
        phase: GamePhase.RESULT,
        minPlayers: 4,
        maxPlayers: 8,
        currentPlayers: 6,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
        timeLimit: 600,
        gameSettings: {},
        hostId: 1,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
        deletedAt: null,
      } as unknown as RoomEntity;

      const mockFindOne = jest.spyOn(gameRoomRepository, 'findOne').mockResolvedValue(room);

      // WHEN: 호스트가 아닌 사용자(ID: 2)로 게임 재시작 시도
      // THEN: UnauthorizedException 발생해야 함
      await expect(gameStateManager.restartGame(room.id, 2)).rejects.toThrow('호스트만 게임을 재시작할 수 있습니다.');

      mockFindOne.mockRestore();
    });

    it('TC-017: 플레이어 상태 검증 - 이미 역할이 있는 플레이어에게 새 역할 할당 불가', async () => {
      // GIVEN: 이미 역할이 할당된 플레이어
      const playerWithRole = {
        id: 1,
        roomId: 1,
        userId: 1,
        room: {} as RoomEntity,
        user: {} as any,
        status: PlayerStatus.ACTIVE,
        joinOrder: 1,
        isHost: false,
        gameRole: GameRoleType.LIAR,
        hasVoted: false,
        voteData: null,
        gameData: null,
        lastActiveAt: null,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
        deletedAt: null,
      } as PlayerEntity;

      const mockFindOne = jest.spyOn(playerRepository, 'findOne').mockResolvedValue(playerWithRole);

      // WHEN: 이미 역할이 있는 플레이어에게 새 역할 할당 시도
      // THEN: ConflictException 발생해야 함
      await expect(gameStateManager.assignPlayerRole(1, 1, GameRoleType.CITIZEN)).rejects.toThrow('플레이어에게는 이미 역할이 할당되어 있습니다.');

      mockFindOne.mockRestore();
    });

    it('TC-018: 역할 분배 균형 검증 - 7명 이상의 플레이어는 역할 할당 불가', async () => {
      // GIVEN: 7명의 플레이어가 있는 게임 방
      const room = {
        id: 1,
        code: 'testgame12345678901234567890123456',
        title: '테스트 게임',
        status: RoomStatus.PLAYING,
        phase: GamePhase.DISCUSSION,
        minPlayers: 4,
        maxPlayers: 8,
        currentPlayers: 7, // 7명 플레이어
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
        timeLimit: 600,
        gameSettings: {},
        hostId: 1,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
        deletedAt: null,
      } as unknown as RoomEntity;

      const mockFindOne = jest.spyOn(gameRoomRepository, 'findOne').mockResolvedValue(room);

      // WHEN: 7명 플레이어에게 역할 할당 시도
      // THEN: BadRequestException 발생해야 함
      await expect(gameStateManager.assignEncryptedRoles(room.id)).rejects.toThrow('역할 수와 플레이어 수가 일치하지 않습니다.');

      mockFindOne.mockRestore();
    });

    it('TC-019: 게임 설정 검증 - 유효하지 않은 시간 제한 설정', async () => {
      // GIVEN: 유효하지 않은 게임 설정
      const createGameRoomDto: CreateGameRoomDto = {
        title: '테스트 게임',
        minPlayers: 4,
        maxPlayers: 8,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
        timeLimit: 0, // 유효하지 않은 시간 제한 (0초)
      };

      // WHEN: 유효하지 않은 설정으로 게임 방 생성 시도
      // THEN: BadRequestException 발생해야 함
      await expect(gameStateManager.createGameRoom(createGameRoomDto, 1)).rejects.toThrow('시간 제한은 1분 이상이어야 합니다.');
    });

    it('TC-020: 상태 일관성 검증 - 상태 전환 시 DB 갱신 실패 시 롤백', async () => {
      // GIVEN: 게임 방
      const room = {
        id: 1,
        code: 'testgame12345678901234567890123456',
        title: '테스트 게임',
        status: RoomStatus.WAITING,
        phase: GamePhase.LOBBY,
        minPlayers: 4,
        maxPlayers: 8,
        currentPlayers: 6,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
        timeLimit: 600,
        gameSettings: {},
        hostId: 1,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
        deletedAt: null,
      } as unknown as RoomEntity;

      const mockFindOne = jest.spyOn(gameRoomRepository, 'findOne').mockResolvedValue(room);

      // WHEN: DB 저장 실패를 시뮬레이션
      const mockSave = jest.spyOn(gameRoomRepository, 'save').mockRejectedValue(new Error('Database error'));

      // THEN: BadRequestException 발생해야 함 (DB 오류로 인한 상태 변경 실패)
      await expect(gameStateManager.startGame(room.id)).rejects.toThrow('Database error');

      mockFindOne.mockRestore();
      mockSave.mockRestore();
    });
  });
});