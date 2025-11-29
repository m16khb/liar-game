/**
 * 방 관련 보안 기능 테스트 (간소화 버전)
 * - 핵심 보안 기능 검증
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomEntity, RoomStatus, GameDifficulty } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { PlayerService } from '../player/player.service';

describe('RoomService Security Tests', () => {
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

    const module: TestingModule = await Test.createTestingModule({
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

    roomService = module.get<RoomService>(RoomService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('방 생성 시 hostId가 없으면 UnauthorizedException 발생', async () => {
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

  it('최소 인원이 2보다 작으면 BadRequestException 발생', async () => {
    const createRoomDto: CreateRoomDto = {
      title: '테스트 방',
      minPlayers: 1,
      maxPlayers: 8,
      difficulty: GameDifficulty.NORMAL,
      isPrivate: false,
    };

    await expect(roomService.createRoom(createRoomDto, 1))
      .rejects.toThrow(BadRequestException);
  });

  it('비공개 방에 비밀번호가 없으면 BadRequestException 발생', async () => {
    const createRoomDto: CreateRoomDto = {
      title: '비공개 방',
      minPlayers: 4,
      maxPlayers: 8,
      difficulty: GameDifficulty.NORMAL,
      isPrivate: true,
    };

    await expect(roomService.createRoom(createRoomDto, 1))
      .rejects.toThrow(BadRequestException);
  });

  it('잘못된 형식의 방 코드로 조회 시 BadRequestException 발생', async () => {
    await expect(roomService.findByCode('invalid'))
      .rejects.toThrow(BadRequestException);
  });

  it('방이 가득 차면 BadRequestException 발생', async () => {
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
    // 기존 플레이어가 아님 (신규 참가자)
    mockPlayerService.findPlayer.mockResolvedValue(null);

    await expect(roomService.joinRoom('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 1))
      .rejects.toThrow(BadRequestException);
  });

  it('이미 시작된 방에는 참가할 수 없음 (신규 참가자)', async () => {
    const playingRoom = {
      id: 1,
      code: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
      title: '진행중인 방',
      status: RoomStatus.PLAYING,
      minPlayers: 4,
      maxPlayers: 8,
      currentPlayers: 2,
      isPrivate: false,
    } as RoomEntity;

    mockRoomRepository.findOne.mockResolvedValue(playingRoom);
    // 기존 플레이어가 아님 (신규 참가자 - 참가 불가)
    mockPlayerService.findPlayer.mockResolvedValue(null);

    await expect(roomService.joinRoom('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 1))
      .rejects.toThrow(BadRequestException);
  });

  it('이미 시작된 방에 기존 플레이어는 재참가 가능', async () => {
    const playingRoom = {
      id: 1,
      code: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
      title: '진행중인 방',
      status: RoomStatus.PLAYING,
      minPlayers: 4,
      maxPlayers: 8,
      currentPlayers: 2,
      isPrivate: false,
    } as RoomEntity;

    mockRoomRepository.findOne.mockResolvedValue(playingRoom);
    // 기존 플레이어임 (재참가 허용)
    mockPlayerService.findPlayer.mockResolvedValue({ id: 1, roomId: 1, userId: 1 });

    const result = await roomService.joinRoom('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 1);
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
  });
});
