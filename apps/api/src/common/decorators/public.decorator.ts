import { SetMetadata } from '@nestjs/common';

/**
 * 공개 엔드포인트 데코레이터
 * 인증이 필요 없는 엔드포인트를 지정합니다.
 *
 * @example
 * ```typescript
 * @Public()
 * @Get('health')
 * async healthCheck() {
 *   return { status: 'ok' };
 * }
 * ```
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);