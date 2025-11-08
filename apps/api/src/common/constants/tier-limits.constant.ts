import { UserTier } from "@/user/entities";

/**
 * Tier hierarchy mapping (higher number = higher privilege)
 * 티어 계층 매핑 (숫자가 높을수록 높은 권한)
 */
const TIER_HIERARCHY: Record<UserTier, number> = {
  [UserTier.GUEST]: 0,
  [UserTier.MEMBER]: 1,
  [UserTier.PREMIUM]: 2,
};

/**
 * Check if user's tier meets the required minimum tier
 * 사용자 티어가 최소 요구 티어를 만족하는지 확인
 *
 * @param userTier - User's current tier
 * @param requiredTier - Minimum required tier
 * @returns true if user tier is equal or higher than required tier
 *
 * @example
 * hasRequiredTier(UserTier.PREMIUM, UserTier.MEMBER) // true
 * hasRequiredTier(UserTier.GUEST, UserTier.PREMIUM) // false
 */
export function hasRequiredTier(userTier: UserTier, requiredTier: UserTier): boolean {
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier];
}
