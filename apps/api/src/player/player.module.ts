import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerService } from './player.service';
import { PlayerEntity } from './entities/player.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerEntity])],
  providers: [PlayerService],
  exports: [PlayerService],
})
export class PlayerModule {}
