import { UserEntity, UserRole, UserTier } from '@/modules/user/entities/user.entity';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * Supabase JWT Payload
 * Supabase가 발급한 JWT의 claims 구조
 */
export interface SupabaseJwtPayload {
  aud: string; // 'authenticated'
  exp: number;
  iat: number;
  sub: string; // Supabase User ID (UUID)
  email?: string;
  phone?: string;
  app_metadata: {
    provider?: string;
    providers?: string[];
  };
  user_metadata: Record<string, any>;
  role: string; // 'authenticated' | 'anon'
  aal?: string;
  amr?: Array<{ method: string; timestamp: number }>;
  session_id?: string;
  // Custom claims from Backend hook
  user_id?: number; // Backend User ID
  user_tier?: UserTier;
  user_role?: UserRole;
}

/**
 * Supabase JWT 검증 전략 (Stateless)
 * Supabase Auth에서 발급한 JWT를 검증하고 custom claims로 사용자 정보를 반환
 * DB 조회 없이 JWT claims만으로 UserEntity를 구성하여 성능 최적화
 */
@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy, 'supabase-jwt') {
  private readonly logger = new Logger(SupabaseJwtStrategy.name);

  constructor(private readonly configService: ConfigService) {
    const supabaseJwtSecret = configService.get<string>('SUPABASE_JWT_SECRET');
    const supabaseUrl = configService.get<string>('SUPABASE_URL');

    if (!supabaseJwtSecret) {
      throw new Error('SUPABASE_JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: supabaseJwtSecret,
      issuer: supabaseUrl ? `${supabaseUrl}/auth/v1` : undefined,
      audience: 'authenticated',
    });

    // JWT Secret 길이 로깅 (실제 값은 보안상 출력하지 않음)
    this.logger.log(
      `SupabaseJwtStrategy initialized:\n` +
        `  JWT Secret Length: ${supabaseJwtSecret.length} chars\n` +
        `  Issuer: ${supabaseUrl ? `${supabaseUrl}/auth/v1` : 'Not configured'}\n` +
        `  Audience: authenticated`
    );
  }

  /**
   * Supabase JWT payload를 검증하고 Backend 사용자 엔티티를 반환 (Stateless)
   * DB 조회 없이 JWT custom claims만으로 UserEntity를 구성하여 성능 최적화
   *
   * @param payload - Supabase JWT payload (custom claims 포함)
   * @returns Backend 사용자 엔티티 (JWT claims 기반)
   *
   * @note tier/role 변경은 다음 토큰 갱신 시 반영됨 (토큰 만료: 24시간)
   * @note 긴급 변경 시 토큰 블랙리스트 활용 가능
   */
  async validate(payload: SupabaseJwtPayload): Promise<UserEntity> {
    const supabaseUserId = payload.sub;
    const email = payload.email;

    // Debug level logging - only for troubleshooting
    if (process.env.LOG_LEVEL === 'debug') {
      this.logger.debug(
        `JWT validation: user_id=${payload.user_id}, tier=${payload.user_tier}, role=${payload.user_role}`
      );
    }

    try {
      // 1. Custom claims 필수 필드 검증
      const backendUserId = payload.user_id;
      const userTier = payload.user_tier;
      const userRole = payload.user_role;

      if (!backendUserId || !userTier || !userRole) {
        this.logger.error(
          `❌ Missing custom claims in JWT:\n` +
            `  user_id: ${backendUserId}\n` +
            `  tier: ${userTier}\n` +
            `  role: ${userRole}\n` +
            `  → Supabase Custom Access Token Hook may not be configured properly`
        );
        throw new UnauthorizedException(
          'Incomplete user information in token. Please re-authenticate.'
        );
      }

      // 2. JWT claims로 UserEntity 구성 (DB I/O 없음)
      const user = new UserEntity();
      user.id = backendUserId;
      user.oauthId = supabaseUserId;
      user.email = email || '';
      user.tier = userTier;
      user.role = userRole;

      // Success logging removed - only log errors for production

      return user;
    } catch (error) {
      this.logger.error(
        `Supabase JWT validation failed for Supabase user: ${supabaseUserId}`,
        error instanceof Error ? error.stack : undefined,
        { error, supabaseUserId, email }
      );

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid Supabase token');
    }
  }
}
