import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * 발언 엔티티
 * 게임 토론 단계에서 플레이어들의 발언을 기록합니다.
 */
@Entity('speeches')
@Index('idx_room_id', ['roomId'])
@Index('idx_created_at', ['createdAt'])
export class Speech {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roomId: number;

  @Column()
  userId: number;

  @Column({ type: 'text' })
  content: string;

  @Column()
  turnNumber: number;

  @CreateDateColumn()
  createdAt: Date;
}
