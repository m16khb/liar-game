// @TEST:AUTH-001 | SPEC: SPEC-AUTH-001.md
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from '../../src/auth/auth.service';
import { SessionService } from '../../src/auth/session.service';
import { User } from '../../src/auth/entities/user.entity';
import { RefreshToken } from '../../src/auth/entities/refresh-token.entity';

describe('@TEST:AUTH-001:GUEST - 게스트 인증', () => {
  let service: AuthService;
  let sessionService: SessionService;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockRefreshTokenRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockSessionService = {
    createSession: jest.fn(),
    createGuestSession: jest.fn(),
    getSession: jest.fn(),
    getGuestSession: jest.fn(),
    deleteSession: jest.fn(),
    deleteGuestSession: jest.fn(),
    renewSessionTTL: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(RefreshToken), useValue: mockRefreshTokenRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: SessionService, useValue: mockSessionService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    sessionService = module.get<SessionService>(SessionService);

    // 모킹 초기화
    jest.clearAllMocks();
  });

  describe('REQ-001: 게스트 토큰 생성', () => {
    it('유효한 닉네임으로 게스트 토큰 생성 성공', async () => {
      const username = 'GuestUser123';
      mockJwtService.sign.mockReturnValueOnce('mock-access-token').mockReturnValueOnce('mock-refresh-token');

      const result = await service.createGuestToken(username);

      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
      expect(result.user.username).toBe(username);
      expect(result.user.isGuest).toBe(true);
      expect(mockSessionService.createGuestSession).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ username, createdAt: expect.any(Number) }),
      );
    });

    it('닉네임 3자 미만 시 실패', async () => {
      await expect(service.createGuestToken('ab')).rejects.toThrow('닉네임은 3-20자여야 합니다');
    });

    it('닉네임 20자 초과 시 실패', async () => {
      await expect(service.createGuestToken('a'.repeat(21))).rejects.toThrow('닉네임은 3-20자여야 합니다');
    });

    it('닉네임 누락 시 실패', async () => {
      await expect(service.createGuestToken('')).rejects.toThrow('닉네임은 3-20자여야 합니다');
    });

    it('게스트 세션 UUID v4 형식 검증', async () => {
      mockJwtService.sign.mockReturnValue('mock-token');
      const result = await service.createGuestToken('validuser');

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(result.sessionId).toMatch(uuidRegex);
    });
  });
});
