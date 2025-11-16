import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GameRoomEntity } from './game-room.entity';
import { GameRole } from './game-role.entity';

export enum PlayerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONNECTED = 'DISCONNECTED',
}

@Entity('game_players')
export class GamePlayerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => GameRoomEntity, (room) => room.players)
  @JoinColumn({ name: 'room_id' })
  room: GameRoomEntity;

  @Column({ name: 'room_id' })
  roomId: number;

  @ManyToOne(() => GameRole, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  role: GameRole;

  @Column({ name: 'role_id', nullable: true })
  roleId: number;

  @Column({
    type: 'enum',
    enum: PlayerStatus,
    default: PlayerStatus.ACTIVE,
  })
  status: PlayerStatus;

  @Column({ default: false })
  hasVoted: boolean;

  @Column({ type: 'json', nullable: true })
  voteData: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_at', nullable: true })
  updatedAt: Date | null;
}