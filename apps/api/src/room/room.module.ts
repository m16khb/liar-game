import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RoomGateway } from './gateways/room.gateway';
import { RoomEntity } from './entities/room.entity';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '@/user/user.module';
import { PlayerModule } from '../player/player.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoomEntity]),
    ConfigModule,
    AuthModule,
    UserModule,
    PlayerModule
  ],
  controllers: [RoomController],
  providers: [RoomService, RoomGateway],
  exports: [RoomService],
})
export class RoomModule {}
