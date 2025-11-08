import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('supabase-jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    // @Public() 데코레이터가 있으면 인증 완전히 건너뛰기
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.debug('Public endpoint accessed, skipping authentication completely');
      return true;
    }

    // 일반 엔드포인트: 선택적 인증 (토큰 있으면 검증, 없으면 guest)
    const result = await super.canActivate(context);

    // @CODE:USER-LIFECYCLE-001 | SPEC: SPEC-USER-LIFECYCLE-001.md
    // 추가 보안 체크: deletedAt 확인
    // 참고: 토큰 무효화는 Supabase의 signOut('global')로 처리됨
    if (result) {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      // guest 사용자는 체크 건너뛰기
      if (user && user.id !== 'guest') {
        // deletedAt 체크 (탈퇴한 계정)
        if (user.deletedAt) {
          this.logger.warn(`Deleted user attempted access: ${user.id}`);
          throw new UnauthorizedException('탈퇴한 계정입니다');
        }
      }
    }

    return result as boolean;
  }

  override handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // 토큰이 없거나 유효하지 않으면 guest로 처리
    if (err || !user) {
      this.logger.warn(
        `JWT authentication failed, proceeding as guest:\n` +
          `  Authorization Header: ${authHeader ? 'Present (Bearer ...)' : 'Missing'}\n` +
          `  Error: ${err?.message || 'None'}\n` +
          `  Info: ${info?.message || 'None'}\n` +
          `  User: ${user ? 'Present but invalid' : 'Not extracted'}`
      );

      // guest user 설정
      const guestUser = {
        id: 'guest',
        tier: 'guest',
        email: null,
      };

      request.user = guestUser;
      return guestUser;
    }

    // 유효한 토큰이 있으면 user 정보 반환
    this.logger.log(
      `JWT authentication successful:\n` +
        `  User ID: ${user.id}\n` +
        `  Tier: ${user.tier}\n` +
        `  Role: ${user.role}\n` +
        `  Email: ${user.email}`
    );

    return user;
  }
}
