// @CODE:AUTH-PASSWORD-001 @CODE:USER-LIFECYCLE-001 | SPEC: .moai/specs/SPEC-AUTH-PASSWORD-001/spec.md, SPEC-USER-LIFECYCLE-001/spec.md
/**
 * Auth Controller
 * Authentication endpoints with Supabase integration
 *
 * Implemented Endpoints:
 * - GET /auth/profile - User profile (AUTH-PASSWORD-001)
 * - POST /auth/custom-tokens - Supabase webhook for custom claims (AUTH-PASSWORD-001)
 * - DELETE /auth/withdraw - User withdrawal (USER-LIFECYCLE-001)
 * - POST /auth/check-email - Email availability check (AUTH-PASSWORD-001)
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserEntity } from '../user/entities/user.entity';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { SupabaseAuthHookRequestDto, SupabaseAuthHookResponseDto } from './dto/custom-tokens.dto';
import { SupabaseWebhookGuard } from '@/common/guards/supabase-webhook.guard';
import { CheckEmailDto, CheckEmailResponseDto } from './dto/check-email.dto';

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: '사용자 프로필 조회 성공',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '비인증 - 잘못되거나 누락된 토큰',
  })
  async getProfile(@CurrentUser() user: UserEntity): Promise<UserProfileResponseDto> {
    this.logger.log(
      `📋 Profile Request:\n` +
        `  User ID: ${user.id}\n` +
        `  Email: ${user.email}\n` +
        `  Tier: ${user.tier}\n` +
        `  Role: ${user.role}`
    );

    // UserService를 통해 createdAt, lastLoginAt 포함된 완전한 사용자 정보 조회
    const fullUserProfile = await this.userService.findOneUser(user.id);

    return {
      id: fullUserProfile.id,
      email: fullUserProfile.email,
      tier: fullUserProfile.tier,
      lastLoginAt: fullUserProfile.lastLoginAt?.toISOString() || null,
      createdAt: fullUserProfile.createdAt.toISOString(),
      updatedAt: fullUserProfile.updatedAt.toISOString(),
    };
  }

  // @CODE:USER-LIFECYCLE-001 | SPEC: SPEC-USER-LIFECYCLE-001.md
  @Delete('withdraw')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '회원 탈퇴 - 모든 세션 무효화 및 계정 비활성화',
    description:
      'Backend 계정을 비활성화하고 Supabase의 모든 세션을 무효화합니다. Supabase 사용자 계정은 유지되며, 로그인 토큰만 무효화됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '회원 탈퇴가 완료되었습니다',
    schema: {
      example: {
        message: '회원 탈퇴가 완료되었습니다',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패 또는 사용자를 찾을 수 없음',
  })
  @ApiResponse({
    status: 403,
    description: '관리자 계정은 직접 탈퇴할 수 없습니다',
  })
  async withdraw(@CurrentUser() user: UserEntity): Promise<{ message: string }> {
    this.logger.log(`User withdrawal request for user: ${user.id}`);

    try {
      await this.authService.withdrawUser(user.id);
      this.logger.log(`User withdrawal completed for user: ${user.id}`);
      return { message: '회원 탈퇴가 완료되었습니다' };
    } catch (error) {
      this.logger.error(
        `User withdrawal failed for user: ${user.id}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  @Get('check-email')
  @Public()
  @ApiOperation({
    summary: '이메일 등록 여부 확인',
    description:
      '입력한 이메일 주소가 Backend 데이터베이스 및 Supabase Auth에 등록되어 있는지 확인합니다.\n\n' +
      '회원가입 전 이메일 중복 확인에 사용됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '이메일 확인 성공',
    type: CheckEmailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '유효성 검사 오류 - 올바른 이메일 형식이 아님',
  })
  async checkEmail(@Query() checkEmailDto: CheckEmailDto): Promise<CheckEmailResponseDto> {
    this.logger.log(`Email check request: ${checkEmailDto.email}`);

    try {
      const result = await this.authService.checkEmailRegistration(checkEmailDto.email);
      this.logger.log(`Email check completed: ${checkEmailDto.email} - isExist: ${result.isExist}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Email check failed for: ${checkEmailDto.email}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  // @CODE:AUTH-OAUTH-001 | SPEC: SPEC-AUTH-OAUTH-001.md
  /**
   * Supabase Auth Hook 전용 엔드포인트
   * Supabase가 Custom Access Token Hook으로 호출
   * Supabase JWT에 Backend 사용자 정보(tier, role, user_id) 추가
   *
   * ⚠️ Supabase Hook만 호출 가능 (Webhook Secret 필요)
   * Header: x-webhook-secret: <SUPABASE_WEBHOOK_SECRET>
   *
   * @note 신규 사용자 자동 생성
   * @note soft delete된 사용자는 로그인 차단 (403 에러)
   */
  @Post('custom-tokens')
  @Public()
  @UseGuards(SupabaseWebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supabase Auth Hook - Backend 사용자 정보 추가',
    description:
      '⚠️ Supabase Hook 전용 - 직접 호출 불가\n\n' +
      '신규 사용자는 자동으로 생성되며, 탈퇴한 사용자(soft delete)는 로그인이 차단됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'Claims 업데이트 성공',
    type: SupabaseAuthHookResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '유효성 검사 오류',
  })
  @ApiResponse({
    status: 403,
    description: 'Webhook Secret 검증 실패 또는 탈퇴한 계정',
    schema: {
      example: {
        statusCode: 403,
        message: '탈퇴한 계정입니다. 고객센터에 문의하여 계정 복구를 요청하세요.',
        error: 'Forbidden',
      },
    },
  })
  async customTokens(
    @Body() hookRequest: SupabaseAuthHookRequestDto
  ): Promise<SupabaseAuthHookResponseDto> {
    this.logger.log(`Supabase Auth Hook: ${hookRequest.user_id}`);

    try {
      const result = await this.authService.handleSupabaseAuthHook(
        hookRequest.user_id,
        hookRequest.claims,
        hookRequest.authentication_method
      );

      this.logger.log(`Auth Hook processed for user: ${hookRequest.user_id}`);
      return result;
    } catch (error) {
      this.logger.error(
        'Supabase Auth Hook failed',
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }
}
