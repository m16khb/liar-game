import { hasRequiredTier } from '@/common/constants/tier-limits.constant';
import { REQUIRE_TIER_KEY } from '@/common/decorators/require-tier.decorator';
import { UserTier } from '@/user/entities';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * 등급 기반 접근 제어 가드
 * Tier-based access control guard that checks minimum tier requirement
 */
@Injectable()
export class TierGuard implements CanActivate {
  private readonly logger = new Logger(TierGuard.name);

  constructor(private reflector: Reflector) {}

  /**
   * 사용자의 등급이 최소 요구 등급을 만족하는지 확인
   * Check if user's tier meets the minimum tier requirement
   *
   * @param context - 실행 컨텍스트
   * @returns 접근 허용 여부
   */
  canActivate(context: ExecutionContext): boolean {
    // 컨트롤러와 핸들러에서 요구되는 최소 등급 가져오기
    const requiredTier = this.reflector.getAllAndOverride<UserTier>(REQUIRE_TIER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 등급이 지정되지 않았으면 접근 허용
    if (!requiredTier) {
      this.logger.debug('No tier requirement specified, access granted');
      return true;
    }

    // 요청에서 사용자 정보 추출
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('No user found in request for tier check');
      throw new ForbiddenException('Authentication required');
    }

    // 사용자 등급이 요구되는 최소 등급을 만족하는지 확인
    const hasPermission = hasRequiredTier(user.tier, requiredTier);

    if (!hasPermission) {
      this.logger.warn(
        `Access denied for user ${user.id} with tier ${user.tier}. Required: ${requiredTier}`,
        {
          userId: user.id,
          userTier: user.tier,
          requiredTier,
          endpoint: request.url,
          method: request.method,
        }
      );

      throw new ForbiddenException(
        `Access denied. Required minimum tier: ${requiredTier}. Your tier: ${user.tier}`
      );
    }

    this.logger.debug(`Access granted for user ${user.id} with tier ${user.tier}`, {
      userId: user.id,
      userTier: user.tier,
      requiredTier,
      endpoint: request.url,
    });

    return true;
  }
}
