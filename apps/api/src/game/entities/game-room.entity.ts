import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GamePlayerEntity } from './game-player.entity';
import { GameStatus, GamePhase } from './game-status.enum';

export interface GameSettings {
  roundTime?: number;
  maxRounds?: number;
  specialRules?: string[];
}

@Entity('game_rooms')
export class GameRoomEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 32 })
  code: string;

  @Column({ length: 100 })
  title: string;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.WAITING,
  })
  status: GameStatus;

  @Column({
    type: 'enum',
    enum: GamePhase,
    default: GamePhase.LOBBY,
  })
  phase: GamePhase;

  @Column({
    type: 'enum',
    enum: ['EASY', 'NORMAL', 'HARD'],
    default: 'NORMAL',
  })
  difficulty: string;

  @Column()
  minPlayers: number;

  @Column()
  maxPlayers: number;

  @Column({ default: 0 })
  currentPlayers: number;

  @Column({ default: false })
  isPrivate: boolean;

  @Column({ nullable: true, length: 255 })
  password: string;

  @Column({ type: 'int', nullable: true })
  timeLimit: number;

  @Column({
    type: 'json',
    nullable: true,
  })
  gameSettings: GameSettings;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'host_id' })
  host: UserEntity;

  @Column({ name: 'host_id' })
  hostId: number;

  @OneToMany(() => GamePlayerEntity, (player) => player.room)
  players: GamePlayerEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}