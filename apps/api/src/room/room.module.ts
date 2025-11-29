import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RoomGateway } from './gateways/room.gateway';
import { RoomEntity } from './entities/room.entity';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '@/user/user.module';
import { PlayerModule } from '../player/player.module';
import { GameModule } from '../game/game.module';
import { Speech } from '../game/entities/speech.entity';
import { UserEntity } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoomEntity, Speech, UserEntity]),
    ConfigModule,
    AuthModule,
    UserModule,
    PlayerModule,
    GameModule,
  ],
  controllers: [RoomController],
  providers: [RoomService, RoomGateway],
  exports: [RoomService],
})
export class RoomModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // No middleware configuration needed
  }
}
