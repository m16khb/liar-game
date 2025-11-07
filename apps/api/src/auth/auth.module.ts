// 인증 모듈
// Supabase Auth 기반의 인증 기능 및 사용자 관리

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './entities/user.entity'
import { SupabaseService } from './services/supabase.service'
import { UserService } from './services/user.service'
import { UserRepository } from './repositories/user.repository'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { AuthController } from './controllers/auth.controller'
import { RedisSessionService } from '../session/redis-session.service'
import { AppLoggerService } from '../logger/app.logger.service'
import { SupabaseModule } from './supabase.module'

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]), // User 엔티티 등록
    SupabaseModule, // Supabase 인증 모듈
  ],
  providers: [
    // 서비스들
    SupabaseService,
    UserService,
    RedisSessionService,
    AppLoggerService,

    // 리포지토리
    UserRepository,

    // 가드
    JwtAuthGuard,
  ],
  controllers: [AuthController],
  exports: [
    // 다른 모듈에서 사용할 수 있도록 export
    SupabaseService,
    UserService,
    UserRepository,
    JwtAuthGuard,
    RedisSessionService,
  ],
})
export class AuthModule {}