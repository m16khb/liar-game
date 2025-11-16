import {
  Column,
  Entity,
  Index,
  ManyToOne,
} from 'typeorm';
import { GameEntity } from './game.entity';
import { PlayerEntity } from '../../player/entities/player.entity';
import { BaseEntity } from '../../common/entities/base.entity';

export enum GameActionType {
  JOIN = 'join',
  LEAVE = 'leave',
  CHAT = 'chat',
  VOTE = 'vote',
  KICK_PLAYER = 'kick_player',
  END_GAME = 'end_game',
  CHANGE_STATUS = 'change_status',
  CHANGE_SETTINGS = 'change_settings',
}

@Entity('game_actions')
@Index('index_gameId_type', ['gameId', 'type'])
@Index('index_gameId_playerId', ['gameId', 'playerId'])
@Index('index_timestamp', ['timestamp'])
export class GameActionEntity extends BaseEntity {
  @Column({ type: 'int', unsigned: true })
  gameId: number;

  @ManyToOne(() => GameEntity, (game) => game.actions)
  game: GameEntity;

  @Column({ type: 'int', unsigned: true })
  playerId: number;

  @ManyToOne(() => PlayerEntity, (player) => player.actions)
  player: PlayerEntity;

  @Column({
    type: 'enum',
    enum: GameActionType,
  })
  type: GameActionType;

  @Column({ type: 'json', comment: '액션 데이터' })
  actionData: Record<string, any>;

  @Column({ type: 'timestamp', comment: '액션 타임스탬프' })
  timestamp: Date;
}