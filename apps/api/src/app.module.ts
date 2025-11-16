// NestJS 애플리케이션 루트 모듈
// 모든 기능 모듈을 통합하는 최상위 모듈

import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { databaseConfig } from './config/database.config'

// 구현된 모듈들 임포트
import { AuthModule } from './auth/auth.module'
import { UserModule } from './user/user.module'
import { RoomModule } from './room/room.module'
import { PlayerModule } from './player/player.module'

// TODO: 향후 추가할 모듈들
// import { GameModule } from './game/game.module'

@Module({
  imports: [
    // 환경 설정 모듈 - 루트 .env 파일 로드
    ConfigModule.forRoot({
      isGlobal: true, // 전역에서 환경 변수 접근 가능
      envFilePath: '../../.env',
    }),

    // TypeORM 데이터베이스 연결 활성화
   TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => databaseConfig(configService),
      inject: [ConfigService],
    }),
    // 기능 모듈들
    AuthModule,
    UserModule,
    RoomModule,
    PlayerModule,

    // TODO: 향후 추가할 모듈들
    // GameModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
