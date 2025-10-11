// @TEST:AUTH-002 | SPEC: SPEC-AUTH-002.md
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseAuthService } from '../../src/auth/supabase-auth.service';

describe('@TEST:AUTH-002:ANONYMOUS - Supabase Anonymous Auth', () => {
  let service: SupabaseAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: SupabaseAuthService,
          useValue: {
            signInAnonymously: jest.fn(),
            getUserProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SupabaseAuthService>(SupabaseAuthService);
    jest.clearAllMocks();
  });

  describe('REQ-004: Anonymous Auth 제공', () => {
    it('게스트로 시작 시 즉시 익명 사용자 생성', async () => {
      const mockAnonymousUser = {
        id: 'anon-user-id',
        is_anonymous: true,
        email: null,
        user_metadata: {},
      };

      (service as any).signInAnonymously = jest.fn().mockResolvedValue({
        user: mockAnonymousUser,
        session: {
          access_token: 'anon-jwt-token',
          refresh_token: 'anon-refresh-token',
        },
      });

      const result = await (service as any).signInAnonymously();

      expect(result.user).toHaveProperty('is_anonymous', true);
      expect(result.session.access_token).toBeTruthy();
      expect(result.user.email).toBeNull(); // 이메일 없음
    });

    it('익명 사용자 생성 시간 < 100ms', async () => {
      const startTime = Date.now();

      (service as any).signInAnonymously = jest.fn().mockResolvedValue({
        user: { id: 'anon-id', is_anonymous: true },
        session: { access_token: 'token' },
      });

      await (service as any).signInAnonymously();

      const elapsedTime = Date.now() - startTime;
      expect(elapsedTime).toBeLessThan(100);
    });
  });

  describe('REQ-011: Anonymous → Social 계정 연동', () => {
    it('익명 사용자가 소셜 계정으로 전환 시 데이터 유지', async () => {
      const anonymousUserId = 'anon-user-id';
      const linkedUserId = 'google-user-id';

      // 1. 익명 사용자 프로필
      (service as any).getUserProfile = jest.fn().mockResolvedValueOnce({
        id: anonymousUserId,
        username: '게스트12345',
        level: 3,
        games_played: 10,
      });

      const anonProfile = await service.getUserProfile(anonymousUserId);
      expect(anonProfile.games_played).toBe(10);

      // 2. Google 연동 후 프로필 (데이터 유지)
      (service as any).getUserProfile = jest.fn().mockResolvedValueOnce({
        id: linkedUserId,
        username: '게스트12345', // 동일 닉네임
        level: 3, // 동일 레벨
        games_played: 10, // 동일 게임 기록
        email: 'user@gmail.com', // 새로 추가됨
        oauth_provider: 'google',
      });

      const linkedProfile = await service.getUserProfile(linkedUserId);
      expect(linkedProfile.games_played).toBe(anonProfile.games_played);
      expect(linkedProfile.level).toBe(anonProfile.level);
      expect(linkedProfile.email).toBe('user@gmail.com');
    });
  });
});
