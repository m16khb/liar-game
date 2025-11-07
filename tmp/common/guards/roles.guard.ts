import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/user/entities/user.entity';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * 역할 기반 접근 제어 가드
 * Role-based access control guard that checks user roles (USER, ADMIN)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  /**
   * 사용자의 역할이 요구되는 역할을 만족하는지 확인
   * Check if user's role satisfies the required roles
   *
   * @param context - 실행 컨텍스트
   * @returns 접근 허용 여부
   */
  canActivate(context: ExecutionContext): boolean {
    // 컨트롤러와 핸들러에서 요구되는 역할 가져오기
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 역할이 지정되지 않았으면 접근 허용
    if (!requiredRoles) {
      this.logger.debug('No roles required, access granted');
      return true;
    }

    // 요청에서 사용자 정보 추출
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('No user found in request for roles check');
      throw new ForbiddenException('Authentication required');
    }

    // 사용자 역할이 요구되는 역할 중 하나에 포함되는지 확인
    // ADMIN 역할은 모든 역할에 접근 가능 (상위 역할)
    const hasPermission = user.role === UserRole.ADMIN || requiredRoles.includes(user.role);

    if (!hasPermission) {
      this.logger.warn(
        `Access denied for user ${user.id} with role ${user.role}. Required: ${requiredRoles.join(', ')}`,
        {
          userId: user.id,
          userRole: user.role,
          requiredRoles,
          endpoint: request.url,
          method: request.method,
        }
      );

      throw new ForbiddenException(
        `Access denied. Required role: ${requiredRoles.join(' or ')}. Your role: ${user.role}`
      );
    }

    this.logger.debug(`Access granted for user ${user.id} with role ${user.role}`, {
      userId: user.id,
      userRole: user.role,
      requiredRoles,
      endpoint: request.url,
    });

    return true;
  }
}
