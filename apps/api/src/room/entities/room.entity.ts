import { Entity, Column, Index, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { PlayerEntity } from '../../player/entities/player.entity';

export enum RoomStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

export enum GameDifficulty {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
}

@Entity('rooms')
@Index('unique_code', ['code'], { unique: true })
@Index('index_status_createdAt', ['status', 'createdAt'])
export class RoomEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 32 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.WAITING,
  })
  status: RoomStatus;

  @Column({
    type: 'enum',
    enum: GameDifficulty,
    default: GameDifficulty.NORMAL,
  })
  difficulty: GameDifficulty;

  @Column({ type: 'int', default: 8, comment: '최대 인원 수' })
  maxPlayers: number;

  @Column({ type: 'int', default: 4, comment: '최소 인원 수' })
  minPlayers: number;

  @Column({ type: 'int', default: 0, comment: '현재 인원 수' })
  currentPlayers: number;

  @Column({ type: 'boolean', default: false, comment: '비공개 방 여부' })
  isPrivate: boolean;

  @Column({ type: 'varchar', nullable: true, length: 255, comment: '비밀번호' })
  password: string;

  @Column({ type: 'int', nullable: true, comment: '게임 시간 제한 (초)' })
  timeLimit: number;

  @Column({ type: 'json', nullable: true, comment: '추가 게임 설정' })
  gameSettings: Record<string, any>;

  @Column({ type: 'text', nullable: true, comment: '방 설명' })
  description: string;

  @ManyToOne(() => UserEntity, { nullable: true, createForeignKeyConstraints: false })
  host: UserEntity;

  @Column({ nullable: true, type: 'int', unsigned: true, comment: '방장 ID' })
  hostId: number;

  @Column({ type: 'timestamp', nullable: true, comment: '마지막 활동 시간' })
  lastActiveAt: Date | null;

  @OneToMany(() => PlayerEntity, (player) => player.room)
  players: PlayerEntity[];

  @OneToMany(() => 'GameEntity', (game) => game.room)
  games: any[];
}