// @TEST:ROOM-001 | SPEC: .moai/specs/SPEC-ROOM-001/spec.md
// @TEST:ROOM-001: Socket.IO 실시간 동기화 테스트

import { Test, TestingModule } from '@nestjs/testing';
import { RoomGateway } from '../../src/room/room.gateway';
import { RoomService } from '../../src/room/room.service';
import RedisMock from 'ioredis-mock';
import { Socket } from 'socket.io';

describe('RoomGateway - @TEST:ROOM-001', () => {
  let gateway: RoomGateway;
  let service: RoomService;
  let redisMock: InstanceType<typeof RedisMock>;

  // Mock Socket
  const createMockSocket = (
    userId: string,
    username: string,
  ): Partial<Socket> => {
    return {
      id: `socket-${userId}`,
      data: { userId, username },
      join: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
  };

  // Mock Server
  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  beforeEach(async () => {
    redisMock = new RedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomGateway,
        RoomService,
        {
          provide: 'REDIS_CLIENT',
          useValue: redisMock,
        },
      ],
    }).compile();

    gateway = module.get<RoomGateway>(RoomGateway);
    service = module.get<RoomService>(RoomService);

    // Gateway에 Mock Server 주입
    (gateway as any).server = mockServer;
  });

  afterEach(async () => {
    await redisMock.flushall();
    jest.clearAllMocks();
  });

  describe('handleJoinRoom - 방 입장', () => {
    it('TEST-ROOM-001-WS-JOIN: 플레이어 입장 시 Socket.IO 방에 join하고 브로드캐스트해야 한다', async () => {
      // Given: 방 생성
      const hostId = 'user-123';
      const settings = {
        maxPlayers: 8,
        discussionTime: 180,
        isPublic: true,
      };
      const room = await service.createRoom(hostId, settings);

      // 새 플레이어 소켓
      const playerSocket = createMockSocket('user-456', '플레이어2') as Socket;

      // When: 방 입장
      await gateway.handleJoinRoom(playerSocket, {
        roomCode: room.code,
        username: '플레이어2',
      });

      // Then: Socket.IO 방에 join 호출
      expect(playerSocket.join).toHaveBeenCalledWith(room.code);

      // Then: 다른 참여자에게 입장 알림 브로드캐스트
      expect(mockServer.to).toHaveBeenCalledWith(room.code);
      expect(mockServer.emit).toHaveBeenCalledWith(
        'room:player-joined',
        expect.objectContaining({
          id: 'user-456',
          username: '플레이어2',
          isReady: false,
          isHost: false,
        }),
      );
    });

    it('TEST-ROOM-001-WS-JOIN-ERROR: 존재하지 않는 방 입장 시 에러를 emit해야 한다', async () => {
      // Given: 존재하지 않는 방 코드
      const invalidCode = '550e8400-e29b-41d4-a716-446655440000';
      const playerSocket = createMockSocket('user-456', '플레이어2') as Socket;

      // When: 방 입장 시도
      await gateway.handleJoinRoom(playerSocket, {
        roomCode: invalidCode,
        username: '플레이어2',
      });

      // Then: 에러 emit
      expect(playerSocket.emit).toHaveBeenCalledWith(
        'room:error',
        expect.objectContaining({
          message: '존재하지 않는 방입니다',
        }),
      );
    });
  });

  describe('handleLeaveRoom - 방 퇴장', () => {
    it('TEST-ROOM-001-WS-LEAVE: 플레이어 퇴장 시 다른 참여자에게 알림을 브로드캐스트해야 한다', async () => {
      // Given: 방 생성 및 플레이어 입장
      const hostId = 'user-123';
      const settings = {
        maxPlayers: 8,
        discussionTime: 180,
        isPublic: true,
      };
      const room = await service.createRoom(hostId, settings);

      await service.joinRoom(room.code, {
        id: 'user-456',
        username: '플레이어2',
      });

      const playerSocket = createMockSocket('user-456', '플레이어2') as Socket;

      // When: 방 퇴장
      await gateway.handleLeaveRoom(playerSocket, {
        roomCode: room.code,
      });

      // Then: 다른 참여자에게 퇴장 알림 브로드캐스트
      expect(mockServer.to).toHaveBeenCalledWith(room.code);
      expect(mockServer.emit).toHaveBeenCalledWith(
        'room:player-left',
        expect.objectContaining({
          userId: 'user-456',
        }),
      );
    });
  });

  describe('handlePlayerReady - 준비 상태 변경', () => {
    it('TEST-ROOM-001-WS-READY: 플레이어 준비 상태 변경 시 브로드캐스트해야 한다', async () => {
      // Given: 방 생성
      const hostId = 'user-123';
      const settings = {
        maxPlayers: 8,
        discussionTime: 180,
        isPublic: true,
      };
      const room = await service.createRoom(hostId, settings);

      const playerSocket = createMockSocket(hostId, '방장') as Socket;

      // When: 준비 완료 토글
      await gateway.handlePlayerReady(playerSocket, {
        roomCode: room.code,
        isReady: true,
      });

      // Then: 모든 참여자에게 준비 상태 브로드캐스트
      expect(mockServer.to).toHaveBeenCalledWith(room.code);
      expect(mockServer.emit).toHaveBeenCalledWith(
        'room:player-ready',
        expect.objectContaining({
          userId: hostId,
          isReady: true,
        }),
      );
    });
  });

  describe('handleUpdateSettings - 방 설정 수정', () => {
    it('TEST-ROOM-001-WS-UPDATE: 방장이 방 설정을 수정하면 브로드캐스트해야 한다', async () => {
      // Given: 방 생성
      const hostId = 'user-123';
      const settings = {
        maxPlayers: 8,
        discussionTime: 180,
        isPublic: true,
      };
      const room = await service.createRoom(hostId, settings);

      const hostSocket = createMockSocket(hostId, '방장') as Socket;

      // When: 방 설정 수정
      const newSettings = {
        maxPlayers: 10,
        discussionTime: 240,
        isPublic: false,
      };
      await gateway.handleUpdateSettings(hostSocket, {
        roomCode: room.code,
        settings: newSettings,
      });

      // Then: 모든 참여자에게 설정 변경 브로드캐스트
      expect(mockServer.to).toHaveBeenCalledWith(room.code);
      expect(mockServer.emit).toHaveBeenCalledWith(
        'room:settings-updated',
        expect.objectContaining({
          settings: newSettings,
        }),
      );
    });

    it('TEST-ROOM-001-WS-UPDATE-AUTH: 방장이 아닌 사용자의 설정 수정 시도는 차단해야 한다', async () => {
      // Given: 방 생성 및 플레이어 입장
      const hostId = 'user-123';
      const settings = {
        maxPlayers: 8,
        discussionTime: 180,
        isPublic: true,
      };
      const room = await service.createRoom(hostId, settings);

      await service.joinRoom(room.code, {
        id: 'user-456',
        username: '플레이어2',
      });

      const playerSocket = createMockSocket('user-456', '플레이어2') as Socket;

      // When: 일반 플레이어의 설정 수정 시도
      await gateway.handleUpdateSettings(playerSocket, {
        roomCode: room.code,
        settings: { maxPlayers: 10, discussionTime: 240, isPublic: false },
      });

      // Then: 에러 emit
      expect(playerSocket.emit).toHaveBeenCalledWith(
        'room:error',
        expect.objectContaining({
          message: '방장만 설정을 변경할 수 있습니다',
        }),
      );
    });
  });

  describe('handleStartGame - 게임 시작', () => {
    it('TEST-ROOM-001-WS-START: 방장이 게임을 시작하면 모든 참여자에게 알림을 보내야 한다', async () => {
      // Given: 방 생성 및 플레이어 4명 입장 (최소 인원)
      const hostId = 'user-123';
      const settings = {
        maxPlayers: 8,
        discussionTime: 180,
        isPublic: true,
      };
      const room = await service.createRoom(hostId, settings);

      // 3명 추가 (총 4명)
      for (let i = 2; i <= 4; i++) {
        await service.joinRoom(room.code, {
          id: `user-${i}00`,
          username: `플레이어${i}`,
        });
      }

      const hostSocket = createMockSocket(hostId, '방장') as Socket;

      // When: 게임 시작
      await gateway.handleStartGame(hostSocket, {
        roomCode: room.code,
      });

      // Then: 모든 참여자에게 게임 시작 알림
      expect(mockServer.to).toHaveBeenCalledWith(room.code);
      expect(mockServer.emit).toHaveBeenCalledWith(
        'game:started',
        expect.objectContaining({
          roomCode: room.code,
        }),
      );
    });

    it('TEST-ROOM-001-WS-START-MIN: 최소 인원 미달 시 게임 시작을 차단해야 한다', async () => {
      // Given: 방 생성 (방장만 있음, 최소 4명 필요)
      const hostId = 'user-123';
      const settings = {
        maxPlayers: 8,
        discussionTime: 180,
        isPublic: true,
      };
      const room = await service.createRoom(hostId, settings);

      const hostSocket = createMockSocket(hostId, '방장') as Socket;

      // When: 게임 시작 시도
      await gateway.handleStartGame(hostSocket, {
        roomCode: room.code,
      });

      // Then: 에러 emit
      expect(hostSocket.emit).toHaveBeenCalledWith(
        'room:error',
        expect.objectContaining({
          message: '최소 4명 이상의 플레이어가 필요합니다',
        }),
      );
    });
  });
});
