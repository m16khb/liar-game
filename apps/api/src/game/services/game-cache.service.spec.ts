import { Test, TestingModule } from '@nestjs/testing';
import { GameCacheService } from './game-cache.service';

/**
 * 게임 캐시 서비스 테스트
 * Redis를 사용한 게임 상태 캐싱 기능을 검증합니다.
 */
describe('GameCacheService', () => {
  let service: GameCacheService;
  let redisMock: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    exists: jest.Mock;
  };

  beforeEach(async () => {
    // Redis 모의 객체 생성
    redisMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameCacheService,
        {
          provide: 'REDIS_CLIENT',
          useValue: redisMock,
        },
      ],
    }).compile();

    service = module.get<GameCacheService>(GameCacheService);
  });

  describe('게임 상태 캐싱', () => {
    /**
     * AC-5.3: Redis 캐싱 동작
     * 게임 상태를 Redis에 캐싱하고, 캐시된 상태를 빠르게 조회할 수 있는지 검증합니다.
     */
    describe('getGameState', () => {
      it('캐시가 있으면 Redis에서 조회해야 한다', async () => {
        const roomId = 1;
        const cachedState = {
          roomId,
          phase: 'DISCUSSION',
          turnOrder: [1, 2, 3],
          currentTurn: 1,
        };

        redisMock.get.mockResolvedValue(JSON.stringify(cachedState));

        const result = await service.getGameState(roomId);

        expect(redisMock.get).toHaveBeenCalledWith(`game:state:${roomId}`);
        expect(result).toEqual(cachedState);
      });

      it('캐시가 없으면 null을 반환해야 한다', async () => {
        const roomId = 1;
        redisMock.get.mockResolvedValue(null);

        const result = await service.getGameState(roomId);

        expect(redisMock.get).toHaveBeenCalledWith(`game:state:${roomId}`);
        expect(result).toBeNull();
      });
    });

    /**
     * 게임 상태를 Redis에 저장합니다.
     */
    describe('setGameState', () => {
      it('게임 상태를 Redis에 저장해야 한다 (TTL: 1시간)', async () => {
        const roomId = 1;
        const gameState = {
          roomId,
          phase: 'DISCUSSION',
          turnOrder: [1, 2, 3],
          currentTurn: 1,
        };

        redisMock.set.mockResolvedValue('OK');

        await service.setGameState(roomId, gameState);

        expect(redisMock.set).toHaveBeenCalledWith(
          `game:state:${roomId}`,
          JSON.stringify(gameState),
          'EX',
          3600, // 1시간
        );
      });

      it('게임 상태를 저장한 후 검증할 수 있어야 한다', async () => {
        const roomId = 1;
        const gameState = {
          roomId,
          phase: 'VOTING',
          turnOrder: [1, 2, 3],
          currentTurn: 2,
        };

        redisMock.set.mockResolvedValue('OK');
        redisMock.get.mockResolvedValue(JSON.stringify(gameState));

        await service.setGameState(roomId, gameState);
        const retrieved = await service.getGameState(roomId);

        expect(retrieved).toEqual(gameState);
      });
    });

    /**
     * 게임 상태를 캐시에서 삭제합니다.
     */
    describe('deleteGameState', () => {
      it('캐시된 게임 상태를 삭제해야 한다', async () => {
        const roomId = 1;

        redisMock.del.mockResolvedValue(1);

        await service.deleteGameState(roomId);

        expect(redisMock.del).toHaveBeenCalledWith(`game:state:${roomId}`);
      });

      it('삭제 후 캐시가 없어야 한다', async () => {
        const roomId = 1;

        redisMock.del.mockResolvedValue(1);
        redisMock.get.mockResolvedValue(null);

        await service.deleteGameState(roomId);
        const result = await service.getGameState(roomId);

        expect(result).toBeNull();
      });
    });
  });

  describe('역할 정보 캐싱', () => {
    /**
     * 역할 배정 정보를 Redis에 저장합니다.
     */
    describe('setRoles', () => {
      it('역할 정보를 Redis에 암호화된 형태로 저장해야 한다', async () => {
        const roomId = 1;
        const roles = new Map([
          [1, { type: 'LIAR', userId: 1 }],
          [2, { type: 'CIVILIAN', userId: 2 }],
        ]);

        redisMock.set.mockResolvedValue('OK');

        await service.setRoles(roomId, roles);

        expect(redisMock.set).toHaveBeenCalled();
        const callArgs = redisMock.set.mock.calls[0];
        expect(callArgs[0]).toBe(`game:roles:${roomId}`);
        expect(callArgs[2]).toBe('EX');
        expect(callArgs[3]).toBe(3600);
      });
    });

    /**
     * 역할 배정 정보를 Redis에서 조회합니다.
     */
    describe('getRoles', () => {
      it('저장된 역할 정보를 조회해야 한다', async () => {
        const roomId = 1;
        const roles = new Map([
          [1, { type: 'LIAR', userId: 1 }],
          [2, { type: 'CIVILIAN', userId: 2 }],
        ]);

        const serialized = JSON.stringify(Array.from(roles.entries()));
        redisMock.get.mockResolvedValue(serialized);

        const result = await service.getRoles(roomId);

        expect(redisMock.get).toHaveBeenCalledWith(`game:roles:${roomId}`);
        expect(result).toEqual(roles);
      });

      it('캐시가 없으면 null을 반환해야 한다', async () => {
        const roomId = 1;
        redisMock.get.mockResolvedValue(null);

        const result = await service.getRoles(roomId);

        expect(result).toBeNull();
      });
    });

    /**
     * 역할 정보를 캐시에서 삭제합니다.
     */
    describe('deleteRoles', () => {
      it('역할 정보를 캐시에서 삭제해야 한다', async () => {
        const roomId = 1;

        redisMock.del.mockResolvedValue(1);

        await service.deleteRoles(roomId);

        expect(redisMock.del).toHaveBeenCalledWith(`game:roles:${roomId}`);
      });
    });
  });

  describe('키워드 정보 캐싱', () => {
    /**
     * 키워드 정보를 Redis에 저장합니다.
     */
    describe('setKeyword', () => {
      it('키워드 정보를 Redis에 저장해야 한다', async () => {
        const roomId = 1;
        const keyword = {
          id: 1,
          word: '사과',
          category: '과일',
          difficulty: 'EASY',
        };

        redisMock.set.mockResolvedValue('OK');

        await service.setKeyword(roomId, keyword);

        expect(redisMock.set).toHaveBeenCalledWith(
          `game:keyword:${roomId}`,
          JSON.stringify(keyword),
          'EX',
          3600,
        );
      });
    });

    /**
     * 키워드 정보를 Redis에서 조회합니다.
     */
    describe('getKeyword', () => {
      it('저장된 키워드 정보를 조회해야 한다', async () => {
        const roomId = 1;
        const keyword = {
          id: 1,
          word: '사과',
          category: '과일',
          difficulty: 'EASY',
        };

        redisMock.get.mockResolvedValue(JSON.stringify(keyword));

        const result = await service.getKeyword(roomId);

        expect(redisMock.get).toHaveBeenCalledWith(`game:keyword:${roomId}`);
        expect(result).toEqual(keyword);
      });

      it('캐시가 없으면 null을 반환해야 한다', async () => {
        const roomId = 1;
        redisMock.get.mockResolvedValue(null);

        const result = await service.getKeyword(roomId);

        expect(result).toBeNull();
      });
    });

    /**
     * 키워드 정보를 캐시에서 삭제합니다.
     */
    describe('deleteKeyword', () => {
      it('키워드 정보를 캐시에서 삭제해야 한다', async () => {
        const roomId = 1;

        redisMock.del.mockResolvedValue(1);

        await service.deleteKeyword(roomId);

        expect(redisMock.del).toHaveBeenCalledWith(`game:keyword:${roomId}`);
      });
    });
  });

  describe('투표 정보 캐싱', () => {
    /**
     * 투표 정보를 Redis에 저장합니다.
     */
    describe('setVotes', () => {
      it('투표 정보를 Redis에 저장해야 한다', async () => {
        const roomId = 1;
        const votes = new Map([[1, 2], [2, 1], [3, 1]]);

        redisMock.set.mockResolvedValue('OK');

        await service.setVotes(roomId, votes);

        expect(redisMock.set).toHaveBeenCalled();
        const callArgs = redisMock.set.mock.calls[0];
        expect(callArgs[0]).toBe(`game:votes:${roomId}`);
        expect(callArgs[2]).toBe('EX');
      });
    });

    /**
     * 투표 정보를 Redis에서 조회합니다.
     */
    describe('getVotes', () => {
      it('저장된 투표 정보를 조회해야 한다', async () => {
        const roomId = 1;
        const votes = new Map([[1, 2], [2, 1], [3, 1]]);

        const serialized = JSON.stringify(Array.from(votes.entries()));
        redisMock.get.mockResolvedValue(serialized);

        const result = await service.getVotes(roomId);

        expect(redisMock.get).toHaveBeenCalledWith(`game:votes:${roomId}`);
        expect(result).toEqual(votes);
      });

      it('캐시가 없으면 null을 반환해야 한다', async () => {
        const roomId = 1;
        redisMock.get.mockResolvedValue(null);

        const result = await service.getVotes(roomId);

        expect(result).toBeNull();
      });
    });

    /**
     * 투표 정보를 캐시에서 삭제합니다.
     */
    describe('deleteVotes', () => {
      it('투표 정보를 캐시에서 삭제해야 한다', async () => {
        const roomId = 1;

        redisMock.del.mockResolvedValue(1);

        await service.deleteVotes(roomId);

        expect(redisMock.del).toHaveBeenCalledWith(`game:votes:${roomId}`);
      });
    });
  });

  describe('게임 캐시 전체 삭제', () => {
    /**
     * 게임 종료 시 모든 캐시를 삭제합니다.
     */
    describe('clearGameCache', () => {
      it('게임 관련 모든 캐시를 삭제해야 한다', async () => {
        const roomId = 1;

        redisMock.del.mockResolvedValue(4);

        await service.clearGameCache(roomId);

        expect(redisMock.del).toHaveBeenCalledWith([
          `game:state:${roomId}`,
          `game:roles:${roomId}`,
          `game:keyword:${roomId}`,
          `game:votes:${roomId}`,
        ]);
      });

      it('여러 번 호출해도 에러가 나지 않아야 한다', async () => {
        const roomId = 1;

        redisMock.del.mockResolvedValue(0);

        await expect(service.clearGameCache(roomId)).resolves.not.toThrow();
      });
    });
  });

  describe('캐시 유효성 검증', () => {
    /**
     * 캐시 존재 여부를 확인합니다.
     */
    describe('existsGameState', () => {
      it('캐시가 있으면 true를 반환해야 한다', async () => {
        const roomId = 1;

        redisMock.exists.mockResolvedValue(1);

        const result = await service.existsGameState(roomId);

        expect(redisMock.exists).toHaveBeenCalledWith(`game:state:${roomId}`);
        expect(result).toBe(true);
      });

      it('캐시가 없으면 false를 반환해야 한다', async () => {
        const roomId = 1;

        redisMock.exists.mockResolvedValue(0);

        const result = await service.existsGameState(roomId);

        expect(result).toBe(false);
      });
    });
  });
});
