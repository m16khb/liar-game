// 사용자 엔티티
// Supabase Auth와 연동되는 사용자 정보 관리

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

/**
 * 사용자 역할 enum
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

/**
 * 사용자 등급 enum
 */
export enum UserTier {
  MEMBER = 'MEMBER',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP',
}

@Entity('users')
export class User {
  /**
   * 사용자 고유 ID (Auto Increment Unsigned Integer)
   * 내부 데이터베이스에서 사용하는 기본 키
   */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number

  /**
   * OAuth 제공자 (email, google, github 등)
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  oauthProvider?: string

  /**
   * Supabase OAuth ID (고유 식별자)
   * Supabase 인증 시스템과 연동을 위한 외부 키
   */
  @Column({ type: 'varchar', length: 36, unique: true, nullable: false })
  oauthId: string

  /**
   * 사용자 등급
   */
  @Column({
    type: 'enum',
    enum: UserTier,
    default: UserTier.MEMBER
  })
  tier: UserTier

  /**
   * 사용자 역할
   */
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role: UserRole

  /**
   * 계정 삭제일시 (Soft Delete)
   */
  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date

  /**
   * 이메일 주소
   * Supabase에서 관리하며 중복 불가
   */
  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string

  /**
   * 게임 내 닉네임
   * 2-20자, 특수문자 제한
   */
  @Column({ type: 'varchar', length: 20, nullable: false })
  nickname: string

  /**
   * 프로필 이미지 URL (선택사항)
   * 유효한 URL 형식만 허용
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl?: string

  /**
   * 계정 생성일시 (UTC 기준)
   */
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  /**
   * 계정 수정일시 (UTC 기준)
   */
  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date
}