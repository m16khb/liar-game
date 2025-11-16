# SPEC-DATA-001: 데이터 모델 일관성 및 게임 상태 관리 - 구현 계획

## 1. 개요

본 문서는 라이어 게임의 데이터 모델 일관성 확보와 게임 상태 관리 최적화를 위한 상세 구현 계획을 설명합니다. 정규화, 캐싱, 동시성 제어 등 핵심 데이터 관리 전략을 다룹니다.

## 2. 구현 마일스톤

### 2.1 1단계: 데이터 모델 재설계 (최우선)
- **목표**: 정규화된 데이터 모델 구현
- **산출물**:
  - Game, GamePlayer, GameAction 엔티티 구현
  - 관계 재정의 및 외래키 설정
  - 제3정규형(3NF) 만족 설계
  - 불필요한 중복 제거
- **의존성**: 없음

### 2.2 2단계: 상태 관리 시스템 (최우선)
- **목표**: 안정적인 게임 상태 전이 관리
- **산출물**:
  - State Machine 패턴 구현
  - 상태 전이 규칙 정의
  - 낙관적 잠금(Optimistic Locking) 구현
  - 버전 관리 시스템
- **의존성**: 1단계 완료

### 2.3 3단계: 캐싱 전략 구현 (핵심)
- **목표**: Redis 기반 고성능 캐싱
- **산출물**:
  - CacheService 구현
  - Cache-Aside 패턴 적용
  - 캐시 키 설계 및 TTL 정책
  - 캐시 워밍업 전략
- **의존성**: Redis 클러스터 설정

### 2.4 4단계: 트랜잭션 관리 (필수)
- **목표**: 데이터 일관성 보장
- **산출물**:
  - @Transactional 데코레이터 적용
  - 분산 트랜잭션 Saga 패턴
  - 롤백 메커니즘
  - 트랜잭션 격리 수준 최적화
- **의존성**: 1, 2단계 완료

### 2.5 5단계: 마이그레이션 시스템 (중요)
- **목표**: Zero-downtime 데이터베이스 마이그레이션
- **산출물**:
  - TypeORM Migration 스크립트
  - 데이터 검증 도구
  - 롤백 스크립트
  - 마이그레이션 실행 모니터링
- **의존성**: 1단계 완료

### 2.6 6단계: 성능 최적화 (완료)
- **목표**: 쿼리 성능 향상
- **산출물**:
  - 인덱스 전략 수립
  - 쿼리 프로파일링 및 최적화
  - N+1 문제 해결
  - 파티셔닝 전략 준비
- **의존성**: 모든 이전 단계 완료

## 3. 기술적 접근 방식

### 3.1 아키텍처 설계
- **도메인 모델**: Game, Player, Room 핵심 도메인
- **데이터 접근**: Repository 패턴 with TypeORM
- **상태 관리**: State Machine 패턴
- **캐싱**: Cache-Aside 패턴
- **동시성**: Optimistic Locking

### 3.2 핵심 데이터 모델

#### 3.2.1 Game 엔티티
```typescript
@Entity()
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Room, (room) => room.games)
  room: Room;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.WAITING
  })
  status: GameStatus;

  @Column({
    type: 'enum',
    enum: GamePhase,
    nullable: true
  })
  phase: GamePhase;

  @Column({ type: 'jsonb' })
  config: GameConfig;

  @Column({ type: 'int', default: 1 })
  version: number; // 낙관적 잠금

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt: Date;

  @OneToMany(() => GamePlayer, (player) => player.game)
  players: GamePlayer[];

  @OneToMany(() => GameAction, (action) => action.game)
  actions: GameAction[];

  @VersionColumn()
  @Column({ type: 'int' })
  optimisticLockVersion: number;
}
```

#### 3.2.2 GamePlayer 엔티티
```typescript
@Entity()
@Unique(['game', 'user']) // 한 게임에 한 번만 참여
export class GamePlayer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Game, (game) => game.players, { onDelete: 'CASCADE' })
  game: Game;

  @ManyToOne(() => User, (user) => user.gamePlayers)
  user: User;

  @Column({
    type: 'enum',
    enum: PlayerRole
  })
  role: PlayerRole;

  @Column({ default: true })
  isAlive: boolean;

  @Column({ default: true })
  isConnected: boolean;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  joinedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  leftAt: Date;
}
```

### 3.3 상태 관리 구현

#### 3.3.1 State Machine
```typescript
@Injectable()
export class GameStateService {
  private stateTransitions = {
    [GameStatus.WAITING]: [GameStatus.PREPARING, GameStatus.CANCELLED],
    [GameStatus.PREPARING]: [GameStatus.PLAYING, GameStatus.CANCELLED],
    [GameStatus.PLAYING]: [GameStatus.VOTING, GameStatus.FINISHED],
    [GameStatus.VOTING]: [GameStatus.FINISHED],
    [GameStatus.FINISHED]: [GameStatus.WAITING],
    [GameStatus.CANCELLED]: []
  };

  async transitionState(
    gameId: string,
    targetState: GameStatus
  ): Promise<Game> {
    return await this.dataSource.transaction(async manager => {
      const game = await manager.findOne(Game, {
        where: { id: gameId },
        lock: { mode: 'optimistic' }
      });

      if (!this.canTransition(game.status, targetState)) {
        throw new InvalidStateTransition(
          `${game.status} -> ${targetState}`
        );
      }

      game.status = targetState;
      game.version += 1;

      const updatedGame = await manager.save(game);

      // 상태 변경 이벤트 발행
      await this.eventEmitter.emit('game.state.changed', {
        gameId,
        from: game.status,
        to: targetState,
        version: game.version
      });

      return updatedGame;
    });
  }

  private canTransition(from: GameStatus, to: GameStatus): boolean {
    return this.stateTransitions[from]?.includes(to) ?? false;
  }
}
```

### 3.4 캐싱 전략

#### 3.4.1 Multi-level 캐싱
```typescript
@Injectable()
export class GameCacheService {
  constructor(
    @Inject('REDIS') private redis: Redis,
    @Inject('REDIS_LOCAL') private localCache: NodeCache
  ) {}

  // L1: 로컬 캐시 (1초)
  // L2: Redis 캐시 (5분)
  async getGame(gameId: string): Promise<Game | null> {
    // L1 캐시 확인
    let game = this.localCache.get<Game>(`game:${gameId}`);
    if (game) return game;

    // L2 캐시 확인
    const cached = await this.redis.get(`game:${gameId}`);
    if (cached) {
      game = JSON.parse(cached);
      this.localCache.set(`game:${gameId}`, game, 1);
      return game;
    }

    // 캐시 미스 - DB 조회
    return null;
  }

  async setGame(game: Game): Promise<void> {
    const serialized = JSON.stringify(game);

    // L2 캐시 저장
    await this.redis.setex(`game:${game.id}`, 300, serialized);

    // L1 캐시 저장
    this.localCache.set(`game:${game.id}`, game, 1);
  }

  async invalidateGame(gameId: string): Promise<void> {
    // 모든 캐시 레벨 무효화
    await this.redis.del(`game:${gameId}`);
    this.localCache.del(`game:${gameId}`);

    // 관련 캐시도 무효화
    const pattern = `game:${gameId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

#### 3.4.2 Cache-Aside 패턴 구현
```typescript
@Injectable()
export class GameRepository {
  constructor(
    @InjectRepository(Game)
    private repository: Repository<Game>,
    private cacheService: GameCacheService
  ) {}

  async findById(gameId: string): Promise<Game | null> {
    // 1. 캐시에서 조회
    let game = await this.cacheService.getGame(gameId);
    if (game) return game;

    // 2. DB에서 조회
    game = await this.repository.findOne({
      where: { id: gameId },
      relations: ['players', 'players.user']
    });

    // 3. 캐시에 저장
    if (game) {
      await this.cacheService.setGame(game);
    }

    return game;
  }

  async save(game: Game): Promise<Game> {
    const savedGame = await this.repository.save(game);

    // 저장 후 캐시 업데이트
    await this.cacheService.setGame(savedGame);

    return savedGame;
  }
}
```

### 3.5 동시성 제어

#### 3.5.1 Optimistic Locking
```typescript
@Injectable()
export class ConcurrentUpdateService {
  async updateGameState(
    gameId: string,
    updateData: Partial<Game>,
    expectedVersion: number
  ): Promise<Game> {
    return await this.gameRepository.manager.transaction(
      async manager => {
        const game = await manager.findOne(Game, {
          where: { id: gameId, version: expectedVersion }
        });

        if (!game) {
          throw new OptimisticLockError(
            'Game has been modified by another transaction'
          );
        }

        Object.assign(game, updateData);
        game.version += 1;

        return await manager.save(game);
      }
    );
  }

  // 재시도 로직 포함
  async updateWithRetry<T>(
    updateFn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await updateFn();
      } catch (error) {
        if (error instanceof OptimisticLockError && i < maxRetries - 1) {
          // 지수 백오프
          await this.delay(Math.pow(2, i) * 100);
          continue;
        }
        throw error;
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 3.6 데이터베이스 최적화

#### 3.6.1 인덱스 전략
```sql
-- 기본 PK/ FK 인덱스
CREATE INDEX CONCURRENTLY idx_game_players_game_id
ON game_players(game_id);

CREATE INDEX CONCURRENTLY idx_game_players_user_id
ON game_players(user_id);

-- 상태 기반 조회 최적화
CREATE INDEX CONCURRENTLY idx_games_status_phase
ON games(status, phase)
WHERE status != 'FINISHED';

-- 시간 범위 조회 최적화
CREATE INDEX CONCURRENTLY idx_games_created_at
ON games(created_at DESC);

-- 복합 인덱스
CREATE INDEX CONCURRENTLY idx_game_players_game_alive
ON game_players(game_id, is_alive)
WHERE is_alive = true;

-- 부분 인덱스 (조건부 인덱스)
CREATE INDEX CONCURRENTLY idx_active_games
ON games(id, room_id)
WHERE status IN ('WAITING', 'PLAYING');
```

#### 3.6.2 파티셔닝 전략 (향후 확장)
```sql
-- 게임 액션 테이블 시간별 파티셔닝
CREATE TABLE game_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL,
  player_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- 월별 파티션 생성
CREATE TABLE game_actions_2025_01 PARTITION OF game_actions
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE game_actions_2025_02 PARTITION OF game_actions
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

## 4. 데이터 마이그레이션 계획

### 4.1 Zero-downtime 마이그레이션 단계
1. **Phase 1**: 새 컬럼/테이블 추가 (NULL 허용)
2. **Phase 2**: 데이터 이전 (배치 처리)
3. **Phase 3**: 애플리케이션 코드 배포 (이중 쓰기)
4. **Phase 4**: 데이터 검증
5. **Phase 5**: 구현 전환
6. **Phase 6**: 구현 제거

### 4.2 마이그레이션 스크립트 예시
```typescript
export class AddVersioningToGames implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add version column
    await queryRunner.query(`
      ALTER TABLE games
      ADD COLUMN version INTEGER DEFAULT 1,
      ADD COLUMN optimistic_lock_version INTEGER DEFAULT 1
    `);

    // Step 2: Add index for version
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY idx_games_version
      ON games(version, id)
    `);

    // Step 3: Create trigger for automatic version increment
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_game_version()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.optimistic_lock_version = OLD.optimistic_lock_version + 1;
        NEW.version = OLD.version + 1;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER game_version_trigger
      BEFORE UPDATE ON games
      FOR EACH ROW
      EXECUTE FUNCTION update_game_version()
    `);
  }
}
```

## 5. 모니터링 및 성능

### 5.1 핵심 메트릭
- **캐시 적중률**: 90% 이상 목표
- **DB 쿼리 응답시간**: P95 < 100ms
- **트랜잭션 성공률**: 99.9% 이상
- **동시 업데이트 충돌률**: 1% 미만

### 5.2 모니터링 구현
```typescript
@Injectable()
export class DataMetricsCollector {
  @InjectMetric('cache_hit_rate')
  private cacheHitRate: Histogram;

  @InjectMetric('db_query_duration')
  private dbQueryDuration: Histogram;

  @InjectMetric('transaction_conflicts')
  private transactionConflicts: Counter;

  recordCacheHit(hit: boolean): void {
    this.cacheHitRate.observe(hit ? 1 : 0);
  }

  recordDbQuery(duration: number): void {
    this.dbQueryDuration.observe(duration);
  }

  recordTransactionConflict(): void {
    this.transactionConflicts.inc();
  }
}
```

## 6. 리스크 관리

### 6.1 기술적 리스크
- **데이터 불일치**: 캐시 무효화 전략, 정기 검증
- **성능 저하**: 인덱스 최적화, 쿼리 튜닝
- **확장성 한계**: 파티셔닝, 샤딩 준비

### 6.2 운영적 리스크
- **마이그레이션 실패**: 롤백 계획, 데이터 백업
- **잠금 경합**: 재시도 로직, 비관적 잠금 옵션
- **캐시 장애**: 그레이스풀 디그레이션

## 7. 테스트 전략

### 7.1 단위 테스트
- 각 엔티티의 관계 무결성 검증
- 상태 전이 규칙 테스트
- 캐시 동작 테스트

### 7.2 통합 테스트
- 트랜잭션 경계 테스트
- 동시 업데이트 시나리오
- 캐시와 DB 동기화 테스트

### 7.3 부하 테스트
- 1000 TPS 동시 트랜잭션 테스트
- 10000 동시 캐시 요청 테스트
- 장시간 안정성 테스트 (24시간)

## 8. 성공 기준
- 모든 데이터 모델이 3NF를 만족
- 캐시 적중률 90% 이상 달성
- P95 쿼리 응답시간 100ms 미만
- 데이터 불일치 0% 유지
- Zero-downtime 마이그레이션 성공