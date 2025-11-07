// 인증 컨트롤러
// OAuth 소셜 로그인, 이메일 인증, 사용자 관리 엔드포인트

import { Controller, Get, Post, Body, Res, Req, Query, UseGuards, Delete } from '@nestjs/common'
import { FastifyRequest } from 'fastify'
import { SupabaseService } from '../services/supabase.service'
import { UserService } from '../services/user.service'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { LoginDto } from '../dto/login.dto'
import '../../types/fastify.types' // FastifyRequest 타입 확장
@Controller('auth')
export class AuthController {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly userService: UserService,
  ) {}

  /**
   * OAuth 제공자별 인증 URL 반환
   * GET /auth/oauth-url?provider=google&redirectUrl=...
   */
  @Get('oauth-url')
  async getOAuthUrl(
    @Query('provider') provider: 'google' | 'github' | 'discord',
    @Query('redirectUrl') redirectUrl: string,
  ) {
    try {
      const url = await this.supabaseService.getOAuthUrl(provider, redirectUrl)
      return { url }
    } catch (error) {
      throw new Error(`OAuth URL 생성 실패: ${error.message}`)
    }
  }

  /**
   * OAuth 콜백 처리
   * GET /auth/oauth-callback?code=...
   */
  @Get('oauth-callback')
  async handleOAuthCallback(
    @Query('code') code: string,
    @Res() res: any,
  ) {
    try {
      const result = await this.supabaseService.handleOAuthCallback(code)

      // 성공 시 애플리케이션으로 리다이렉트
      res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${result.session.access_token}`)
    } catch (error) {
      // 실패 시 에러 페이지로 리다이렉트
      res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(error.message)}`)
    }
  }

  /**
   * 이메일 로그인
   * POST /auth/login
   */
  @Post('login')
  async signInWithEmail(
    @Body() loginDto: LoginDto,
  ) {
    try {
      const result = await this.supabaseService.signInWithEmail(loginDto.email, loginDto.password)

      // 내부 데이터베이스에 사용자 정보 생성 또는 조회
      const user = await this.userService.findOrCreateUser(result.user.id, result.user.email!)

      return {
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken: result.session.access_token,
        refreshToken: result.session.refresh_token,
      }
    } catch (error) {
      throw new Error(`이메일 로그인 실패: ${error.message}`)
    }
  }

  /**
   * 이메일 회원가입
   * POST /auth/signup
   */
  @Post('signup')
  async signUpWithEmail(
    @Body() body: { email: string; password: string },
  ) {
    try {
      const result = await this.supabaseService.signUpWithEmail(body.email, body.password)
      return result
    } catch (error) {
      throw new Error(`회원가입 실패: ${error.message}`)
    }
  }

  /**
   * 로그아웃
   * POST /auth/logout
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async signOut(@Req() req: FastifyRequest) {
    try {
      const token = (req as any).headers['authorization']?.split(' ')[1]
      await this.supabaseService.signOut(token)
      return { message: '로그아웃 성공' }
    } catch (error) {
      throw new Error(`로그아웃 실패: ${error.message}`)
    }
  }

  /**
   * 토큰 갱신
   * POST /auth/refresh
   */
  @Post('refresh')
  async refreshSession(
    @Body() body: { refreshToken: string },
  ) {
    try {
      const session = await this.supabaseService.refreshSession(body.refreshToken)
      return {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      }
    } catch (error) {
      throw new Error(`토큰 갱신 실패: ${error.message}`)
    }
  }

  /**
   * 현재 사용자 정보 확인
   * GET /auth/me
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Req() req: FastifyRequest) {
    try {
      // Supabase 사용자 정보 기반으로 내부 DB 사용자 정보 조회
      const user = await this.userService.findOrCreateUser(
        req.user!.id,
        req.user!.email,
      )

      // 내부 사용자 정보를 request에 저장
      req.internalUser = {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        message: '인증된 사용자 정보',
      }
    } catch (error) {
      throw new Error(`사용자 정보 조회 실패: ${error.message}`)
    }
  }

  /**
   * 사용자 프로필 조회
   * GET /auth/profile
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: FastifyRequest) {
    try {
      // getCurrentUser에서 설정한 internalUser 사용
      const userId = req.internalUser?.id || parseInt(req.user!.id)
      const user = await this.userService.getUserProfile(userId)

      return {
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        message: '사용자 프로필 정보',
      }
    } catch (error) {
      throw new Error(`프로필 조회 실패: ${error.message}`)
    }
  }

  /**
   * 사용자 프로필 수정
   * PUT /auth/profile
   */
  @UseGuards(JwtAuthGuard)
  @Post('profile')
  async updateProfile(
    @Req() req: FastifyRequest,
    @Body() updateData: { nickname?: string; avatarUrl?: string },
  ) {
    try {
      const userId = req.internalUser?.id || parseInt(req.user!.id)
      const user = await this.userService.updateProfile(userId, updateData)

      return {
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        message: '프로필 수정 완료',
      }
    } catch (error) {
      throw new Error(`프로필 수정 실패: ${error.message}`)
    }
  }

  /**
   * 계정 탈퇴
   * DELETE /auth/account
   */
  @UseGuards(JwtAuthGuard)
  @Delete('account')
  async deleteAccount(@Req() req: FastifyRequest) {
    try {
      const userId = req.internalUser?.id || parseInt(req.user!.id)
      await this.userService.deleteUser(userId)

      return {
        message: '계정 탈퇴 완료',
      }
    } catch (error) {
      throw new Error(`계정 탈퇴 실패: ${error.message}`)
    }
  }

  /**
   * 사용자 검색 (닉네임 기준)
   * GET /auth/search?keyword=닉네임&limit=10
   */
  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchUsers(
    @Query('keyword') keyword: string,
    @Query('limit') limit: string = '10',
  ) {
    try {
      const searchLimit = parseInt(limit, 10) || 10
      const users = await this.userService.searchUsersByNickname(keyword, searchLimit)

      return {
        users: users.map(user => ({
          id: user.id,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
        })),
        keyword,
        count: users.length,
        message: '사용자 검색 결과',
      }
    } catch (error) {
      throw new Error(`사용자 검색 실패: ${error.message}`)
    }
  }
}