// @CODE:AUTH-001:API | SPEC: SPEC-AUTH-001.md | TEST: test/auth/*.test.ts
import { Controller, Post, Get, Body, UseGuards, Req, Headers, HttpCode, Logger } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SupabaseAuthService } from './supabase-auth.service';

/**
 * 인증 컨트롤러
 * REST API 엔드포인트 6개
 */
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly supabaseAuthService: SupabaseAuthService,
  ) {}

  /**
   * POST /api/auth/register - 회원가입 (REQ-002)
   * Rate Limit: 3회/60초 (SPEC CON-004)
   */
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(
      dto.email,
      dto.password,
      dto.username,
      dto.supabaseId,
    );
  }

  /**
   * POST /api/auth/login - 로그인 (REQ-006)
   * Rate Limit: 5회/60초 (SPEC CON-004)
   */
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  /**
   * POST /api/auth/logout - 로그아웃 (Supabase OAuth revoke 포함)
   * 인증 없이 호출 가능 (이미 로그아웃하는 상황이므로)
   */
  @Post('logout')
  async logout(@Headers('authorization') authHeader?: string) {
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      try {
        await this.supabaseAuthService.signOut(token);
      } catch (error) {
        this.logger.error('Supabase signOut failed', error);
      }
    }

    return { success: true };
  }

  /**
   * GET /api/auth/me - 현재 사용자 정보 (REQ-009)
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req: any) {
    return req.user;
  }

  /**
   * POST /api/auth/verify - JWT 검증
   */
  @Post('verify')
  async verifyToken(@Body('token') token: string) {
    return this.authService.verifyJWT(token);
  }

  /**
   * POST /api/auth/oauth/sync - OAuth 유저 동기화
   * OAuth 로그인 후 자체 DB에 유저 생성/동기화
   */
  @Post('oauth/sync')
  async syncOAuthUser(
    @Body() payload: {
      supabaseUserId: string;
      email?: string;
      username?: string;
      provider?: string;
    },
  ) {
    const user = await this.authService.findOrCreateOAuthUser(
      payload.supabaseUserId,
      payload.email,
      payload.username,
      payload.provider,
    );

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * POST /api/auth/hooks/custom-access-token - Supabase Auth Hook
   * Supabase가 OAuth 로그인 시 자동으로 호출하여 JWT에 role 추가
   *
   * ⚠️ 중요: 기존 claims를 유지하면서 app_metadata.role만 추가합니다.
   */
  @Post('hooks/custom-access-token')
  @HttpCode(200)
  async customAccessTokenHook(
    @Body() payload: {
      user_id: string;
      claims: any; // 전체 JWT claims
      authentication_method: string;
    },
  ) {
    const userId = payload.user_id;
    const email = payload.claims.email;
    const username = payload.claims.user_metadata?.full_name ||
                     payload.claims.user_metadata?.name ||
                     email?.split('@')[0];
    const provider = payload.claims.app_metadata?.provider;

    try {
      const user = await this.authService.findOrCreateOAuthUser(
        userId,
        email,
        username,
        provider,
      );

      return {
        claims: {
          ...payload.claims,
          app_metadata: {
            ...payload.claims.app_metadata,
            role: user.role,
          },
          user_metadata: {
            ...payload.claims.user_metadata,
            username: user.username,
          },
        },
      };
    } catch (error) {
      this.logger.error('Supabase Hook error', error);
      return {
        claims: {
          ...payload.claims,
          app_metadata: {
            ...payload.claims.app_metadata,
            role: 'user',
          },
          user_metadata: {
            ...payload.claims.user_metadata,
            username: username || 'user',
          },
        },
      };
    }
  }
}
