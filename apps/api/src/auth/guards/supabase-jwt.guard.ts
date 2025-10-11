// @CODE:AUTH-002 | SPEC: SPEC-AUTH-002.md | TEST: test/auth/supabase-jwt.test.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { SupabaseAuthService } from '../supabase-auth.service';

/**
 * @CODE:AUTH-002:INFRA - Supabase JWT 검증 가드
 * NestJS Guard로 Supabase JWT 자동 검증
 */
@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  constructor(private readonly authService: SupabaseAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // Bearer 토큰 추출
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.split(' ')[1];

    try {
      // Supabase JWT 검증
      const user = await this.authService.verifyToken(token);
      request.user = user; // 요청 객체에 사용자 정보 첨부
      return true;
    } catch (error) {
      return false;
    }
  }
}
