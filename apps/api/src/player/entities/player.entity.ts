import { Entity, Column, Index, ManyToOne, OneToMany, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { RoomEntity } from '../../room/entities/room.entity';
import { GameRoleType } from '../../game/entities/game-role.enum';

export enum PlayerStatus {
  READY = 'ready',
  NOT_READY = 'not_ready',
  PLAYING = 'playing',
  ELIMINATED = 'eliminated',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONNECTED = 'DISCONNECTED',
}

export enum GameRoleType {
  LIAR = 'liar',
  CITIZEN = 'citizen',
}

@Entity('players')
@Index('unique_roomId_userId', ['roomId', 'userId'], { unique: true })
@Index('index_roomId_status', ['roomId', 'status'])
export class PlayerEntity extends BaseEntity {
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

  // 게임 관련 필드
  @Column({
    type: 'enum',
    enum: GameRoleType,
    nullable: true,
    comment: '게임 역할 (LIAR/CITIZEN)'
  })
  gameRole: GameRoleType | null;

  @Column({ type: 'boolean', default: false, comment: '투표 여부' })
  hasVoted: boolean;

  @Column({ type: 'json', nullable: true, comment: '투표 데이터' })
  voteData: Record<string, any> | null;

  @Column({ type: 'json', nullable: true, comment: '게임별 추가 데이터' })
  gameData: Record<string, any> | null;

  @Column({ type: 'timestamp', nullable: true, comment: '마지막 활동 시간' })
  lastActiveAt: Date | null;
}
