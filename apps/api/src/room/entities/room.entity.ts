import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index, ManyToOne } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';

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
@Index(['status', 'createdAt'])
export class RoomEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  @Column({ unique: true, length: 32})
  code: string;

  @Column({ length: 100 })
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

  @Column({ default: 8, comment: '최대 인원 수' })
  maxPlayers: number;

  @Column({ default: 4, comment: '최소 인원 수' })
  minPlayers: number;

  @Column({ default: 0, comment: '현재 인원 수' })
  currentPlayers: number;

  @Column({ default: false, comment: '비공개 방 여부' })
  isPrivate: boolean;

  @Column({ nullable: true, length: 255, comment: '비밀번호' })
  password: string;

  @Column({ nullable: true, comment: '게임 시간 제한 (초)' })
  timeLimit: number;

  @Column({ type: 'json', nullable: true, comment: '추가 게임 설정' })
  gameSettings: Record<string, any>;

  @Column({ nullable: true, comment: '방 설명' })
  description: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  host: UserEntity;

  @Column({ nullable: true, type: 'int', unsigned: true, comment: '방장 ID' })
  hostId: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;
}
