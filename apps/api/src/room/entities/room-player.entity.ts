// 방 참여자 엔티티
// 게임 방에 참여한 플레이어 정보 관리

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('room_players')
export class RoomPlayer {
  /**
   * 참여자 고유 ID (Auto Increment Unsigned Integer)
   */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number

  /**
   * 방 ID (GameRoom FK)
   * 참여한 게임 방을 식별
   */
  @Column({ type: 'int', unsigned: true, nullable: false })
  roomId: number

  /**
   * 사용자 ID (User FK)
   * 참여한 사용자를 식별
   */
  @Column({ type: 'int', unsigned: true, nullable: false })
  userId: number

  /**
   * 방장 여부
   * 방 생성자 또는 방장 권한 위임 여부
   */
  @Column({ type: 'boolean', default: false })
  isHost: boolean

  /**
   * 입장 시각 (UTC 기준)
   * 플레이어가 언제 방에 참여했는지 기록
   */
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date

  /**
   * 활성 상태
   * true: 방에 참여 중, false: 퇴장 또는 비활성
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean
}