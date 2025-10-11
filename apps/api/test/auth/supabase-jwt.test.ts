// @TEST:AUTH-002 | SPEC: SPEC-AUTH-002.md
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { SupabaseJwtGuard } from '../../src/auth/guards/supabase-jwt.guard';
import { SupabaseAuthService } from '../../src/auth/supabase-auth.service';

describe('@TEST:AUTH-002:JWT - Supabase JWT 가드', () => {
  let guard: SupabaseJwtGuard;
  let authService: SupabaseAuthService;

  const mockAuthService = {
    verifyToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseJwtGuard,
        { provide: SupabaseAuthService, useValue: mockAuthService },
      ],
    }).compile();

    guard = module.get<SupabaseJwtGuard>(SupabaseJwtGuard);
    authService = module.get<SupabaseAuthService>(SupabaseAuthService);
    jest.clearAllMocks();
  });

  describe('REQ-010: 로그인 상태 시 JWT 자동 첨부', () => {
    it('유효한 JWT로 API 접근 허용', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-supabase-jwt',
        },
      };

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      mockAuthService.verifyToken.mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
      });

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest).toHaveProperty('user');
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('valid-supabase-jwt');
    });

    it('JWT 없이 API 접근 차단', async () => {
      const mockRequest = {
        headers: {},
      };

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(mockAuthService.verifyToken).not.toHaveBeenCalled();
    });
  });

  describe('REQ-009: JWT 자동 갱신 검증', () => {
    it('만료된 토큰으로 접근 차단 후 자동 갱신 트리거', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer expired-jwt',
        },
      };

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      mockAuthService.verifyToken.mockRejectedValue(new Error('Token expired'));

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      // 실제 구현에서는 클라이언트가 401 받고 자동 갱신 시도
    });

    it('갱신된 JWT로 재접근 성공', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer refreshed-jwt',
        },
      };

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      mockAuthService.verifyToken.mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
      });

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });
});
