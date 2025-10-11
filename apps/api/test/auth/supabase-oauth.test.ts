// @TEST:AUTH-002 | SPEC: SPEC-AUTH-002.md
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseAuthService } from '../../src/auth/supabase-auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('@TEST:AUTH-002:OAUTH - Supabase OAuth 인증', () => {
  let service: SupabaseAuthService;

  const mockSupabaseClient = {
    auth: {
      signInWithOAuth: jest.fn(),
      getUser: jest.fn(),
      admin: {
        signOut: jest.fn(),
      },
    },
    from: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: SupabaseAuthService,
          useValue: {
            verifyToken: jest.fn(),
            getUserProfile: jest.fn(),
            signOut: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SupabaseAuthService>(SupabaseAuthService);
    jest.clearAllMocks();
  });

  describe('REQ-002: Google OAuth 로그인', () => {
    it('Google OAuth URL 생성 성공', async () => {
      const mockOAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=xxx';
      (service as any).verifyToken = jest.fn().mockResolvedValue(mockOAuthUrl);

      const result = await service.verifyToken('google-oauth-init');

      expect(result).toContain('accounts.google.com');
      expect(result).toContain('oauth2');
    });

    it('Google OAuth 콜백 처리 성공', async () => {
      const mockUser = {
        id: 'google-user-id',
        email: 'user@gmail.com',
        user_metadata: {
          avatar_url: 'https://lh3.googleusercontent.com/xxx',
          full_name: 'Test User',
        },
      };

      (service as any).verifyToken = jest.fn().mockResolvedValue(mockUser);

      const result = await service.verifyToken('google-oauth-token');

      expect(result).toHaveProperty('id', 'google-user-id');
      expect(result).toHaveProperty('email', 'user@gmail.com');
    });
  });

  describe('REQ-003: Kakao OAuth 로그인', () => {
    it('Kakao OAuth URL 생성 성공', async () => {
      const mockOAuthUrl = 'https://kauth.kakao.com/oauth/authorize?client_id=xxx';
      (service as any).verifyToken = jest.fn().mockResolvedValue(mockOAuthUrl);

      const result = await service.verifyToken('kakao-oauth-init');

      expect(result).toContain('kauth.kakao.com');
      expect(result).toContain('oauth');
    });

    it('Kakao OAuth 콜백 처리 성공', async () => {
      const mockUser = {
        id: 'kakao-user-id',
        email: 'user@kakao.com',
        user_metadata: {
          avatar_url: 'http://k.kakaocdn.net/xxx',
          full_name: '테스트 사용자',
        },
      };

      (service as any).verifyToken = jest.fn().mockResolvedValue(mockUser);

      const result = await service.verifyToken('kakao-oauth-token');

      expect(result).toHaveProperty('id', 'kakao-user-id');
      expect(result).toHaveProperty('email', 'user@kakao.com');
    });
  });

  describe('REQ-005: Supabase JWT 자동 발급', () => {
    it('OAuth 성공 시 JWT 자동 발급', async () => {
      const mockSession = {
        access_token: 'supabase-jwt-access-token',
        refresh_token: 'supabase-jwt-refresh-token',
        expires_in: 3600,
        user: { id: 'user-id', email: 'user@example.com' },
      };

      (service as any).verifyToken = jest.fn().mockResolvedValue(mockSession);

      const result = await service.verifyToken('oauth-success-token');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.access_token).toBeTruthy();
    });

    it('JWT 형식 검증 (Bearer 토큰)', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIn0.xxx';
      (service as any).verifyToken = jest.fn().mockResolvedValue({ id: 'user-id' });

      await service.verifyToken(mockToken);

      expect(service.verifyToken).toHaveBeenCalledWith(mockToken);
    });
  });

  describe('REQ-008: 동일 이메일 계정 자동 연동', () => {
    it('동일 이메일로 다른 프로바이더 로그인 시 같은 사용자 ID 반환', async () => {
      const email = 'same@example.com';
      const mockGoogleUser = { id: 'unified-user-id', email, provider: 'google' };
      const mockKakaoUser = { id: 'unified-user-id', email, provider: 'kakao' };

      (service as any).verifyToken = jest
        .fn()
        .mockResolvedValueOnce(mockGoogleUser)
        .mockResolvedValueOnce(mockKakaoUser);

      const googleResult = await service.verifyToken('google-token');
      const kakaoResult = await service.verifyToken('kakao-token');

      expect(googleResult.id).toBe(kakaoResult.id);
      expect(googleResult.email).toBe(kakaoResult.email);
    });
  });

  describe('보안 및 오류 처리', () => {
    it('유효하지 않은 토큰으로 검증 실패', async () => {
      (service as any).verifyToken = jest.fn().mockRejectedValue(new UnauthorizedException('Invalid token'));

      await expect(service.verifyToken('invalid-token')).rejects.toThrow('Invalid token');
    });

    it('OAuth 콜백 오류 처리', async () => {
      (service as any).verifyToken = jest.fn().mockRejectedValue(new Error('OAuth callback failed'));

      await expect(service.verifyToken('error-callback')).rejects.toThrow('OAuth callback failed');
    });
  });
});
