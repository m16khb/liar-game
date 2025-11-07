import { UserTier } from '@/modules/user/entities/user.entity';
import { SetMetadata } from '@nestjs/common';

/**
 * 최소 등급 요구사항 메타데이터 키
 * Metadata key for minimum tier requirement
 */
export const REQUIRE_TIER_KEY = 'requireTier';

/**
 * 최소 사용자 등급 요구사항 데코레이터
 * Decorator to specify minimum user tier requirement for endpoint access
 * Users with equal or higher tier can access the endpoint
 *
 * @param tier - 최소 요구 등급
 * @returns 메타데이터 데코레이터
 *
 * @example
 * ```typescript
 * @Get('member-feature')
 * @RequireTier(UserTier.MEMBER)
 * async getMemberFeature() {
 *   return 'Members, premium users, and admins can access this';
 * }
 *
 * @Get('premium-analysis')
 * @RequireTier(UserTier.PREMIUM)
 * async getPremiumAnalysis() {
 *   return 'Premium users and admins can access this';
 * }
 * ```
 */
export const RequireTier = (tier: UserTier) => SetMetadata(REQUIRE_TIER_KEY, tier);
