import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerService } from './player.service';
import { PlayerEntity } from './entities/player.entity';
import { UserEntity } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerEntity, UserEntity])],
  providers: [PlayerService],
  exports: [PlayerService],
})
export class PlayerModule {}
