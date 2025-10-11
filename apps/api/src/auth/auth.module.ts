// @CODE:AUTH-001 | SPEC: .moai/specs/SPEC-AUTH-001/spec.md | TEST: apps/api/test/auth/
// @CODE:AUTH-002 | SPEC: .moai/specs/SPEC-AUTH-002/spec.md | Supabase Auth 통합
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SessionService } from './session.service';
import { JwtStrategy } from './jwt.strategy';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { SupabaseAuthService } from './supabase-auth.service';
import { SupabaseJwtGuard } from './guards/supabase-jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'test-secret',
      signOptions: { expiresIn: '15m' },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60초
        limit: 10, // 기본 10회
      },
    ]),
    CacheModule.register(),
  ],
  providers: [AuthService, SessionService, JwtStrategy, SupabaseAuthService, SupabaseJwtGuard],
  controllers: [AuthController],
  exports: [AuthService, SessionService, SupabaseAuthService, SupabaseJwtGuard],
})
export class AuthModule {}
