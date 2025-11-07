import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { SupabaseController } from './controllers/supabase.controller';
import { SupabaseAuthService } from './services/supabase-auth.service';
import { SupabaseJwtStrategy } from './strategies/supabase-jwt.strategy';

/**
 * Supabase Auth Module
 *
 * Supabase 인증 시스템과의 연동을 담당하는 모듈
 * - JWT 검증 전략
 * - Webhook 컨트롤러
 * - Supabase 인증 서비스
 */
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({
      defaultStrategy: 'supabase-jwt',
    }),
  ],
  controllers: [SupabaseController],
  providers: [SupabaseAuthService, SupabaseJwtStrategy],
  exports: [SupabaseAuthService, SupabaseJwtStrategy],
})
export class SupabaseModule {}