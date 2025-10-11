// @CODE:AUTH-001:DATA | SPEC: SPEC-AUTH-001.md
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UserRole {
  USER = 'user',
  PREMIUM = 'premium',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  @Index('idx_users_email')
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  @Column({ type: 'varchar', length: 50 })
  username: string;

  // OAuth 관련 필드
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  @Index('idx_users_supabase_id')
  supabaseId: string | null; // Supabase user.id

  @Column({ type: 'varchar', length: 20, nullable: true })
  oauthProvider: string | null; // 'google', 'kakao'

  // Role 필드
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
