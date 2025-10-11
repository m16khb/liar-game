// @CODE:AUTH-001:INFRA | SPEC: SPEC-AUTH-001.md
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface SessionData {
  id: string;
  username: string;
  role: 'USER' | 'PREMIUM' | 'ADMIN';
  lastActivity: number;
  currentRoomId?: string;
}

@Injectable()
export class SessionService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * 세션 생성 (등록 유저)
   * TTL: 30일 (2592000초)
   */
  async createSession(userId: string, data: SessionData): Promise<void> {
    const key = `session:${userId}`;
    const TTL = 30 * 24 * 60 * 60; // 30일
    await this.cacheManager.set(key, data, TTL);
  }

  /**
   * 세션 조회
   */
  async getSession(userId: string): Promise<SessionData | null> {
    const key = `session:${userId}`;
    const session = await this.cacheManager.get<SessionData>(key);
    return session ?? null;
  }

  /**
   * 세션 삭제
   */
  async deleteSession(userId: string): Promise<boolean> {
    const key = `session:${userId}`;
    await this.cacheManager.del(key);
    return true;
  }

  /**
   * 세션 TTL 갱신 (마지막 활동 시간 업데이트)
   */
  async renewSessionTTL(userId: string): Promise<boolean> {
    const session = await this.getSession(userId);
    if (!session) return false;

    session.lastActivity = Date.now();
    await this.createSession(userId, session);
    return true;
  }

  /**
   * 유저의 활성 세션 개수 확인 (SPEC CON-004: 최대 5개)
   */
  async getUserSessionCount(userId: string): Promise<number> {
    // Redis에서 session:{userId}* 패턴 검색
    const key = `session:${userId}`;
    const session = await this.cacheManager.get(key);
    return session ? 1 : 0;
  }
}
