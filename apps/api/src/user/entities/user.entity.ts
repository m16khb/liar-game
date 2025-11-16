import {
  Column,
  Entity,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum UserTier {
  GUEST = 'guest',
  MEMBER = 'member',
  PREMIUM = 'premium',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity({ name: 'users' })
@Index('unique_email', ['email'], { unique: true })
@Index('index_tier', ['tier'])
export class UserEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({
    type: 'enum',
    enum: UserTier,
    default: UserTier.GUEST,
  })
  tier: UserTier;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ type: 'varchar', length: 50, nullable: true })
  oauthProvider: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  oauthId: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nickname: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;
}
