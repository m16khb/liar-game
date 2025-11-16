---
id: SPEC-DATA-001
version: 1.0.0
status: draft
title: 데이터 모델 일관성 및 게임 상태 관리
author: @user
created: 2025-11-16
updated: 2025-11-16
tags: [data, database, consistency, state]
dependencies: []
related: [SPEC-GAME-001, SPEC-SEC-001]
---

# HISTORY
- 2025-11-16: 초기 SPEC 작성 (v1.0.0)

# 데이터 모델 일관성 및 게임 상태 관리

## 1. Environment (환경)

### 1.1 시스템 환경
- **데이터베이스**: PostgreSQL 15+ (Supabase 호스팅)
- **ORM**: TypeORM 0.3.x
- **캐시**: Redis 7.x 클러스터
- **아키텍처**: 분산 환경 다중 인스턴스

### 1.2 데이터 환경 규칙
- ACID 트랜잭션 보장
- 최종 일관성 모델 (통계 데이터)
- 강력한 일관성 모델 (게임 상태)
- 데이터 복제 및 샤딩 준비

## 2. Assumptions (가정)

### 2.1 기술적 가정
- TypeORM 기본 설정 완료
- PostgreSQL 기본 테이블 구현됨
- Redis 기본 연결 설정됨
- 마이그레이션 환경 구축됨

### 2.2 운영 가정
- 24/7 서비스 운영
- 다중 리전 배포 계획
- 데이터 볼륨 증가 예상
- 실시간 동기화 요구

## 3. Requirements (요구사항)

### 3.1 보편적 요구사항 (Ubiquitous)
- 시스템은 모든 데이터 변경을 트랜잭션 내에서 처리해야 한다
- 시스템은 참조 무결성을 항상 보장해야 한다
- 시스템은 데이터 타입 일관성을 유지해야 한다
- 시스템은 모든 상태 변경 이력을 추적할 수 있어야 한다

### 3.2 이벤트 기반 요구사항 (Event-Driven)
- **WHEN** 게임 상태가 변경되면 **→** 트랜잭션 내에서 원자적으로 업데이트하고 캐시를 무효화해야 한다
- **WHEN** 플레이어가 방에 참여/퇴장하면 **→** 관련된 모든 테이블을 일관성 있게 업데이트해야 한다
- **WHEN** 동시 업데이트가 발생하면 **→** 낙관적 잠금을 통해 충돌을 감지하고 처리해야 한다
- **WHEN** 캐시 미스가 발생하면 **→** 데이터베이스에서 조회 후 캐시에 저장해야 한다

### 3.3 상태 기반 요구사항 (State-Driven)
- **WHILE** 방이 WAITING 상태인 동안 **→** 플레이어 입장/퇴장 및 설정 변경이 자유로워야 한다
- **WHILE** 게임이 PLAYING 상태인 동안 **→** 플레이어 구성 변경이 금지되고 게임 데이터만 수정 가능해야 한다
- **WHILE** 캐시와 데이터베이스 불일치 상태인 동안 **→** 자동 복구 프로세스가 실행되어야 한다
- **WHILE** 마이그레이션 진행 중인 동안 **→** 서비스 중단 없이 데이터 스키마가 변경되어야 한다

### 3.4 부정적 요구사항 (Unwanted)
- **IF** 데이터 불일치가 감지되면 **→** 즉시 데이터 정비를 수행하고 관리자에게 알림을 보내야 한다
- **IF** 고아 데이터가 발견되면 **→** 정리 프로세스를 실행하고 관련 데이터를 삭제해야 한다
- **IF** 잘못된 상태 전이가 시도되면 **→** 트랜잭션을 롤백하고 에러를 기록해야 한다
- **IF** 캐시 장애가 발생하면 **→** 데이터베이스에서 직접 데이터를 조회해야 한다

### 3.5 선택적 요구사항 (Optional)
- **WHERE** 30일 이상된 게임 데이터가 있으면 **→** 아카이브 테이블로 이동시켜야 한다
- **WHERE** 실시간 통계가 필요하면 **→** 별도의 분석 DB로 데이터를 복제해야 한다
- **WHERE** 데이터베이스 부하가 높으면 **→** 읽기 전용 복제본으로 쿼리를 분산해야 한다

## 4. Specifications (상세 규격)

### 4.1 데이터 모델 설계

#### 4.1.1 핵심 엔티티 관계도
```
Users 1-----N GamePlayers N-----1 Games
  |                     |
  |                     N-----1 Rooms 1-----N GameSettings
  |                                   |
  N-----N UserSessions                N-----1 Keywords
```

#### 4.1.2 정규화된 데이터 모델
```typescript
// User 엔티티
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  nickname: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date;

  @OneToMany(() => GamePlayer, (player) => player.user)
  gamePlayers: GamePlayer[];
}

// Room 엔티티
@Entity()
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  password: string; // 해시된 비밀번호

  @Column({ default: 8 })
  maxPlayers: number;

  @Column({ default: 0 })
  currentPlayers: number;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.WAITING
  })
  status: RoomStatus;

  @Column({ type: 'jsonb', nullable: true })
  settings: RoomSettings;

  @OneToMany(() => Game, (game) => game.room)
  games: Game[];
}

// Game 엔티티
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

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  result: GameResult;

  @OneToMany(() => GamePlayer, (player) => player.game)
  players: GamePlayer[];

  @OneToMany(() => GameAction, (action) => action.game)
  actions: GameAction[];
}

// GamePlayer 엔티티 (연결 테이블)
@Entity()
export class GamePlayer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.gamePlayers)
  user: User;

  @ManyToOne(() => Game, (game) => game.players)
  game: Game;

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

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  joinedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  leftAt: Date;
}

// GameAction 엔티티 (이벤트 로그)
@Entity()
export class GameAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Game, (game) => game.actions)
  game: Game;

  @ManyToOne(() => GamePlayer, (player) => player.id)
  player: GamePlayer;

  @Column({
    type: 'enum',
    enum: ActionType
  })
  type: ActionType;

  @Column({ type: 'jsonb' })
  data: Record<string, any>;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;
}
```

### 4.2 상태 관리 시스템

#### 4.2.1 상태 전이 다이어그램
```typescript
enum RoomStatus {
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
  ARCHIVED = 'ARCHIVED'
}

enum GameStatus {
  WAITING = 'WAITING',
  PREPARING = 'PREPARING',
  PLAYING = 'PLAYING',
  VOTING = 'VOTING',
  FINISHED = 'FINISHED'
}

// 상태 전이 규칙
const stateTransitions = {
  [RoomStatus.WAITING]: [RoomStatus.PLAYING, RoomStatus.ARCHIVED],
  [RoomStatus.PLAYING]: [RoomStatus.FINISHED],
  [RoomStatus.FINISHED]: [RoomStatus.WAITING, RoomStatus.ARCHIVED],
  [RoomStatus.ARCHIVED]: []
};
```

#### 4.2.2 낙관적 잠금 구현
```typescript
@Entity()
export class Game {
  @Column({ type: 'int', default: 1 })
  version: number;

  // 다른 필드들...

  // 낙관적 잠금을 통한 업데이트
  async updateWithLock(updateData: Partial<Game>): Promise<boolean> {
    const result = await this.gameRepository.update(
      {
        id: this.id,
        version: this.version
      },
      {
        ...updateData,
        version: this.version + 1
      }
    );

    return result.affected > 0;
  }
}
```

### 4.3 캐싱 전략

#### 4.3.1 Cache-Aside 패턴
```typescript
@Injectable()
export class GameCacheService {
  constructor(@Inject('REDIS') private redis: Redis) {}

  // 캐시에서 조회
  async getGame(gameId: string): Promise<Game | null> {
    const cached = await this.redis.get(`game:${gameId}`);
    return cached ? JSON.parse(cached) : null;
  }

  // 캐시에 저장
  async setGame(game: Game, ttl: number = 300): Promise<void> {
    await this.redis.setex(
      `game:${game.id}`,
      ttl,
      JSON.stringify(game)
    );
  }

  // 캐시 무효화
  async invalidateGame(gameId: string): Promise<void> {
    await this.redis.del(`game:${gameId}`);
    await this.redis.del(`game:${gameId}:state`);
    await this.redis.del(`game:${gameId}:players`);
  }

  // 캐시 워밍업
  async warmupCache(gameId: string): Promise<void> {
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      relations: ['players', 'players.user']
    });

    if (game) {
      await this.setGame(game);
      await this.redis.setex(
        `game:${gameId}:state`,
        300,
        JSON.stringify(game.status)
      );
    }
  }
}
```

#### 4.3.2 캐시 키 전략
- `game:{id}`: 게임 전체 데이터
- `game:{id}:state`: 게임 상태만
- `game:{id}:players`: 플레이어 목록
- `room:{id}:count`: 방의 현재 인원
- `user:{id}:rooms`: 사용자가 참여한 방 목록

### 4.4 데이터베이스 최적화

#### 4.4.1 인덱스 전략
```sql
-- Primary Keys
ALTER TABLE games ADD CONSTRAINT pk_games PRIMARY KEY (id);
ALTER TABLE game_players ADD CONSTRAINT pk_game_players PRIMARY KEY (id);

-- Foreign Keys
CREATE INDEX idx_game_players_game_id ON game_players(game_id);
CREATE INDEX idx_game_players_user_id ON game_players(user_id);
CREATE INDEX idx_games_room_id ON games(room_id);

-- 상태 조회
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_phase ON games(phase);
CREATE INDEX idx_rooms_status ON rooms(status);

-- 시간 범위 조회
CREATE INDEX idx_games_created_at ON games(created_at);
CREATE INDEX idx_game_actions_created_at ON game_actions(created_at);

-- 복합 인덱스
CREATE INDEX idx_game_players_game_user ON game_players(game_id, user_id);
CREATE INDEX idx_games_room_status ON games(room_id, status);
```

#### 4.4.2 파티셔닝 전략
```sql
-- 게임 액션 테이블 시간별 파티셔닝
CREATE TABLE game_actions_2025_01 PARTITION OF game_actions
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE game_actions_2025_02 PARTITION OF game_actions
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

### 4.5 데이터 일관성 보장

#### 4.5.1 트랜잭션 관리
```typescript
@Injectable()
export class GameStateService {
  @Transactional()
  async updateGameState(
    gameId: string,
    newState: Partial<Game>
  ): Promise<Game> {
    // 1. 게임 상태 업데이트
    const game = await this.gameRepository.findOne({
      where: { id: gameId },
      lock: { mode: 'optimistic', versionColumn: 'version' }
    });

    if (!game) {
      throw new GameNotFoundException();
    }

    // 2. 상태 유효성 검증
    if (!this.isValidTransition(game.status, newState.status)) {
      throw new InvalidStateTransition();
    }

    // 3. 상태 업데이트
    Object.assign(game, newState);
    const updatedGame = await this.gameRepository.save(game);

    // 4. 이벤트 로그 기록
    await this.logGameAction(gameId, 'STATE_CHANGE', newState);

    // 5. 캐시 무효화
    await this.cacheService.invalidateGame(gameId);

    return updatedGame;
  }
}
```

#### 4.5.2 분산 트랜잭션
```typescript
// Saga 패턴을 통한 분산 트랜잭션
@Injectable()
export class GameStartSaga {
  async execute(gameId: string): Promise<void> {
    try {
      // Step 1: 게임 상태 변경
      await this.updateGameState(gameId, {
        status: GameStatus.PREPARING
      });

      // Step 2: 플레이어 역할 할당
      await this.assignRoles(gameId);

      // Step 3: 키워드 선택
      await this.selectKeyword(gameId);

      // Step 4: 게임 시작
      await this.updateGameState(gameId, {
        status: GameStatus.PLAYING,
        startedAt: new Date()
      });

    } catch (error) {
      // Compensation: 롤백
      await this.rollbackGameStart(gameId);
      throw error;
    }
  }
}
```

### 4.6 데이터 마이그레이션

#### 4.6.1 Zero-downtime 마이그레이션
```typescript
// Migration: Add game_version column
export class AddGameVersion1640000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 새 컬럼 추가 (default 값 없이)
    await queryRunner.query(`
      ALTER TABLE games ADD COLUMN version INTEGER;
    `);

    // 2. 기존 데이터 초기화 (batch 처리)
    await queryRunner.query(`
      UPDATE games
      SET version = 1
      WHERE version IS NULL
    `);

    // 3. NOT NULL 제약 추가
    await queryRunner.query(`
      ALTER TABLE games ALTER COLUMN version SET NOT NULL;
    `);

    // 4. default 값 추가
    await queryRunner.query(`
      ALTER TABLE games ALTER COLUMN version SET DEFAULT 1;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE games DROP COLUMN version;
    `);
  }
}
```

### 4.7 데이터 아카이빙

#### 4.7.1 아카이빙 전략
```typescript
@Injectable()
export class DataArchiveService {
  @Cron('0 0 2 * * *') // 매일 새벽 2시 실행
  async archiveOldData(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. 오래된 게임 조회
    const oldGames = await this.gameRepository.find({
      where: {
        createdAt: LessThan(thirtyDaysAgo),
        status: GameStatus.FINISHED
      },
      relations: ['players', 'actions']
    });

    // 2. 아카이브 테이블로 이동
    for (const game of oldGames) {
      await this.archiveGame(game);
    }

    // 3. 원본 테이블에서 삭제
    await this.gameRepository.delete(oldGames.map(g => g.id));
  }

  private async archiveGame(game: Game): Promise<void> {
    // archived_games 테이블에 저장
    await this.archivedGameRepository.save({
      ...game,
      archivedAt: new Date()
    });
  }
}
```

### 4.8 모니터링 및 메트릭

#### 4.8.1 데이터베이스 성능 메트릭
```typescript
@Injectable()
export class DatabaseMetricsService {
  collectMetrics(): DatabaseMetrics {
    return {
      connectionPool: {
        active: this.dataSource.driver.master.pool.totalCount,
        idle: this.dataSource.driver.master.pool.idleCount,
        waiting: this.dataSource.driver.master.pool.waitingCount
      },
      queryStats: {
        slowQueries: this.getSlowQueries(),
        n1Queries: this.getN1Queries(),
        indexUsage: this.getIndexUsageStats()
      },
      cache: {
        hitRate: this.getCacheHitRate(),
        missRate: this.getCacheMissRate(),
        evictionRate: this.getEvictionRate()
      }
    };
  }
}
```

## 5. Traceability (추적성)

### 5.1 태그 매핑
- `DATA-MODEL-001`: 핵심 데이터 모델
- `DATA-STATE-001`: 상태 관리 시스템
- `DATA-CACHE-001`: 캐싱 전략
- `DATA-MIGRATION-001`: 마이그레이션 전략
- `DATA-ARCHIVE-001`: 아카이빙 시스템

### 5.2 의존성 관계
- `SPEC-GAME-001`: 게임 로직에서 사용
- `SPEC-SEC-001`: 보안 정책 준수

### 5.3 데이터 흐름 추적
- 모든 데이터 변경 이력 추적
- 상태 전이 로그 기록
- 성능 저하 원인 분석
- 데이터 불일치 감지