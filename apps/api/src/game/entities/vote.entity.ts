import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, Unique } from 'typeorm';

/**
 * 투표 엔티티
 * 게임 투표 단계에서 플레이어들의 투표를 기록합니다.
 */
@Entity('votes')
@Index('idx_room_id', ['roomId'])
@Unique('unique_vote', ['roomId', 'voterId'])
export class Vote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roomId: number;

  @Column()
  voterId: number;

  @Column()
  targetId: number;

  @CreateDateColumn()
  createdAt: Date;
}
