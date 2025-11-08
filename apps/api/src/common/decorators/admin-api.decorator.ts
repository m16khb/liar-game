import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@/user/entities';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

/**
 * Admin API를 위한 공통 데코레이터
 * - JWT 인증 필요
 * - Admin 권한 필요
 * - Swagger 문서에 포함
 */
export function AdminApi(tag: string) {
  return applyDecorators(
    ApiTags(tag),
    ApiBearerAuth('JWT-auth'),
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles(UserRole.ADMIN)
  );
}

/**
 * Admin API임을 표시하는 메타데이터 키
 */
export const ADMIN_API_KEY = 'admin_api';

/**
 * 컨트롤러가 Admin API인지 표시하는 데코레이터
 */
export const AdminApiController = () => {
  return function (target: any) {
    Reflect.defineMetadata(ADMIN_API_KEY, true, target);
  };
};
