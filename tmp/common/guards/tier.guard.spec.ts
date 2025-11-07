import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TierGuard } from './tier.guard';
import { UserTier } from '@/modules/user/entities/user.entity';
import { REQUIRE_TIER_KEY } from '@/common/decorators/require-tier.decorator';
import { TestUtils } from '@/core/utils/test.utils';

describe('TierGuard', () => {
  let guard: TierGuard;
  let reflector: Reflector;
  let loggerSpies: ReturnType<typeof TestUtils.mockLogger>;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new TierGuard(reflector);
    loggerSpies = TestUtils.mockLogger(guard);
  });

  afterEach(() => {
    TestUtils.clearAllMocks(
      loggerSpies.logSpy,
      loggerSpies.errorSpy,
      loggerSpies.warnSpy,
      loggerSpies.debugSpy
    );
  });

  const createMockExecutionContext = (user: any, requiredTier?: UserTier): ExecutionContext => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user,
          url: '/api/news',
          method: 'GET',
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredTier);

    return mockContext;
  };

  describe('canActivate', () => {
    it('should allow access when no tier requirement is specified', () => {
      const context = createMockExecutionContext({ id: 1, tier: UserTier.GUEST });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      const context = createMockExecutionContext(null, UserTier.PREMIUM);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Authentication required');
    });

    it('should allow PREMIUM user to access PREMIUM endpoint', () => {
      const context = createMockExecutionContext(
        { id: 1, tier: UserTier.PREMIUM },
        UserTier.PREMIUM
      );

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow PREMIUM user to access MEMBER endpoint', () => {
      const context = createMockExecutionContext(
        { id: 1, tier: UserTier.PREMIUM },
        UserTier.MEMBER
      );

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow PREMIUM user to access GUEST endpoint', () => {
      const context = createMockExecutionContext({ id: 1, tier: UserTier.PREMIUM }, UserTier.GUEST);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow MEMBER user to access MEMBER endpoint', () => {
      const context = createMockExecutionContext({ id: 1, tier: UserTier.MEMBER }, UserTier.MEMBER);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow MEMBER user to access GUEST endpoint', () => {
      const context = createMockExecutionContext({ id: 1, tier: UserTier.MEMBER }, UserTier.GUEST);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny MEMBER user access to PREMIUM endpoint', () => {
      const context = createMockExecutionContext(
        { id: 1, tier: UserTier.MEMBER },
        UserTier.PREMIUM
      );

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(/Access denied/);
    });

    it('should deny GUEST user access to MEMBER endpoint', () => {
      const context = createMockExecutionContext({ id: 1, tier: UserTier.GUEST }, UserTier.MEMBER);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(/Access denied/);
    });

    it('should deny GUEST user access to PREMIUM endpoint', () => {
      const context = createMockExecutionContext({ id: 1, tier: UserTier.GUEST }, UserTier.PREMIUM);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(/Access denied/);
    });

    it('should include user and required tier info in error message', () => {
      const context = createMockExecutionContext({ id: 1, tier: UserTier.GUEST }, UserTier.PREMIUM);

      try {
        guard.canActivate(context);
      } catch (error: any) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toContain('Access denied');
        expect(error.message).toContain(UserTier.PREMIUM);
        expect(error.message).toContain(UserTier.GUEST);
      }
    });
  });

  describe('REQUIRE_TIER_KEY metadata', () => {
    it('should use correct metadata key', () => {
      const context = createMockExecutionContext(
        { id: 1, tier: UserTier.PREMIUM },
        UserTier.PREMIUM
      );

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(REQUIRE_TIER_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });
});
