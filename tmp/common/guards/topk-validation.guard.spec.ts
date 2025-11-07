import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, BadRequestException } from '@nestjs/common';
import { TopKValidationGuard } from './topk-validation.guard';
import { UserTier } from '@/modules/user/entities/user.entity';

describe('TopKValidationGuard', () => {
  let guard: TopKValidationGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TopKValidationGuard],
    }).compile();

    guard = module.get<TopKValidationGuard>(TopKValidationGuard);
  });

  /**
   * Mock execution context helper
   * @param user - user object with tier
   * @param body - request body with topK
   */
  const createMockContext = (user: any = null, body: any = {}): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          body,
          url: '/test',
          method: 'POST',
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('Basic functionality', () => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should allow request when topK is not provided', () => {
      const context = createMockContext({ id: 1, tier: UserTier.GUEST }, {});

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow request when topK is null', () => {
      const context = createMockContext({ id: 1, tier: UserTier.GUEST }, { topK: null });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('Guest tier (limit: 3)', () => {
    it('should allow topK=1 for guest tier', () => {
      const context = createMockContext({ id: 1, tier: UserTier.GUEST }, { topK: 1 });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow topK=3 for guest tier (at limit)', () => {
      const context = createMockContext({ id: 1, tier: UserTier.GUEST }, { topK: 3 });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw BadRequestException when topK=4 for guest tier', () => {
      const context = createMockContext({ id: 1, tier: UserTier.GUEST }, { topK: 4 });

      expect(() => guard.canActivate(context)).toThrow(BadRequestException);
      expect(() => guard.canActivate(context)).toThrow(
        'Your tier (guest) allows maximum topK of 3, but you requested 4'
      );
    });

    it('should throw BadRequestException when topK=10 for guest tier', () => {
      const context = createMockContext({ id: 1, tier: UserTier.GUEST }, { topK: 10 });

      expect(() => guard.canActivate(context)).toThrow(BadRequestException);
    });
  });

  describe('Member tier (limit: 5)', () => {
    it('should allow topK=3 for member tier', () => {
      const context = createMockContext({ id: 1, tier: UserTier.MEMBER }, { topK: 3 });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow topK=5 for member tier (at limit)', () => {
      const context = createMockContext({ id: 1, tier: UserTier.MEMBER }, { topK: 5 });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw BadRequestException when topK=6 for member tier', () => {
      const context = createMockContext({ id: 1, tier: UserTier.MEMBER }, { topK: 6 });

      expect(() => guard.canActivate(context)).toThrow(BadRequestException);
      expect(() => guard.canActivate(context)).toThrow(
        'Your tier (member) allows maximum topK of 5, but you requested 6'
      );
    });

    it('should throw BadRequestException when topK=10 for member tier', () => {
      const context = createMockContext({ id: 1, tier: UserTier.MEMBER }, { topK: 10 });

      expect(() => guard.canActivate(context)).toThrow(BadRequestException);
    });
  });

  describe('Premium tier (limit: 10)', () => {
    it('should allow topK=5 for premium tier', () => {
      const context = createMockContext({ id: 1, tier: UserTier.PREMIUM }, { topK: 5 });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow topK=10 for premium tier (at limit)', () => {
      const context = createMockContext({ id: 1, tier: UserTier.PREMIUM }, { topK: 10 });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw BadRequestException when topK=11 for premium tier', () => {
      const context = createMockContext({ id: 1, tier: UserTier.PREMIUM }, { topK: 11 });

      expect(() => guard.canActivate(context)).toThrow(BadRequestException);
      expect(() => guard.canActivate(context)).toThrow(
        'Your tier (premium) allows maximum topK of 10, but you requested 11'
      );
    });
  });

  describe('Unauthenticated users', () => {
    it('should treat unauthenticated user as guest (limit: 3)', () => {
      const context = createMockContext(null, { topK: 3 });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw BadRequestException for unauthenticated user with topK=4', () => {
      const context = createMockContext(null, { topK: 4 });

      expect(() => guard.canActivate(context)).toThrow(BadRequestException);
      expect(() => guard.canActivate(context)).toThrow(
        'Your tier (guest) allows maximum topK of 3, but you requested 4'
      );
    });
  });

  describe('Unknown tier fallback', () => {
    it('should default to guest limit (3) for unknown tier', () => {
      const context = createMockContext({ id: 1, tier: 'unknown_tier' }, { topK: 3 });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw BadRequestException for unknown tier with topK=4', () => {
      const context = createMockContext({ id: 1, tier: 'unknown_tier' }, { topK: 4 });

      expect(() => guard.canActivate(context)).toThrow(BadRequestException);
    });
  });

  describe('Edge cases', () => {
    it('should allow topK=0', () => {
      const context = createMockContext({ id: 1, tier: UserTier.GUEST }, { topK: 0 });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle negative topK (treated as under limit)', () => {
      const context = createMockContext({ id: 1, tier: UserTier.GUEST }, { topK: -1 });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle very large topK for premium tier', () => {
      const context = createMockContext({ id: 1, tier: UserTier.PREMIUM }, { topK: 1000 });

      expect(() => guard.canActivate(context)).toThrow(BadRequestException);
    });
  });
});
