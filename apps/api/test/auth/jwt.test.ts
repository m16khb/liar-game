// @TEST:AUTH-001 | SPEC: SPEC-AUTH-001.md
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/auth/auth.service';
import { SessionService } from '../../src/auth/session.service';
import { User } from '../../src/auth/entities/user.entity';
import { RefreshToken } from '../../src/auth/entities/refresh-token.entity';

describe('@TEST:AUTH-001:JWT - JWT 토큰 관리', () => {
  let service: AuthService;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
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
    deleteSession: jest.fn(),
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

  describe('REQ-007: 토큰 갱신', () => {
    it('유효한 리프레시 토큰으로 액세스 토큰 갱신 성공', async () => {
      const refreshToken = 'valid-refresh-token';
      const userId = 'user-id';
      const tokenHash = await bcrypt.hash(refreshToken, 12);

      mockJwtService.verifyAsync.mockResolvedValue({ sub: userId });
      mockRefreshTokenRepository.findOne.mockResolvedValue({
        id: 'token-id',
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
      });
      mockUserRepository.findOne.mockResolvedValue({
        id: userId,
        username: 'testuser',
      });
      mockJwtService.sign.mockReturnValueOnce('new-access-token').mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
      expect(mockRefreshTokenRepository.delete).toHaveBeenCalledWith({ id: 'token-id' }); // 일회용
    });

    it('만료된 리프레시 토큰으로 갱신 실패', async () => {
      const refreshToken = 'expired-refresh-token';
      const tokenHash = await bcrypt.hash(refreshToken, 12);

      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-id' });
      mockRefreshTokenRepository.findOne.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        tokenHash,
        expiresAt: new Date(Date.now() - 1000), // 이미 만료됨
      });

      await expect(service.refreshToken(refreshToken)).rejects.toThrow('유효하지 않은 리프레시 토큰입니다');
    });

    it('DB에 없는 리프레시 토큰으로 갱신 실패', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-id' });
      mockRefreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshToken('non-existent-token')).rejects.toThrow('유효하지 않은 리프레시 토큰입니다');
    });

    it('유효하지 않은 JWT 형식으로 갱신 실패', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.refreshToken('invalid-jwt-format')).rejects.toThrow('토큰 갱신에 실패했습니다');
    });

    it('리프레시 토큰 일회용 검증 (사용 후 삭제)', async () => {
      const refreshToken = 'valid-refresh-token';
      const tokenHash = await bcrypt.hash(refreshToken, 12);

      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-id' });
      mockRefreshTokenRepository.findOne.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      mockUserRepository.findOne.mockResolvedValue({ id: 'user-id', username: 'testuser' });
      mockJwtService.sign.mockReturnValue('new-token');

      await service.refreshToken(refreshToken);

      expect(mockRefreshTokenRepository.delete).toHaveBeenCalledWith({ id: 'token-id' });
      expect(mockRefreshTokenRepository.save).toHaveBeenCalled(); // 새 토큰 저장
    });

    it('토큰 갱신 시 새로운 리프레시 토큰도 함께 발급', async () => {
      const refreshToken = 'valid-refresh-token';
      const tokenHash = await bcrypt.hash(refreshToken, 12);

      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-id' });
      mockRefreshTokenRepository.findOne.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      mockUserRepository.findOne.mockResolvedValue({ id: 'user-id', username: 'testuser' });
      mockJwtService.sign.mockReturnValueOnce('new-access-token').mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshToken(refreshToken);

      expect(mockJwtService.sign).toHaveBeenCalledTimes(2); // access + refresh
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });
  });

  describe('로그아웃', () => {
    it('로그아웃 성공 시 세션 및 리프레시 토큰 삭제', async () => {
      const userId = 'user-id';

      const result = await service.logout(userId);

      expect(result.success).toBe(true);
      expect(mockSessionService.deleteSession).toHaveBeenCalledWith(userId);
      expect(mockRefreshTokenRepository.delete).toHaveBeenCalledWith({ userId });
    });
  });

  describe('JWT 검증', () => {
    it('유효한 JWT 검증 성공', async () => {
      const token = 'valid-jwt-token';
      const payload = { sub: 'user-id', username: 'testuser', role: 'USER' };

      mockJwtService.verifyAsync.mockResolvedValue(payload);

      const result = await service.verifyJWT(token);

      expect(result).toEqual(payload);
    });

    it('유효하지 않은 JWT 검증 실패 시 null 반환', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      const result = await service.verifyJWT('invalid-token');

      expect(result).toBeNull();
    });
  });
});
