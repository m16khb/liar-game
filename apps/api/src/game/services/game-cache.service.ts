import { Injectable, Inject, Optional } from '@nestjs/common';

/**
 * 게임 캐시 서비스
 * Redis를 사용하여 게임 상태를 캐싱합니다.
 * - 게임 상태: game:state:{roomId}
 * - 역할 정보: game:roles:{roomId}
 * - 키워드 정보: game:keyword:{roomId}
 * - 투표 정보: game:votes:{roomId}
 * TTL: 1시간 (3600초)
 */
@Injectable()
export class GameCacheService {
  private readonly CACHE_TTL = 3600; // 1시간

  constructor(
    @Optional()
    @Inject('REDIS_CLIENT')
    private redisClient?: any,
  ) {}

  /**
   * 게임 상태를 조회합니다
   * @param roomId 방 ID
   * @returns 캐시된 게임 상태 또는 null
   */
  async getGameState(roomId: number): Promise<any | null> {
    if (!this.redisClient) return null;

    try {
      const cached = await this.redisClient.get(`game:state:${roomId}`);
      if (!cached) return null;
      return JSON.parse(cached);
    } catch (error) {
      console.error(`Failed to get game state from cache: ${error}`);
      return null;
    }
  }

  /**
   * 게임 상태를 캐시에 저장합니다
   * @param roomId 방 ID
   * @param gameState 게임 상태
   */
  async setGameState(roomId: number, gameState: any): Promise<void> {
    if (!this.redisClient) return;

    try {
      await this.redisClient.set(
        `game:state:${roomId}`,
        JSON.stringify(gameState),
        'EX',
        this.CACHE_TTL,
      );
    } catch (error) {
      console.error(`Failed to set game state in cache: ${error}`);
    }
  }

  /**
   * 게임 상태를 캐시에서 삭제합니다
   * @param roomId 방 ID
   */
  async deleteGameState(roomId: number): Promise<void> {
    if (!this.redisClient) return;

    try {
      await this.redisClient.del(`game:state:${roomId}`);
    } catch (error) {
      console.error(`Failed to delete game state from cache: ${error}`);
    }
  }

  /**
   * 역할 정보를 캐시에 저장합니다
   * @param roomId 방 ID
   * @param roles 역할 정보 Map
   */
  async setRoles(roomId: number, roles: Map<number, any>): Promise<void> {
    if (!this.redisClient) return;

    try {
      const serialized = JSON.stringify(Array.from(roles.entries()));
      await this.redisClient.set(
        `game:roles:${roomId}`,
        serialized,
        'EX',
        this.CACHE_TTL,
      );
    } catch (error) {
      console.error(`Failed to set roles in cache: ${error}`);
    }
  }

  /**
   * 역할 정보를 캐시에서 조회합니다
   * @param roomId 방 ID
   * @returns 캐시된 역할 정보 또는 null
   */
  async getRoles(roomId: number): Promise<Map<number, any> | null> {
    if (!this.redisClient) return null;

    try {
      const cached = await this.redisClient.get(`game:roles:${roomId}`);
      if (!cached) return null;
      const entries = JSON.parse(cached);
      return new Map(entries);
    } catch (error) {
      console.error(`Failed to get roles from cache: ${error}`);
      return null;
    }
  }

  /**
   * 역할 정보를 캐시에서 삭제합니다
   * @param roomId 방 ID
   */
  async deleteRoles(roomId: number): Promise<void> {
    if (!this.redisClient) return;

    try {
      await this.redisClient.del(`game:roles:${roomId}`);
    } catch (error) {
      console.error(`Failed to delete roles from cache: ${error}`);
    }
  }

  /**
   * 키워드 정보를 캐시에 저장합니다
   * @param roomId 방 ID
   * @param keyword 키워드 정보
   */
  async setKeyword(roomId: number, keyword: any): Promise<void> {
    if (!this.redisClient) return;

    try {
      await this.redisClient.set(
        `game:keyword:${roomId}`,
        JSON.stringify(keyword),
        'EX',
        this.CACHE_TTL,
      );
    } catch (error) {
      console.error(`Failed to set keyword in cache: ${error}`);
    }
  }

  /**
   * 키워드 정보를 캐시에서 조회합니다
   * @param roomId 방 ID
   * @returns 캐시된 키워드 정보 또는 null
   */
  async getKeyword(roomId: number): Promise<any | null> {
    if (!this.redisClient) return null;

    try {
      const cached = await this.redisClient.get(`game:keyword:${roomId}`);
      if (!cached) return null;
      return JSON.parse(cached);
    } catch (error) {
      console.error(`Failed to get keyword from cache: ${error}`);
      return null;
    }
  }

  /**
   * 키워드 정보를 캐시에서 삭제합니다
   * @param roomId 방 ID
   */
  async deleteKeyword(roomId: number): Promise<void> {
    if (!this.redisClient) return;

    try {
      await this.redisClient.del(`game:keyword:${roomId}`);
    } catch (error) {
      console.error(`Failed to delete keyword from cache: ${error}`);
    }
  }

  /**
   * 투표 정보를 캐시에 저장합니다
   * @param roomId 방 ID
   * @param votes 투표 정보 Map (voterId -> targetId)
   */
  async setVotes(roomId: number, votes: Map<number, number>): Promise<void> {
    if (!this.redisClient) return;

    try {
      const serialized = JSON.stringify(Array.from(votes.entries()));
      await this.redisClient.set(
        `game:votes:${roomId}`,
        serialized,
        'EX',
        this.CACHE_TTL,
      );
    } catch (error) {
      console.error(`Failed to set votes in cache: ${error}`);
    }
  }

  /**
   * 투표 정보를 캐시에서 조회합니다
   * @param roomId 방 ID
   * @returns 캐시된 투표 정보 또는 null
   */
  async getVotes(roomId: number): Promise<Map<number, number> | null> {
    if (!this.redisClient) return null;

    try {
      const cached = await this.redisClient.get(`game:votes:${roomId}`);
      if (!cached) return null;
      const entries = JSON.parse(cached);
      return new Map(entries);
    } catch (error) {
      console.error(`Failed to get votes from cache: ${error}`);
      return null;
    }
  }

  /**
   * 투표 정보를 캐시에서 삭제합니다
   * @param roomId 방 ID
   */
  async deleteVotes(roomId: number): Promise<void> {
    if (!this.redisClient) return;

    try {
      await this.redisClient.del(`game:votes:${roomId}`);
    } catch (error) {
      console.error(`Failed to delete votes from cache: ${error}`);
    }
  }

  /**
   * 게임 관련 모든 캐시를 삭제합니다
   * @param roomId 방 ID
   */
  async clearGameCache(roomId: number): Promise<void> {
    if (!this.redisClient) return;

    try {
      await this.redisClient.del([
        `game:state:${roomId}`,
        `game:roles:${roomId}`,
        `game:keyword:${roomId}`,
        `game:votes:${roomId}`,
      ]);
    } catch (error) {
      console.error(`Failed to clear game cache: ${error}`);
    }
  }

  /**
   * 게임 상태가 캐시에 존재하는지 확인합니다
   * @param roomId 방 ID
   * @returns 존재 여부
   */
  async existsGameState(roomId: number): Promise<boolean> {
    if (!this.redisClient) return false;

    try {
      const exists = await this.redisClient.exists(`game:state:${roomId}`);
      return exists === 1;
    } catch (error) {
      console.error(`Failed to check game state existence: ${error}`);
      return false;
    }
  }
}
