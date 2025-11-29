/**
 * SPEC-LOBBY-001 검증 테스트
 * RoomService 핵심 기능 검증
 */

import { RoomService } from './room.service';
import { RoomEntity, RoomStatus, GameDifficulty } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { PlayerService } from '../player/player.service';

describe('SPEC-LOBBY-001: Room Service Verification', () => {
  let roomService: RoomService;

  const mockRoomRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softDelete: jest.fn(),
    update: jest.fn(),
  };

  const mockPlayerService = {
    findPlayer: jest.fn().mockResolvedValue(null),
    addPlayer: jest.fn(),
    removePlayer: jest.fn(),
    getPlayers: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        {
          provide: getRepositoryToken(RoomEntity),
          useValue: mockRoomRepository,
        },
        {
          provide: PlayerService,
          useValue: mockPlayerService,
        },
      ],
    }).compile();

    roomService = moduleRef.get<RoomService>(RoomService);
  });

  describe('방 생성 테스트', () => {
    it('인증된 사용자가 유효한 DTO로 방 생성 성공', async () => {
      const createRoomDto: CreateRoomDto = {
        title: '테스트 방',
        minPlayers: 4,
        maxPlayers: 8,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
      };

      mockRoomRepository.findOne.mockResolvedValue(null);
      mockRoomRepository.create.mockImplementation((dto) => ({
        ...dto,
        id: 1,
      }));
      mockRoomRepository.save.mockImplementation((entity) => Promise.resolve({
        ...entity,
        id: 1,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
      }));

      const result = await roomService.createRoom(createRoomDto, 1);

      expect(result.code).toHaveLength(32);
      expect(result.code).toMatch(/^[a-f0-9]+$/);
      expect(result.hostId).toBe(1);
      expect(result.title).toBe('테스트 방');
    });

    it('미인증 사용자 방 생성 시 UnauthorizedException 발생', async () => {
      const createRoomDto: CreateRoomDto = {
        title: '테스트 방',
        minPlayers: 4,
        maxPlayers: 8,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
      };

      await expect(roomService.createRoom(createRoomDto, undefined))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('방 목록 조회 테스트', () => {
    it('대기 중인 방 목록 조회 성공', async () => {
      const mockRooms = [
        {
          id: 1,
          code: 'testcode12345678901234567890123456',
          title: '테스트 방',
          status: RoomStatus.WAITING,
          minPlayers: 4,
          maxPlayers: 8,
          currentPlayers: 2,
          isPrivate: false,
          createdAt: dayjs().toDate(),
          updatedAt: dayjs().toDate(),
          host: null,
        } as unknown as RoomEntity,
      ];

      mockRoomRepository.find.mockResolvedValue(mockRooms);

      const result = await roomService.findAllRooms();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('테스트 방');
    });
  });

  describe('방 검색 테스트', () => {
    it('2자 미만 검색어 요청 시 BadRequestException 발생', async () => {
      await expect(roomService.searchRooms('a'))
        .rejects.toThrow(BadRequestException);
    });

    it('유효한 검색어로 방 검색 성공', async () => {
      mockRoomRepository.find.mockResolvedValue([]);

      const result = await roomService.searchRooms('테스트');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('방 코드로 조회 테스트', () => {
    it('존재하지 않는 코드로 조회 시 NotFoundException 발생', async () => {
      const validCode = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
      mockRoomRepository.findOne.mockResolvedValue(null);

      await expect(roomService.findByCode(validCode))
        .rejects.toThrow(NotFoundException);
    });

    it('유효한 코드로 방 조회 성공', async () => {
      const validCode = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
      const mockRoom = {
        id: 1,
        code: validCode,
        title: '테스트 방',
        status: RoomStatus.WAITING,
        minPlayers: 4,
        maxPlayers: 8,
        currentPlayers: 2,
        isPrivate: false,
        host: { id: 1, nickname: '호스트' },
      } as RoomEntity;

      mockRoomRepository.findOne.mockResolvedValue(mockRoom);

      const result = await roomService.findByCode(validCode);

      expect(result).toBeDefined();
      expect(result.code).toBe(validCode);
      expect(result.host?.nickname).toBe('호스트');
    });
  });

  describe('방 참가 테스트', () => {
    it('방이 가득 차면 참가 불가', async () => {
      const fullRoom = {
        id: 1,
        code: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
        title: '가득 찬 방',
        status: RoomStatus.WAITING,
        minPlayers: 4,
        maxPlayers: 4,
        currentPlayers: 4,
        isPrivate: false,
      } as RoomEntity;

      mockRoomRepository.findOne.mockResolvedValue(fullRoom);

      await expect(roomService.joinRoom('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 1))
        .rejects.toThrow(BadRequestException);
    });

    it('진행 중인 방에는 참가 불가', async () => {
      const playingRoom = {
        id: 1,
        code: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
        title: '진행중인 방',
        status: RoomStatus.PLAYING,
        minPlayers: 4,
        maxPlayers: 8,
        currentPlayers: 4,
        isPrivate: false,
      } as RoomEntity;

      mockRoomRepository.findOne.mockResolvedValue(playingRoom);

      await expect(roomService.joinRoom('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 1))
        .rejects.toThrow(BadRequestException);
    });

    it('대기 중인 방에 성공적으로 참가', async () => {
      const waitingRoom = {
        id: 1,
        code: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
        title: '대기중인 방',
        status: RoomStatus.WAITING,
        minPlayers: 4,
        maxPlayers: 8,
        currentPlayers: 2,
        isPrivate: false,
      } as RoomEntity;

      mockRoomRepository.findOne.mockResolvedValue(waitingRoom);
      mockRoomRepository.update.mockResolvedValue({ affected: 1 });
      mockPlayerService.findPlayer.mockResolvedValue(null);
      mockPlayerService.addPlayer.mockResolvedValue({});

      const result = await roomService.joinRoom('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 1);

      expect(result).toBeDefined();
    });
  });
});
