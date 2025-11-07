import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 현재 사용자 정보 추출 데코레이터
 * Parameter decorator to extract current user from request
 *
 * @param data - 추출할 사용자 속성 (선택적)
 * @param ctx - 실행 컨텍스트
 * @returns 사용자 정보 또는 지정된 속성
 *
 * @example
 * ```typescript
 * @Get('profile')
 * async getProfile(@CurrentUser() user: UserEntity) {
 *   return user;
 * }
 *
 * @Get('my-id')
 * async getMyId(@CurrentUser('id') userId: number) {
 *   return { id: userId };
 * }
 *
 * @Get('my-tier')
 * async getMyTier(@CurrentUser('tier') userTier: UserTier) {
 *   return { tier: userTier };
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // 특정 속성이 요청된 경우 해당 속성만 반환
    if (data) {
      return user?.[data];
    }

    // 전체 사용자 정보 반환
    return user;
  }
);