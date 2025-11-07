import {
  Body,
  Controller,
  Post,
  UseGuards,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseWebhookGuard } from '../../common/guards/supabase-webhook.guard';
import { SupabaseAuthService } from '../services/supabase-auth.service';

/**
 * Supabase Webhook 컨트롤러
 *
 * Supabase Auth Hook 엔드포인트로부터 웹훅을 수신하여 처리합니다.
 * - Custom Access Token Hook: JWT에 Backend 사용자 정보 추가
 */
@Controller('api/webhooks/supabase')
@UseGuards(SupabaseWebhookGuard)
export class SupabaseController {
  private readonly logger = new Logger(SupabaseController.name);

  constructor(private readonly supabaseAuthService: SupabaseAuthService) {}

  /**
   * Supabase Custom Access Token Hook
   *
   * 사용자 로그인/토큰 갱신 시 Supabase가 호출하는 Hook
   * JWT에 Backend 사용자 정보(tier, role, user_id)를 추가하여 반환합니다.
   *
   * @param payload - Supabase Hook 페이로드
   * @returns JWT claims에 추가할 사용자 정보
   *
   * @see https://supabase.com/docs/guides/auth/auth-hooks#custom-access-token-jwt-hooks
   */
  @Post('custom-access-token')
  async handleCustomAccessTokenHook(@Body() payload: any) {
    this.logger.debug(
      `🔔 Custom Access Token Hook:\n` +
        `  user_id: ${payload.user_id}\n` +
        `  authentication_method: ${payload.authentication_method}\n` +
        `  email: ${payload.record?.email}\n` +
        `  phone: ${payload.record?.phone}\n` +
        `  created_at: ${payload.record?.created_at}\n` +
        `  updated_at: ${payload.record?.updated_at}`
    );

    try {
      const { user_id, authentication_method, record } = payload;

      if (!user_id || !record) {
        this.logger.error('❌ Invalid webhook payload: missing required fields');
        throw new BadRequestException('Invalid webhook payload');
      }

      // 이메일 또는 전화번호가 없는 경우 처리 거부
      const email = record.email;
      const phone = record.phone;

      if (!email && !phone) {
        this.logger.error('❌ User record missing both email and phone');
        throw new BadRequestException('User must have email or phone');
      }

      // Supabase Auth Hook 처리
      const result = await this.supabaseAuthService.handleSupabaseAuthHook(
        user_id,
        {
          email: email,
          phone: phone,
          app_metadata: record.app_metadata || {},
          user_metadata: record.user_metadata || {},
          ...record,
        },
        authentication_method
      );

      this.logger.log(
        `✅ Custom Access Token Hook processed:\n` +
          `  Supabase user_id: ${user_id}\n` +
          `  Backend user_id: ${result.claims.user_id}\n` +
          `  User tier: ${result.claims.user_tier}\n` +
          `  User role: ${result.claims.user_role}\n` +
          `  Auth method: ${authentication_method}`
      );

      return result;
    } catch (error) {
      this.logger.error(
        `❌ Custom Access Token Hook failed:\n` +
          `  Error: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
          `  Supabase user_id: ${payload.user_id}\n` +
          `  Stack: ${error instanceof Error ? error.stack : undefined}`
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to process auth hook');
    }
  }
}