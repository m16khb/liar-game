import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';

/**
 * TopK validation guard
 * Validates that requested topK does not exceed tier-based limits
 */
@Injectable()
export class TopKValidationGuard implements CanActivate {
  private readonly logger = new Logger(TopKValidationGuard.name);

  /**
   * Tier-based topK limits
   * @private
   */
  private readonly tierLimits: Record<string, number> = {
    guest: 3,
    member: 5,
    premium: 10,
  };

  /**
   * Validate if requested topK is within tier limits
   *
   * @param context - execution context
   * @returns whether access is allowed
   * @throws BadRequestException if topK exceeds tier limit
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const body = request.body;

    // Get user tier (default to guest if not authenticated)
    const userTier = user?.tier || 'guest';

    // Get tier limit (default to 3 for unknown tiers)
    const maxTopKByTier = this.tierLimits[userTier] || 3;

    // Check if topK is provided in request body
    if (body.topK !== undefined && body.topK !== null) {
      if (body.topK > maxTopKByTier) {
        this.logger.warn(
          `TopK validation failed for user ${user?.id || 'guest'} with tier ${userTier}`,
          {
            userId: user?.id || 'guest',
            userTier,
            requestedTopK: body.topK,
            maxTopKByTier,
            endpoint: request.url,
            method: request.method,
          }
        );

        throw new BadRequestException(
          `Your tier (${userTier}) allows maximum topK of ${maxTopKByTier}, but you requested ${body.topK}`
        );
      }

      this.logger.debug(
        `TopK validation passed for user ${user?.id || 'guest'} with tier ${userTier}`,
        {
          userId: user?.id || 'guest',
          userTier,
          requestedTopK: body.topK,
          maxTopKByTier,
          endpoint: request.url,
        }
      );
    }

    return true;
  }
}
