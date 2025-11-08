// 역할 기반 접근 제어 가드
// 사용자 역할에 따른 엔드포인트 접근 제어

import { UserEntity, UserRole } from '@/user/entities'
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 필요한 역할 정보 가져오기
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // 역할 제한이 없으면 접근 허용
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user as UserEntity

    // 사용자 정보가 없으면 거부
    if (!user) {
      throw new ForbiddenException('로그인이 필요합니다')
    }

    // 사용자 역할 확인
    const hasRole = requiredRoles.some((role) => user.role === role)

    if (!hasRole) {
      throw new ForbiddenException(
        `접근 권한이 없습니다. 필요한 역할: ${requiredRoles.join(', ')}`
      )
    }

    return true
  }
}
