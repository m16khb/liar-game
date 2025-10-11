// @TEST:AUTH-001 | SPEC: SPEC-AUTH-001.md
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/auth/auth.service';
import { SessionService } from '../../src/auth/session.service';
import { User } from '../../src/auth/entities/user.entity';
import { RefreshToken } from '../../src/auth/entities/refresh-token.entity';

describe('@TEST:AUTH-001:LOGIN - 로그인', () => {
  let service: AuthService;

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
    getSession: jest.fn(),
    deleteSession: jest.fn(),
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
    jest.clearAllMocks();
  });

  describe('REQ-006: 로그인', () => {
    it('유효한 자격증명으로 로그인 성공', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const passwordHash = await bcrypt.hash(password, 12);

      mockUserRepository.findOne.mockResolvedValue({
        id: 'user-id',
        email,
        username: 'testuser',
        passwordHash,
        isGuest: false,
        level: 1,
      });
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await service.login(email, password);

      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(result.user.email).toBe(email);
      expect(result.user.isGuest).toBe(false);
      expect(mockSessionService.createSession).toHaveBeenCalledWith(
        'user-id',
        expect.objectContaining({
          id: 'user-id',
          username: 'testuser',
          role: 'USER',
        }),
      );
    });

    it('존재하지 않는 이메일로 로그인 실패', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login('nonexistent@example.com', 'password123')).rejects.toThrow(
        '이메일 또는 비밀번호가 잘못되었습니다',
      );
    });

    it('잘못된 비밀번호로 로그인 실패', async () => {
      const passwordHash = await bcrypt.hash('correctpassword', 12);
      mockUserRepository.findOne.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        passwordHash,
      });

      await expect(service.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        '이메일 또는 비밀번호가 잘못되었습니다',
      );
    });

    it('로그인 성공 시 JWT 토큰 쌍 발급', async () => {
      const password = 'password123';
      const passwordHash = await bcrypt.hash(password, 12);

      mockUserRepository.findOne.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash,
        isGuest: false,
        level: 1,
      });
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await service.login('test@example.com', password);

      expect(mockJwtService.sign).toHaveBeenCalledTimes(2); // access + refresh
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('로그인 성공 시 리프레시 토큰 DB 저장', async () => {
      const password = 'password123';
      const passwordHash = await bcrypt.hash(password, 12);

      mockUserRepository.findOne.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash,
      });
      mockJwtService.sign.mockReturnValue('token');

      await service.login('test@example.com', password);

      expect(mockRefreshTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-id',
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      );
    });
  });
});
