// @CODE:AUTH-001:DATA | SPEC: SPEC-AUTH-001.md
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_users_email')
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 50 })
  username: string;

  @Column({ type: 'boolean', default: false, name: 'is_guest' })
  isGuest: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'guest_session_id' })
  @Index('idx_users_guest_session')
  guestSessionId: string | null;

  @Column({ type: 'int', default: 1 })
  level: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
