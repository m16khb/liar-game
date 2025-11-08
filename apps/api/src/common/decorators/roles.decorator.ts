import { UserRole } from '@/user/entities';
import { SetMetadata } from '@nestjs/common';

/**
 * 역할 메타데이터 키
 * Metadata key for roles
 */
export const ROLES_KEY = 'roles';

/**
 * 사용자 역할 지정 데코레이터
 * Decorator to specify required user roles for endpoint access
 *
 * @param roles - 접근 허용할 사용자 역할들 (USER, ADMIN)
 * @returns 메타데이터 데코레이터
 *
 * @example
 * ```typescript
 * @Get('admin-only')
 * @Roles(UserRole.ADMIN)
 * async getAdminData() {
 *   return 'Only admins can see this';
 * }
 *
 * @Get('user-or-admin')
 * @Roles(UserRole.USER, UserRole.ADMIN)
 * async getUserData() {
 *   return 'Users and admins can access this';
 * }
 * ```
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
