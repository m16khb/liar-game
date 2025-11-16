import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum GameRoleType {
  LIAR = 'LIAR',
  DETECTIVE = 'DETECTIVE',
  CITIZEN = 'CITIZEN',
  WITNESS = 'WITNESS',
  SPECIALIST = 'SPECIALIST',
}

@Entity('game_roles')
export class GameRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: GameRoleType,
  })
  type: GameRoleType;

  @Column({ length: 50 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  isSpecial: boolean;

  @Column({ default: 0 })
  priority: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}