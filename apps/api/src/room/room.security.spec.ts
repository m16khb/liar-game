/**
 * 방 관련 보안 기능 테스트
 * - 인증 검증
 * - 입력값 검증
 * - XSS 방지
 * - SQL Injection 방지
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomEntity, RoomStatus, GameDifficulty } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { SanitizeUtil } from '@/common/utils/sanitize.util';
import dayjs from 'dayjs';

describe('RoomService Security Tests', () => {
  let roomService: RoomService;
  let roomRepository: Repository<RoomEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        {
          provide: getRepositoryToken(RoomEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    roomService = module.get<RoomService>(RoomService);
    roomRepository = module.get<Repository<RoomEntity>>(getRepositoryToken(RoomEntity));
  });

  describe('인증 검증', () => {
    it('방 생성 시 hostId가 없으면 UnauthorizedException 발생', async () => {
      // Given
      const createRoomDto: CreateRoomDto = {
        title: '테스트 방',
        minPlayers: 4,
        maxPlayers: 8,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
      };

      // When & Then
      await expect(roomService.createRoom(createRoomDto, undefined))
        .rejects.toThrow(UnauthorizedException);

      await expect(roomService.createRoom(createRoomDto, null as any))
        .rejects.toThrow(UnauthorizedException);
    });

    it('방 참가 시 userId가 없으면 UnauthorizedException 발생', async () => {
      // Given
      const roomCode = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';

      // When & Then
      const invalidUserId: any = null;
      await expect(roomService.joinRoom(roomCode, invalidUserId))
        .rejects.toThrow(UnauthorizedException);

      await expect(roomService.joinRoom(roomCode, undefined as any))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('입력값 Sanitization', () => {
    it('방 제목에서 HTML 태그 제거', async () => {
      // Given
      const maliciousTitle = '<script>alert("xss")</script>방 제목';
      const createRoomDto: CreateRoomDto = {
        title: maliciousTitle,
        minPlayers: 4,
        maxPlayers: 8,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
      };

      const mockCreate = jest.spyOn(roomRepository, 'create').mockReturnValue({
        ...createRoomDto,
        code: 'testcode12345678901234567890123456',
        hostId: 1,
        currentPlayers: 0,
      } as RoomEntity);

      const mockSave = jest.spyOn(roomRepository, 'save').mockResolvedValue({
        id: 1,
        ...createRoomDto,
        code: 'testcode12345678901234567890123456',
        hostId: 1,
        currentPlayers: 0,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
      } as RoomEntity);

      // When
      const result = await roomService.createRoom(createRoomDto, 1);

      // Then
      expect(result.title).not.toContain('<script>');
      expect(result.title).toBe('방 제목');

      mockCreate.mockRestore();
      mockSave.mockRestore();
    });

    it('방 제목에서 SQL Injection 패턴 제거', async () => {
      // Given
      const sqlInjectionTitle = "'; DROP TABLE rooms; --";
      const createRoomDto: CreateRoomDto = {
        title: sqlInjectionTitle,
        minPlayers: 4,
        maxPlayers: 8,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
      };

      const mockCreate = jest.spyOn(roomRepository, 'create').mockReturnValue({
        ...createRoomDto,
        code: 'testcode12345678901234567890123456',
        hostId: 1,
        currentPlayers: 0,
      } as RoomEntity);

      const mockSave = jest.spyOn(roomRepository, 'save').mockResolvedValue({
        id: 1,
        ...createRoomDto,
        code: 'testcode12345678901234567890123456',
        hostId: 1,
        currentPlayers: 0,
        createdAt: dayjs().toDate(),
        updatedAt: dayjs().toDate(),
      } as RoomEntity);

      // When
      const result = await roomService.createRoom(createRoomDto, 1);

      // Then
      expect(result.title).not.toContain('DROP TABLE');
      expect(result.title).not.toContain(';');

      mockCreate.mockRestore();
      mockSave.mockRestore();
    });

    it('검색어 Sanitization', async () => {
      // Given
      const maliciousKeyword = '<script>alert("xss")</script>검색어';
      const mockRooms: RoomEntity[] = [];

      const mockFind = jest.spyOn(roomRepository, 'find').mockResolvedValue(mockRooms);

      // When
      await roomService.searchRooms(maliciousKeyword);

      // Then
      expect(mockFind).toHaveBeenCalledWith({
        where: {
          title: expect.stringContaining('검색어'),
          status: RoomStatus.WAITING,
          isPrivate: false,
          deletedAt: null,
        },
        relations: ['host'],
        order: {
          createdAt: 'DESC',
        },
      });

      mockFind.mockRestore();
    });
  });

  describe('플레이어 수 검증', () => {
    it('최소 인원이 2보다 작으면 BadRequestException 발생', async () => {
      // Given
      const createRoomDto: CreateRoomDto = {
        title: '테스트 방',
        minPlayers: 1, // 2보다 작음
        maxPlayers: 8,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
      };

      // When & Then
      await expect(roomService.createRoom(createRoomDto, 1))
        .rejects.toThrow(BadRequestException);
    });

    it('최대 인원이 10보다 크면 BadRequestException 발생', async () => {
      // Given
      const createRoomDto: CreateRoomDto = {
        title: '테스트 방',
        minPlayers: 4,
        maxPlayers: 11, // 10보다 큼
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
      };

      // When & Then
      await expect(roomService.createRoom(createRoomDto, 1))
        .rejects.toThrow(BadRequestException);
    });

    it('최소 인원이 최대 인원보다 크면 BadRequestException 발생', async () => {
      // Given
      const createRoomDto: CreateRoomDto = {
        title: '테스트 방',
        minPlayers: 8,
        maxPlayers: 4, // 최소보다 작음
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
      };

      // When & Then
      await expect(roomService.createRoom(createRoomDto, 1))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('비밀번호 복잡도 검증', () => {
    it('비공개 방에 비밀번호가 없으면 BadRequestException 발생', async () => {
      // Given
      const createRoomDto: CreateRoomDto = {
        title: '비공개 방',
        minPlayers: 4,
        maxPlayers: 8,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: true,
        // password 없음
      };

      // When & Then
      await expect(roomService.createRoom(createRoomDto, 1))
        .rejects.toThrow(BadRequestException);
    });

    it('비밀번호가 너무 짧으면 BadRequestException 발생', async () => {
      // Given
      const createRoomDto: CreateRoomDto = {
        title: '비공개 방',
        minPlayers: 4,
        maxPlayers: 8,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: true,
        password: '123', // 3자
      };

      // When & Then
      await expect(roomService.createRoom(createRoomDto, 1))
        .rejects.toThrow(BadRequestException);
    });

    it('비밀번호에 위험한 패턴이 있으면 BadRequestException 발생', async () => {
      // Given
      const createRoomDto: CreateRoomDto = {
        title: '비공개 방',
        minPlayers: 4,
        maxPlayers: 8,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: true,
        password: '<script>alert("xss")</script>',
      };

      // When & Then
      await expect(roomService.createRoom(createRoomDto, 1))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('방 코드 검증', () => {
    it('잘못된 형식의 방 코드로 조회 시 BadRequestException 발생', async () => {
      // Given
      const invalidCodes = [
        'invalid-code',
        '123',
        'abcdef123456789012345678901234567', // 33자
        'GHIJKLMNOPQRSTUVWXYZ123456789012', // 대문자 포함
      ];

      for (const code of invalidCodes) {
        // When & Then
        await expect(roomService.findByCode(code))
          .rejects.toThrow(BadRequestException);
      }
    });
  });

  describe('방 참가 제한', () => {
    it('방이 가득 차면 BadRequestException 발생', async () => {
      // Given
      const fullRoom = {
        id: 1,
        code: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
        title: '가득 찬 방',
        status: RoomStatus.WAITING,
        minPlayers: 4,
        maxPlayers: 4,
        currentPlayers: 4, // 최대 인원
        isPrivate: false,
      } as RoomEntity;

      const mockFindOne = jest.spyOn(roomRepository, 'findOne').mockResolvedValue(fullRoom);
      const mockIncrement = jest.spyOn(roomService, 'incrementPlayers');

      // When & Then
      await expect(roomService.joinRoom('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 1))
        .rejects.toThrow(BadRequestException);

      mockFindOne.mockRestore();
      mockIncrement.mockRestore();
    });

    it('이미 시작된 방에는 참가할 수 없음', async () => {
      // Given
      const playingRoom = {
        id: 1,
        code: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
        title: '진행중인 방',
        status: RoomStatus.PLAYING, // 진행중
        minPlayers: 4,
        maxPlayers: 8,
        currentPlayers: 2,
        isPrivate: false,
      } as RoomEntity;

      const mockFindOne = jest.spyOn(roomRepository, 'findOne').mockResolvedValue(playingRoom);

      // When & Then
      await expect(roomService.joinRoom('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 1))
        .rejects.toThrow(BadRequestException);

      mockFindOne.mockRestore();
    });
  });

  describe('게임 설정 검증', () => {
    it('위험한 키가 포함된 게임 설정은 BadRequestException 발생', async () => {
      // Given
      const createRoomDto: CreateRoomDto = {
        title: '테스트 방',
        minPlayers: 4,
        maxPlayers: 8,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
        gameSettings: {
          __proto__: { pollute: true }, // 위험한 키
        },
      };

      // When & Then
      await expect(roomService.createRoom(createRoomDto, 1))
        .rejects.toThrow(BadRequestException);
    });

    it('게임 설정이 너무 크면 BadRequestException 발생', async () => {
      // Given
      const largeSettings = {
        data: 'x'.repeat(2000), // 2KB
      };

      const createRoomDto: CreateRoomDto = {
        title: '테스트 방',
        minPlayers: 4,
        maxPlayers: 8,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
        gameSettings: largeSettings,
      };

      // When & Then
      await expect(roomService.createRoom(createRoomDto, 1))
        .rejects.toThrow(BadRequestException);
    });
  });
});