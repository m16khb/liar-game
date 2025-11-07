// 게임 방 엔티티
// 실시간 게임 방 관리

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export enum RoomStatus {
  WAITING = 'waiting',   // 대기 중
  PLAYING = 'playing',   // 게임 중
  FINISHED = 'finished'  // 종료됨
}

@Entity('game_rooms')
export class GameRoom {
  /**
   * 게임 방 고유 ID (Auto Increment Unsigned Integer)
   */
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number

  /**
   * 고유 방 코드 (6자리 영문자+숫자 조합)
   * 사용자가 방을 찾기 위해 사용
   */
  @Column({ type: 'varchar', length: 6, unique: true, nullable: false })
  roomCode: string

  /**
   * 방장 ID (User FK)
   * 방 생성자이며 관리 권한을 가짐
   */
  @Column({ type: 'int', unsigned: true, nullable: false })
  hostId: number

  /**
   * 방 이름
   * 1-50자, 자유롭게 설정 가능
   */
  @Column({ type: 'varchar', length: 50, nullable: false })
  name: string

  /**
   * 최대 플레이어 수
   * 2-10 사이 값, 기본값은 6
   */
  @Column({ type: 'tinyint', unsigned: true, default: 6 })
  maxPlayers: number

  /**
   * 현재 플레이어 수
   * maxPlayers를 초과할 수 없음
   */
  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  currentPlayers: number

  /**
   * 방 상태
   * WAITING -> PLAYING -> FINISHED 순서로 변경
   */
  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.WAITING,
  })
  status: RoomStatus

  /**
   * 방 생성일시 (UTC 기준)
   */
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  /**
   * 방 수정일시 (UTC 기준)
   */
  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date
}