// Redis 세션 관리 서비스
// 사용자 세션 및 실시간 데이터 캐싱

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { createClient, RedisClientType } from 'redis'

@Injectable()
export class RedisSessionService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType

  async onModuleInit() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD,
    })

    this.client.on('error', (error) => {
      console.error('Redis 연결 오류:', error)
    })

    this.client.on('connect', () => {
      console.log('Redis 연결 성공')
    })

    await this.client.connect()
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit()
    }
  }

  /**
   * 세션 데이터 저장
   * @param sessionId 세션 ID
   * @param data 세션 데이터
   * @param ttl 만료 시간 (초), 기본 24시간
   */
  async setSession(sessionId: string, data: any, ttl: number = 86400): Promise<void> {
    await this.client.setEx(sessionId, ttl, JSON.stringify(data))
  }

  /**
   * 세션 데이터 조회
   * @param sessionId 세션 ID
   */
  async getSession(sessionId: string): Promise<any | null> {
    const data = await this.client.get(sessionId)
    return data ? JSON.parse(data) : null
  }

  /**
   * 세션 데이터 삭제
   * @param sessionId 세션 ID
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.client.del(sessionId)
  }

  /**
   * 방 관련 데이터 캐싱
   * @param roomCode 방 코드
   * @param roomData 방 데이터
   */
  async cacheRoom(roomCode: string, roomData: any): Promise<void> {
    const key = `room:${roomCode}`
    await this.client.setEx(key, 3600, JSON.stringify(roomData)) // 1시간 캐싱
  }

  /**
   * 캐시된 방 데이터 조회
   * @param roomCode 방 코드
   */
  async getCachedRoom(roomCode: string): Promise<any | null> {
    const key = `room:${roomCode}`
    const data = await this.client.get(key)
    return data ? JSON.parse(data) : null
  }

  /**
   * 방 캐시 삭제
   * @param roomCode 방 코드
   */
  async deleteCachedRoom(roomCode: string): Promise<void> {
    const key = `room:${roomCode}`
    await this.client.del(key)
  }

  /**
   * 방 참여자 목록 관리 (실시간 동기화)
   * @param roomId 방 ID
   * @param players 참여자 목록
   */
  async setRoomPlayers(roomId: number, players: any[]): Promise<void> {
    const key = `room:${roomId}:players`
    await this.client.setEx(key, 1800, JSON.stringify(players)) // 30분 캐싱
  }

  /**
   * 방 참여자 목록 조회
   * @param roomId 방 ID
   */
  async getRoomPlayers(roomId: number): Promise<any[] | null> {
    const key = `room:${roomId}:players`
    const data = await this.client.get(key)
    return data ? JSON.parse(data) : null
  }

  /**
   * 실시간 온라인 사용자 관리
   * @param userId 사용자 ID
   * @param lastActive 마지막 활동 시간
   */
  async setUserOnline(userId: number, lastActive: Date = new Date()): Promise<void> {
    const key = `user:${userId}:online`
    await this.client.setEx(key, 300, lastActive.toISOString()) // 5분 타임아웃
  }

  /**
   * 사용자 오프라인 처리
   * @param userId 사용자 ID
   */
  async setUserOffline(userId: number): Promise<void> {
    const key = `user:${userId}:online`
    await this.client.del(key)
  }

  /**
   * 온라인 사용자 여부 확인
   * @param userId 사용자 ID
   */
  async isUserOnline(userId: number): Promise<boolean> {
    const key = `user:${userId}:online`
    const exists = await this.client.exists(key)
    return exists === 1
  }

  /**
   * Redis 클라이언트 직접 접근 (고급 기능용)
   */
  getClient(): RedisClientType {
    return this.client
  }

  /**
   * 키 패턴으로 데이터 삭제 (관리용)
   * @param pattern 키 패턴 (예: "room:*")
   */
  async deleteByPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern)
    if (keys.length > 0) {
      await this.client.del(keys)
    }
  }
}