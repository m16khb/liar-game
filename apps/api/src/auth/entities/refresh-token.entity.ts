// @CODE:AUTH-001:DATA | SPEC: SPEC-AUTH-001.md
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * RefreshToken Entity
 *
 * 참고: 현재 Supabase가 리프레시 토큰을 관리하고 있으므로,
 * 이 entity는 향후 확장성을 위해 정의만 되어있습니다.
 */
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column({ type: 'text' })
  token: string;

  @Column({ type: 'bigint' })
  expiresAt: number;

  @CreateDateColumn()
  createdAt: Date;
}
