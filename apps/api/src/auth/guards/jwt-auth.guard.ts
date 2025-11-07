// JWT 인증 가드
// Supabase JWT 토큰 검증

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { SupabaseService } from '../services/supabase.service'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * 요청의 JWT 토큰 검증
   * Authorization: Bearer {token} 형식에서 토큰 추출
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException('JWT 토큰이 필요합니다')
    }

    try {
      // Supabase를 통해 토큰 검증 및 사용자 정보 가져오기
      const user = await this.supabaseService.getUserByToken(token)

      // 요청 객체에 사용자 정보 추가
      request.user = user

      return true
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 JWT 토큰입니다')
    }
  }

  /**
   * Authorization 헤더에서 토큰 추출
   */
  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization
    if (!authHeader) {
      return undefined
    }

    const [type, token] = authHeader.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}