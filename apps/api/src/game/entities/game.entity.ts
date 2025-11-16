import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { RoomEntity } from '../../room/entities/room.entity';
import { PlayerEntity } from '../../player/entities/player.entity';
import { BaseEntity } from '../../common/entities/base.entity';

export enum GameStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

export enum GameDifficulty {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
}

@Entity('games')
@Index('index_roomId_status', ['roomId', 'status'])
@Index('index_version', ['version'])
export class GameEntity extends BaseEntity {
  @Column({ type: 'int', unsigned: true })
  roomId: number;

  @ManyToOne(() => RoomEntity, (room) => room.games)
  room: RoomEntity;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.WAITING,
  })
  status: GameStatus;

  @Column({
    type: 'enum',
    enum: GameDifficulty,
    default: GameDifficulty.NORMAL,
  })
  difficulty: GameDifficulty;

  @Column({ type: 'int', default: 1, comment: '현재 라운드' })
  currentRound: number;

  @Column({ type: 'int', comment: '총 라운드 수' })
  totalRounds: number;

  @Column({ type: 'int', nullable: true, comment: '현재 턴 플레이어 ID' })
  currentPlayerTurn: number | null;

  @Column({ type: 'int', nullable: true, comment: '시간 제한 (초)' })
  timeLimit: number | null;

  @Column({ type: 'json', nullable: true, comment: '게임 설정' })
  gameSettings: Record<string, any> | null;

  @OneToMany(() => PlayerEntity, (player) => player.game)
  players: PlayerEntity[];

  @OneToMany(() => 'GameActionEntity', (action) => action.game)
  actions: any[];

  @Column({ type: 'int', default: 1, comment: '낙관적 잠금 버전' })
  version: number;
}