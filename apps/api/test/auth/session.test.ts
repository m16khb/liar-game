// @TEST:AUTH-001 | SPEC: SPEC-AUTH-001.md
import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SessionService, SessionData, GuestSessionData } from '../../src/auth/session.service';

describe('@TEST:AUTH-001:SESSION - Redis 세션 관리', () => {
  let service: SessionService;
  let cacheManager: any;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionService, { provide: CACHE_MANAGER, useValue: mockCacheManager }],
    }).compile();

    service = module.get<SessionService>(SessionService);
    cacheManager = module.get(CACHE_MANAGER);
    jest.clearAllMocks();
  });

  describe('REQ-004: 세션 생성 및 조회', () => {
    it('등록 유저 세션 생성 성공 (TTL 30일)', async () => {
      const userId = 'user-id';
      const sessionData: SessionData = {
        id: userId,
        username: 'testuser',
        role: 'USER',
        lastActivity: Date.now(),
      };

      await service.createSession(userId, sessionData);

      expect(mockCacheManager.set).toHaveBeenCalledWith(`session:${userId}`, sessionData, 30 * 24 * 60 * 60);
    });

    it('게스트 세션 생성 성공 (TTL 7일)', async () => {
      const sessionId = 'guest-session-id';
      const guestData: GuestSessionData = {
        username: 'GuestUser',
        createdAt: Date.now(),
      };

      await service.createGuestSession(sessionId, guestData);

      expect(mockCacheManager.set).toHaveBeenCalledWith(`guest:session:${sessionId}`, guestData, 7 * 24 * 60 * 60);
    });

    it('세션 조회 성공', async () => {
      const userId = 'user-id';
      const sessionData: SessionData = {
        id: userId,
        username: 'testuser',
        role: 'USER',
        lastActivity: Date.now(),
      };

      mockCacheManager.get.mockResolvedValue(sessionData);

      const result = await service.getSession(userId);

      expect(result).toEqual(sessionData);
      expect(mockCacheManager.get).toHaveBeenCalledWith(`session:${userId}`);
    });

    it('게스트 세션 조회 성공', async () => {
      const sessionId = 'guest-session-id';
      const guestData: GuestSessionData = {
        username: 'GuestUser',
        createdAt: Date.now(),
      };

      mockCacheManager.get.mockResolvedValue(guestData);

      const result = await service.getGuestSession(sessionId);

      expect(result).toEqual(guestData);
      expect(mockCacheManager.get).toHaveBeenCalledWith(`guest:session:${sessionId}`);
    });

    it('존재하지 않는 세션 조회 시 null 반환', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.getSession('non-existent-session');

      expect(result).toBeNull();
    });
  });

  describe('세션 삭제', () => {
    it('세션 삭제 성공', async () => {
      const userId = 'user-id';

      const result = await service.deleteSession(userId);

      expect(result).toBe(true);
      expect(mockCacheManager.del).toHaveBeenCalledWith(`session:${userId}`);
    });

    it('게스트 세션 삭제 성공', async () => {
      const sessionId = 'guest-session-id';

      const result = await service.deleteGuestSession(sessionId);

      expect(result).toBe(true);
      expect(mockCacheManager.del).toHaveBeenCalledWith(`guest:session:${sessionId}`);
    });
  });

  describe('세션 TTL 갱신', () => {
    it('세션 활동 갱신 성공', async () => {
      const userId = 'user-id';
      const sessionData: SessionData = {
        id: userId,
        username: 'testuser',
        role: 'USER',
        lastActivity: Date.now() - 1000,
      };

      mockCacheManager.get.mockResolvedValue(sessionData);

      const result = await service.renewSessionTTL(userId);

      expect(result).toBe(true);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `session:${userId}`,
        expect.objectContaining({
          lastActivity: expect.any(Number),
        }),
        30 * 24 * 60 * 60,
      );
    });

    it('존재하지 않는 세션 갱신 실패', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.renewSessionTTL('non-existent-session');

      expect(result).toBe(false);
    });
  });

  describe('SPEC CON-004: 동시 세션 제한', () => {
    it('유저 세션 개수 확인', async () => {
      const userId = 'user-id';
      mockCacheManager.get.mockResolvedValue({ id: userId });

      const count = await service.getUserSessionCount(userId);

      expect(count).toBe(1);
    });

    it('세션 없을 때 0 반환', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const count = await service.getUserSessionCount('user-id');

      expect(count).toBe(0);
    });
  });
});
