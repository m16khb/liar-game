import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RoomGateway } from './gateways/room.gateway';
import { PlayerService } from './services/player.service';
import { RoomEntity } from './entities/room.entity';
import { PlayerEntity } from './entities/player.entity';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '@/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RoomEntity, PlayerEntity]),
    ConfigModule,
    AuthModule,
    UserModule
  ],
  controllers: [RoomController],
  providers: [RoomService, PlayerService, RoomGateway],
  exports: [RoomService, PlayerService],
})
export class RoomModule {}
