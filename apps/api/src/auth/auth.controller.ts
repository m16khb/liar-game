// @CODE:AUTH-001:API | SPEC: SPEC-AUTH-001.md | TEST: test/auth/*.test.ts
import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { GuestAuthDto } from './dto/guest-auth.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * 인증 컨트롤러
 * REST API 엔드포인트 7개
 */
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/guest - 게스트 인증 (REQ-001)
   * Rate Limit: 10회/60초
   */
  @Post('guest')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async guestAuth(@Body() dto: GuestAuthDto) {
    return this.authService.createGuestToken(dto.username);
  }

  /**
   * POST /api/auth/register - 회원가입 (REQ-002)
   * Rate Limit: 3회/60초 (SPEC CON-004)
   */
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.username, dto.guestSessionId);
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
   * POST /api/auth/refresh - 토큰 갱신 (REQ-007)
   * Rate Limit: 10회/60초
   */
  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  /**
   * POST /api/auth/logout - 로그아웃
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    return this.authService.logout(req.user.id);
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
}
