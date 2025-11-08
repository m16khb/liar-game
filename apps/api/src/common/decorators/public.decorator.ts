import { SetMetadata } from '@nestjs/common';

/**
 * 공개 엔드포인트 메타데이터 키
 * Metadata key for public endpoints
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * 공개 접근 허용 데코레이터
 * Decorator to mark endpoints as publicly accessible (skip authentication completely)
 *
 * @returns 공개 접근 메타데이터 데코레이터
 *
 * @example
 * ```typescript
 * // 완전 공개 (인증 완전히 건너뛰기, user 객체 없음)
 * @Get('health')
 * @Public()
 * async getHealth() {
 *   return { status: 'ok' };
 * }
 *
 * // 일반 엔드포인트 (토큰 없으면 guest, 있으면 검증)
 * @Post('live')
 * async liveAnalysis(@CurrentUser() user: UserEntity) {
 *   // user.tier = 'guest' (토큰 없음) 또는 실제 tier (토큰 있음)
 * }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
