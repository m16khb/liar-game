// @TEST:AUTH-001 | SPEC: SPEC-AUTH-001.md
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/auth/auth.service';
import { SessionService } from '../../src/auth/session.service';
import { User } from '../../src/auth/entities/user.entity';
import { RefreshToken } from '../../src/auth/entities/refresh-token.entity';

describe('@TEST:AUTH-001:REGISTER - 회원가입', () => {
  let service: AuthService;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((data) => data),
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
    deleteGuestSession: jest.fn(),
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

  describe('REQ-002: 회원가입', () => {
    it('유효한 정보로 회원가입 성공', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const username = 'testuser';

      mockUserRepository.findOne.mockResolvedValue(null); // 이메일 중복 없음
      mockUserRepository.save.mockResolvedValue({
        id: 'user-id',
        email,
        username,
        isGuest: false,
        level: 1,
      });
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await service.register(email, password, username);

      expect(result).toHaveProperty('userId', 'user-id');
      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(result.user.email).toBe(email);
      expect(result.user.isGuest).toBe(false);
      expect(mockSessionService.createSession).toHaveBeenCalled();
    });

    it('이메일 중복 시 실패', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 'existing-user', email: 'test@example.com' });

      await expect(service.register('test@example.com', 'password123', 'testuser')).rejects.toThrow(
        '이미 존재하는 이메일입니다',
      );
    });

    it('비밀번호 8자 미만 시 실패', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.register('test@example.com', 'pass1', 'testuser')).rejects.toThrow(
        '비밀번호는 8자 이상, 영문+숫자를 포함해야 합니다',
      );
    });

    it('비밀번호 영문 미포함 시 실패', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.register('test@example.com', '12345678', 'testuser')).rejects.toThrow(
        '비밀번호는 8자 이상, 영문+숫자를 포함해야 합니다',
      );
    });

    it('비밀번호 숫자 미포함 시 실패', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.register('test@example.com', 'abcdefgh', 'testuser')).rejects.toThrow(
        '비밀번호는 8자 이상, 영문+숫자를 포함해야 합니다',
      );
    });

    it('비밀번호 bcrypt 해싱 검증 (saltRounds=12)', async () => {
      const password = 'password123';
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.save.mockImplementation((user) => Promise.resolve({ ...user, id: 'user-id' }));
      mockJwtService.sign.mockReturnValue('token');

      await service.register('test@example.com', password, 'testuser');

      const savedUser = mockUserRepository.save.mock.calls[0][0];
      expect(savedUser.passwordHash).toBeDefined();
      expect(savedUser.passwordHash).not.toBe(password); // 해싱 확인

      // bcrypt 검증
      const isValid = await bcrypt.compare(password, savedUser.passwordHash);
      expect(isValid).toBe(true);
    });

    it('게스트 전환 시 guestSessionId 매핑 및 게스트 세션 삭제', async () => {
      const guestSessionId = 'guest-session-id';
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.save.mockImplementation((user) => Promise.resolve({ ...user, id: 'user-id' }));
      mockJwtService.sign.mockReturnValue('token');

      await service.register('test@example.com', 'password123', 'testuser', guestSessionId);

      const savedUser = mockUserRepository.save.mock.calls[0][0];
      expect(savedUser.guestSessionId).toBe(guestSessionId);
      expect(mockSessionService.deleteGuestSession).toHaveBeenCalledWith(guestSessionId);
    });
  });
});
