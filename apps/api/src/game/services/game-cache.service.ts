import { Injectable, Inject, Optional } from '@nestjs/common';

/**
 * 게임 데이터 인터페이스
 */
export interface GameData {
  roomId: number;
  liarId: number;
  keyword: { word: string; category: string };
  roles: Map<number, { type: 'LIAR' | 'CIVILIAN'; userId: number }>;
  totalRounds: number;
  currentRound: number;
}

/**
 * 게임 캐시 서비스
 * Redis를 사용하여 게임 상태를 캐싱합니다.
 * Redis가 없을 경우 인메모리 캐시를 사용합니다.
 * - 게임 상태: game:state:{roomId}
 * - 역할 정보: game:roles:{roomId}
 * - 키워드 정보: game:keyword:{roomId}
 * - 투표 정보: game:votes:{roomId}
 * - 게임 데이터: game:data:{roomId}
 * TTL: 1시간 (3600초)
 */
@Injectable()
export class GameCacheService {
  private readonly CACHE_TTL = 3600; // 1시간

  // 인메모리 캐시 (Redis 없을 때 폴백)
  private memoryCache: Map<string, { data: any; expireAt: number }> = new Map();

  constructor(
    @Optional()
    @Inject('REDIS_CLIENT')
    private redisClient?: any,
  ) {}

  /**
   * 인메모리 캐시 헬퍼 메서드
   */
  private memoryGet(key: string): any | null {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expireAt) {
      this.memoryCache.delete(key);
      return null;
    }
    return cached.data;
  }

  private memorySet(key: string, data: any): void {
    this.memoryCache.set(key, {
      data,
      expireAt: Date.now() + this.CACHE_TTL * 1000,
    });
  }

  private memoryDelete(key: string): void {
    this.memoryCache.delete(key);
  }

  /**
   * 게임 상태를 조회합니다
   * @param roomId 방 ID
   * @returns 캐시된 게임 상태 또는 null
   */
  async getGameState(roomId: number): Promise<any | null> {
    const key = `game:state:${roomId}`;

    if (this.redisClient) {
      try {
        const cached = await this.redisClient.get(key);
        if (!cached) return null;
        return JSON.parse(cached);
      } catch (error) {
        console.error(`Failed to get game state from cache: ${error}`);
      }
    }

    // 인메모리 폴백
    return this.memoryGet(key);
  }

  /**
   * 게임 상태를 캐시에 저장합니다
   * @param roomId 방 ID
   * @param gameState 게임 상태
   */
  async setGameState(roomId: number, gameState: any): Promise<void> {
    const key = `game:state:${roomId}`;

    if (this.redisClient) {
      try {
        await this.redisClient.set(key, JSON.stringify(gameState), 'EX', this.CACHE_TTL);
        return;
      } catch (error) {
        console.error(`Failed to set game state in cache: ${error}`);
      }
    }

    // 인메모리 폴백
    this.memorySet(key, gameState);
  }

  /**
   * 게임 상태를 캐시에서 삭제합니다
   * @param roomId 방 ID
   */
  async deleteGameState(roomId: number): Promise<void> {
    const key = `game:state:${roomId}`;

    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
        return;
      } catch (error) {
        console.error(`Failed to delete game state from cache: ${error}`);
      }
    }

    // 인메모리 폴백
    this.memoryDelete(key);
  }

  /**
   * 게임 데이터(라이어 ID, 키워드, 라운드 정보)를 저장합니다
   * @param roomId 방 ID
   * @param data 게임 데이터
   */
  async setGameData(roomId: number, data: Omit<GameData, 'roles'> & { roles: Array<[number, any]> }): Promise<void> {
    const key = `game:data:${roomId}`;

    if (this.redisClient) {
      try {
        await this.redisClient.set(key, JSON.stringify(data), 'EX', this.CACHE_TTL);
        return;
      } catch (error) {
        console.error(`Failed to set game data in cache: ${error}`);
      }
    }

    // 인메모리 폴백
    this.memorySet(key, data);
  }

  /**
   * 게임 데이터를 조회합니다
   * @param roomId 방 ID
   * @returns 게임 데이터 또는 null
   */
  async getGameData(roomId: number): Promise<(Omit<GameData, 'roles'> & { roles: Array<[number, any]> }) | null> {
    const key = `game:data:${roomId}`;

    if (this.redisClient) {
      try {
        const cached = await this.redisClient.get(key);
        if (cached) return JSON.parse(cached);
      } catch (error) {
        console.error(`Failed to get game data from cache: ${error}`);
      }
    }

    // 인메모리 폴백
    return this.memoryGet(key);
  }

  /**
   * 라이어 ID를 조회합니다
   * @param roomId 방 ID
   * @returns 라이어 ID 또는 null
   */
  async getLiarId(roomId: number): Promise<number | null> {
    const data = await this.getGameData(roomId);
    return data?.liarId ?? null;
  }

  /**
   * 게임 데이터를 삭제합니다
   * @param roomId 방 ID
   */
  async deleteGameData(roomId: number): Promise<void> {
    const key = `game:data:${roomId}`;

    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
        return;
      } catch (error) {
        console.error(`Failed to delete game data from cache: ${error}`);
      }
    }

    // 인메모리 폴백
    this.memoryDelete(key);
  }

  /**
   * 역할 정보를 캐시에 저장합니다
   * @param roomId 방 ID
   * @param roles 역할 정보 Map
   */
  async setRoles(roomId: number, roles: Map<number, any>): Promise<void> {
    const key = `game:roles:${roomId}`;
    const serialized = Array.from(roles.entries());

    if (this.redisClient) {
      try {
        await this.redisClient.set(key, JSON.stringify(serialized), 'EX', this.CACHE_TTL);
        return;
      } catch (error) {
        console.error(`Failed to set roles in cache: ${error}`);
      }
    }

    // 인메모리 폴백
    this.memorySet(key, serialized);
  }

  /**
   * 역할 정보를 캐시에서 조회합니다
   * @param roomId 방 ID
   * @returns 캐시된 역할 정보 또는 null
   */
  async getRoles(roomId: number): Promise<Map<number, any> | null> {
    const key = `game:roles:${roomId}`;

    if (this.redisClient) {
      try {
        const cached = await this.redisClient.get(key);
        if (cached) {
          const entries = JSON.parse(cached);
          return new Map(entries);
        }
      } catch (error) {
        console.error(`Failed to get roles from cache: ${error}`);
      }
    }

    // 인메모리 폴백
    const entries = this.memoryGet(key);
    if (entries) return new Map(entries);
    return null;
  }

  /**
   * 역할 정보를 캐시에서 삭제합니다
   * @param roomId 방 ID
   */
  async deleteRoles(roomId: number): Promise<void> {
    const key = `game:roles:${roomId}`;

    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
        return;
      } catch (error) {
        console.error(`Failed to delete roles from cache: ${error}`);
      }
    }

    // 인메모리 폴백
    this.memoryDelete(key);
  }

  /**
   * 키워드 정보를 캐시에 저장합니다
   * @param roomId 방 ID
   * @param keyword 키워드 정보
   */
  async setKeyword(roomId: number, keyword: any): Promise<void> {
    const key = `game:keyword:${roomId}`;

    if (this.redisClient) {
      try {
        await this.redisClient.set(key, JSON.stringify(keyword), 'EX', this.CACHE_TTL);
        return;
      } catch (error) {
        console.error(`Failed to set keyword in cache: ${error}`);
      }
    }

    // 인메모리 폴백
    this.memorySet(key, keyword);
  }

  /**
   * 키워드 정보를 캐시에서 조회합니다
   * @param roomId 방 ID
   * @returns 캐시된 키워드 정보 또는 null
   */
  async getKeyword(roomId: number): Promise<any | null> {
    const key = `game:keyword:${roomId}`;

    if (this.redisClient) {
      try {
        const cached = await this.redisClient.get(key);
        if (cached) return JSON.parse(cached);
      } catch (error) {
        console.error(`Failed to get keyword from cache: ${error}`);
      }
    }

    // 인메모리 폴백
    return this.memoryGet(key);
  }

  /**
   * 키워드 정보를 캐시에서 삭제합니다
   * @param roomId 방 ID
   */
  async deleteKeyword(roomId: number): Promise<void> {
    const key = `game:keyword:${roomId}`;

    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
        return;
      } catch (error) {
        console.error(`Failed to delete keyword from cache: ${error}`);
      }
    }

    // 인메모리 폴백
    this.memoryDelete(key);
  }

  /**
   * 투표 정보를 캐시에 저장합니다
   * @param roomId 방 ID
   * @param votes 투표 정보 Map (voterId -> targetId)
   */
  async setVotes(roomId: number, votes: Map<number, number>): Promise<void> {
    const key = `game:votes:${roomId}`;
    const serialized = Array.from(votes.entries());

    if (this.redisClient) {
      try {
        await this.redisClient.set(key, JSON.stringify(serialized), 'EX', this.CACHE_TTL);
        return;
      } catch (error) {
        console.error(`Failed to set votes in cache: ${error}`);
      }
    }

    // 인메모리 폴백
    this.memorySet(key, serialized);
  }

  /**
   * 투표 정보를 캐시에서 조회합니다
   * @param roomId 방 ID
   * @returns 캐시된 투표 정보 또는 null
   */
  async getVotes(roomId: number): Promise<Map<number, number> | null> {
    const key = `game:votes:${roomId}`;

    if (this.redisClient) {
      try {
        const cached = await this.redisClient.get(key);
        if (cached) {
          const entries = JSON.parse(cached);
          return new Map(entries);
        }
      } catch (error) {
        console.error(`Failed to get votes from cache: ${error}`);
      }
    }

    // 인메모리 폴백
    const entries = this.memoryGet(key);
    if (entries) return new Map(entries);
    return null;
  }

  /**
   * 투표 정보를 캐시에서 삭제합니다
   * @param roomId 방 ID
   */
  async deleteVotes(roomId: number): Promise<void> {
    const key = `game:votes:${roomId}`;

    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
        return;
      } catch (error) {
        console.error(`Failed to delete votes from cache: ${error}`);
      }
    }

    // 인메모리 폴백
    this.memoryDelete(key);
  }

  /**
   * 게임 관련 모든 캐시를 삭제합니다
   * @param roomId 방 ID
   */
  async clearGameCache(roomId: number): Promise<void> {
    const keys = [
      `game:state:${roomId}`,
      `game:roles:${roomId}`,
      `game:keyword:${roomId}`,
      `game:votes:${roomId}`,
      `game:data:${roomId}`,
    ];

    if (this.redisClient) {
      try {
        await this.redisClient.del(keys);
        return;
      } catch (error) {
        console.error(`Failed to clear game cache: ${error}`);
      }
    }

    // 인메모리 폴백
    keys.forEach(key => this.memoryDelete(key));
  }

  /**
   * 게임 상태가 캐시에 존재하는지 확인합니다
   * @param roomId 방 ID
   * @returns 존재 여부
   */
  async existsGameState(roomId: number): Promise<boolean> {
    const key = `game:state:${roomId}`;

    if (this.redisClient) {
      try {
        const exists = await this.redisClient.exists(key);
        return exists === 1;
      } catch (error) {
        console.error(`Failed to check game state existence: ${error}`);
      }
    }

    // 인메모리 폴백
    return this.memoryGet(key) !== null;
  }
}
