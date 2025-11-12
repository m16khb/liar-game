import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { RoomEntity } from '../../room/entities/room.entity';

export enum PlayerStatus {
  READY = 'ready',
  NOT_READY = 'not_ready',
  PLAYING = 'playing',
  ELIMINATED = 'eliminated',
}

@Entity('players')
@Index('unique_roomId_userId', ['roomId', 'userId'], { unique: true })
@Index('index_roomId_status', ['roomId', 'status'])
export class PlayerEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ type: 'int', unsigned: true, comment: '방 ID' })
  roomId: number;

  @Column({ type: 'int', unsigned: true, comment: '사용자 ID' })
  userId: number;

  @ManyToOne(() => RoomEntity, { createForeignKeyConstraints: false })
  room: RoomEntity;

  @ManyToOne(() => UserEntity, { createForeignKeyConstraints: false })
  user: UserEntity;

  @Column({
    type: 'enum',
    enum: PlayerStatus,
    default: PlayerStatus.NOT_READY,
    comment: '플레이어 상태'
  })
  status: PlayerStatus;

  @Column({ type: 'int', default: 0, comment: '참가 순서' })
  joinOrder: number;

  @Column({ type: 'boolean', default: false, comment: '방장 여부' })
  isHost: boolean;

  @Column({ type: 'json', nullable: true, comment: '게임별 추가 데이터' })
  gameData: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true, comment: '마지막 활동 시간' })
  lastActiveAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
