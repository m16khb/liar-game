// @TEST:ROOM-001 | SPEC: .moai/specs/SPEC-ROOM-001/spec.md
// @TEST:ROOM-001: 방 생성, 조회, 입장, 삭제 테스트

import { Test, TestingModule } from '@nestjs/testing';
import { RoomService } from '../../src/room/room.service';
import RedisMock from 'ioredis-mock';

describe('RoomService - @TEST:ROOM-001', () => {
  let service: RoomService;
  let redisMock: InstanceType<typeof RedisMock>;

  beforeEach(async () => {
    redisMock = new RedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        {
          provide: 'REDIS_CLIENT',
          useValue: redisMock,
        },
      ],
    }).compile();

    service = module.get<RoomService>(RoomService);
  });

  afterEach(async () => {
    await redisMock.flushall();
  });

  describe('createRoom - 방 생성', () => {
    it('TEST-ROOM-001-CREATE: UUID v4 형식의 방 코드를 생성해야 한다', async () => {
      // Given: 방 설정
      const hostId = 'user-123';
      const settings = {
        maxPlayers: 8,
        discussionTime: 180,
        isPublic: true,
      };

      // When: 방 생성
      const result = await service.createRoom(hostId, settings);

      // Then: UUID v4 형식 검증 (8-4-4-4-12)
      const uuidV4Regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(result.code).toMatch(uuidV4Regex);
      expect(result.url).toContain(result.code);
    });

    it('TEST-ROOM-001-CREATE-TTL: 방은 24시간 TTL을 가져야 한다', async () => {
      // Given: 방 설정
      const hostId = 'user-123';
      const settings = {
        maxPlayers: 8,
        discussionTime: 180,
        isPublic: true,
      };

      // When: 방 생성
      const result = await service.createRoom(hostId, settings);

      // Then: Redis TTL 확인 (24시간 = 86400초)
      const ttl = await redisMock.ttl(`room:${result.code}`);
      expect(ttl).toBeGreaterThan(86000); // 약간의 여유
      expect(ttl).toBeLessThanOrEqual(86400);
    });

    it('TEST-ROOM-001-CREATE-METADATA: 방 메타데이터가 정확히 저장되어야 한다', async () => {
      // Given: 방 설정
      const hostId = 'user-123';
      const settings = {
        maxPlayers: 8,
        discussionTime: 180,
        isPublic: true,
      };

      // When: 방 생성
      const result = await service.createRoom(hostId, settings);

      // Then: Redis에서 방 메타데이터 조회
      const roomData = await redisMock.get(`room:${result.code}`);
      expect(roomData).toBeTruthy();

      const room = JSON.parse(roomData!);
      expect(room.code).toBe(result.code);
      expect(room.hostId).toBe(hostId);
      expect(room.players).toHaveLength(1); // 방장만 있음
      expect(room.players[0].id).toBe(hostId);
      expect(room.players[0].isHost).toBe(true);
      expect(room.status).toBe('waiting');
      expect(room.settings).toEqual(settings);
    });
  });

  describe('getRoom - 방 조회', () => {
    it('TEST-ROOM-001-GET: 존재하는 방을 조회할 수 있어야 한다', async () => {
      // Given: 방 생성
      const hostId = 'user-123';
      const settings = {
        maxPlayers: 8,
        discussionTime: 180,
        isPublic: true,
      };
      const created = await service.createRoom(hostId, settings);

      // When: 방 조회
      const room = await service.getRoom(created.code);

      // Then: 방 정보 검증
      expect(room).toBeTruthy();
      expect(room!.code).toBe(created.code);
      expect(room!.hostId).toBe(hostId);
      expect(room!.players).toHaveLength(1);
    });

    it('TEST-ROOM-001-GET-NOTFOUND: 존재하지 않는 방 조회 시 null을 반환해야 한다', async () => {
      // Given: 존재하지 않는 방 코드
      const invalidCode = '550e8400-e29b-41d4-a716-446655440000';

      // When: 방 조회
      const room = await service.getRoom(invalidCode);

      // Then: null 반환
      expect(room).toBeNull();
    });
  });

  describe('joinRoom - 방 입장', () => {
    it('TEST-ROOM-001-JOIN: 플레이어가 방에 입장할 수 있어야 한다', async () => {
      // Given: 방 생성
      const hostId = 'user-123';
      const playerId = 'user-456';
      const settings = {
        maxPlayers: 8,
        discussionTime: 180,
        isPublic: true,
      };
      const created = await service.createRoom(hostId, settings);

      // When: 플레이어 입장
      const playerInfo = {
        id: playerId,
        username: '플레이어2',
      };
      await service.joinRoom(created.code, playerInfo);

      // Then: 방 조회 시 플레이어 2명 확인
      const room = await service.getRoom(created.code);
      expect(room).toBeTruthy();
      expect(room!.players).toHaveLength(2);
      expect(room!.players[1].id).toBe(playerId);
      expect(room!.players[1].username).toBe('플레이어2');
      expect(room!.players[1].isHost).toBe(false);
      expect(room!.players[1].isReady).toBe(false);
    });

    it('TEST-ROOM-001-JOIN-MAX: 최대 인원 초과 시 입장을 차단해야 한다', async () => {
      // Given: 최대 인원 2명인 방 생성
      const hostId = 'user-123';
      const settings = {
        maxPlayers: 2,
        discussionTime: 180,
        isPublic: true,
      };
      const created = await service.createRoom(hostId, settings);

      // 첫 번째 플레이어 입장 성공
      await service.joinRoom(created.code, {
        id: 'user-456',
        username: '플레이어2',
      });

      // When: 두 번째 플레이어 입장 시도 (최대 인원 초과)
      // Then: 에러 발생
      await expect(
        service.joinRoom(created.code, {
          id: 'user-789',
          username: '플레이어3',
        }),
      ).rejects.toThrow('방 인원이 가득 찼습니다');
    });

    it('TEST-ROOM-001-JOIN-DUPLICATE: 중복 입장 시도 시 차단해야 한다', async () => {
      // Given: 방 생성
      const hostId = 'user-123';
      const playerId = 'user-456';
      const settings = {
        maxPlayers: 8,
        discussionTime: 180,
        isPublic: true,
      };
      const created = await service.createRoom(hostId, settings);

      // 첫 번째 입장 성공
      await service.joinRoom(created.code, {
        id: playerId,
        username: '플레이어2',
      });

      // When: 같은 사용자 재입장 시도
      // Then: 에러 발생
      await expect(
        service.joinRoom(created.code, {
          id: playerId,
          username: '플레이어2',
        }),
      ).rejects.toThrow('이미 방에 참여 중입니다');
    });
  });

  describe('leaveRoom - 방 퇴장', () => {
    it('TEST-ROOM-001-LEAVE: 플레이어가 방을 나갈 수 있어야 한다', async () => {
      // Given: 방 생성 및 플레이어 입장
      const hostId = 'user-123';
      const playerId = 'user-456';
      const settings = {
        maxPlayers: 8,
        discussionTime: 180,
        isPublic: true,
      };
      const created = await service.createRoom(hostId, settings);
      await service.joinRoom(created.code, {
        id: playerId,
        username: '플레이어2',
      });

      // When: 플레이어 퇴장
      await service.leaveRoom(created.code, playerId);

      // Then: 방 조회 시 플레이어 1명만 남음
      const room = await service.getRoom(created.code);
      expect(room).toBeTruthy();
      expect(room!.players).toHaveLength(1);
      expect(room!.players[0].id).toBe(hostId);
    });

    it('TEST-ROOM-001-LEAVE-DELETE: 마지막 플레이어가 나가면 방이 삭제되어야 한다', async () => {
      // Given: 방 생성
      const hostId = 'user-123';
      const settings = {
        maxPlayers: 8,
        discussionTime: 180,
        isPublic: true,
      };
      const created = await service.createRoom(hostId, settings);

      // When: 방장이 방을 나감 (마지막 플레이어)
      await service.leaveRoom(created.code, hostId);

      // Then: 방이 삭제됨
      const room = await service.getRoom(created.code);
      expect(room).toBeNull();
    });
  });
});
