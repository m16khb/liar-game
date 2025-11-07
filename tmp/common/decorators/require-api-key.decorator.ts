import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for API key requirement
 */
export const REQUIRE_API_KEY_KEY = 'requireApiKey';

/**
 * Decorator to require API key for a route
 *
 * @example
 * ```typescript
 * @Get()
 * @RequireApiKey()
 * async getSecureData() {
 *   return { data: 'secure' };
 * }
 * ```
 */
export const RequireApiKey = () => SetMetadata(REQUIRE_API_KEY_KEY, true);
