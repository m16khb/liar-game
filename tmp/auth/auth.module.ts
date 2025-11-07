// @CODE:AUTH-PASSWORD-001 @CODE:USER-LIFECYCLE-001 | SPEC: .moai/specs/SPEC-AUTH-PASSWORD-001/spec.md, SPEC-USER-LIFECYCLE-001/spec.md
/**
 * Auth Module
 * Provides Supabase authentication with password management and user lifecycle features
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseJwtStrategy } from './strategies/supabase-jwt.strategy';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserModule } from '../user/user.module';
import { CacheModule } from '../cache/cache.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    UserModule,
    CacheModule,
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-default-secret-key',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SupabaseJwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [
    AuthService,
    SupabaseJwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    PassportModule,
    JwtModule, // JwtService를 전역에서 사용할 수 있도록 export
  ],
})
export class AuthModule {}
