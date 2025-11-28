import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

/**
 * 게임 키워드 엔티티
 * 게임에 사용되는 키워드를 관리합니다.
 * 각 키워드는 난이도, 카테고리, 실제 단어를 포함합니다.
 */
@Entity('keyword')
@Index('idx_difficulty', ['difficulty'])
@Index('idx_category', ['category'])
export class Keyword {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  word: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'enum', enum: ['EASY', 'NORMAL', 'HARD'] })
  difficulty: 'EASY' | 'NORMAL' | 'HARD';

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
