import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JWT 인증 가드
 * Supabase JWT를 사용하여 인증을 처리합니다.
 *
 * @Public() 데코레이터가 있는 엔드포인트는 인증을 건너뜁니다.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('supabase-jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getHandler()
    );

    if (isPublic) {
      return true;
    }

    // If not public, proceed with JWT authentication
    const result = super.canActivate(context);
    return Promise.resolve(result as Promise<boolean>);
  }

  handleRequest(err: any, user: any, _info: any) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or missing authentication token');
    }
    return user;
  }
}