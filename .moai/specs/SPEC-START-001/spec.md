---
id: SPEC-START-001
version: 1.1.0
status: draft
created: 2025-11-27
updated: 2025-11-28
author: spec-builder
priority: high
tags: [game, start, gameplay, real-time, websocket, score]
---

# SPEC-START-001: 게임 시작 및 실시간 진행 구현

## HISTORY

- 2025-11-28: v1.1.0 점수 시스템 추가 (누적 점수, 승리 조건별 점수 부여, 라이어 키워드 추측)
- 2025-11-27: v1.0.0 초기 작성 (spec-builder)

## Environment

시스템은 다음 환경에서 실행된다:
- NestJS 11.x 백엔드 (Fastify 5.x)
- Socket.IO 4.8.1 실시간 통신
- MySQL 데이터베이스 + TypeORM 0.3.20
- Redis 7.x 게임 상태 캐싱
- React 19 프론트엔드
- WebSocket 지연시간 P95 < 100ms 목표

## Assumptions

다음 가정 하에 시스템이 설계된다:
- 게임 방은 이미 생성되어 있고 플레이어가 참여한 상태이다 (SPEC-LOBBY-001)
- 방장이 게임 시작 버튼을 클릭하면 게임이 시작된다
- 모든 플레이어는 준비 상태(READY)이며 최소 인원(minPlayers)을 충족한다
- 네트워크 지연은 100ms 이내로 관리된다
- 플레이어는 게임 중 실시간으로 통신 가능하다
- 키워드 데이터는 데이터베이스에 사전 등록되어 있다

## Requirements

### Ubiquitous Requirements (항상 적용되는 요구사항)

1. 시스템은 모든 게임 상태 변경을 실시간으로 모든 플레이어에게 전송해야 한다
2. 시스템은 모든 게임 이벤트를 데이터베이스에 기록해야 한다
3. 시스템은 WebSocket 메시지 지연시간 P95 < 100ms를 유지해야 한다
4. 시스템은 게임 상태를 Redis에 캐싱하여 빠른 조회를 보장해야 한다
5. 시스템은 플레이어 연결 끊김 시 5초 이내 재접속을 허용해야 한다

### Event-Driven Requirements (이벤트 기반 요구사항)

**게임 시작 흐름**:
1. WHEN 방장이 게임 시작 버튼을 클릭하면 → 시스템은 역할을 배정하고 키워드를 선택하여 모든 플레이어에게 전송해야 한다
2. WHEN 역할 배정이 완료되면 → 시스템은 각 플레이어에게 암호화된 역할 정보를 개별 전송해야 한다
3. WHEN 키워드 선택이 완료되면 → 시스템은 시민에게는 실제 키워드를, 라이어에게는 카테고리만 전송해야 한다
4. WHEN 게임이 시작되면 → 시스템은 토론 단계로 전환하고 타이머를 시작해야 한다

**토론 단계 흐름**:
5. WHEN 토론 단계가 시작되면 → 시스템은 턴 순서를 랜덤으로 생성하고 첫 번째 플레이어를 지정해야 한다
6. WHEN 플레이어가 발언을 완료하면 → 시스템은 다음 턴으로 전환하고 다음 플레이어를 지정해야 한다
7. WHEN 토론 시간이 종료되면 → 시스템은 자동으로 투표 단계로 전환해야 한다
8. WHEN 플레이어가 연결이 끊기면 → 시스템은 5초 대기 후 자동으로 턴을 스킵해야 한다

**투표 단계 흐름**:
9. WHEN 투표 단계가 시작되면 → 시스템은 모든 플레이어에게 투표 UI를 표시하고 30초 타이머를 시작해야 한다
10. WHEN 플레이어가 투표를 완료하면 → 시스템은 투표 진행률을 실시간으로 업데이트해야 한다
11. WHEN 모든 플레이어가 투표를 완료하면 → 시스템은 즉시 결과 단계로 전환해야 한다
12. WHEN 투표 시간이 종료되면 → 시스템은 투표하지 않은 플레이어를 무효 처리하고 결과를 집계해야 한다

**결과 단계 흐름**:
13. WHEN 투표가 집계되면 → 시스템은 최다 득표자를 계산하고 라이어와 비교하여 승패를 결정해야 한다
14. WHEN 승패가 결정되면 → 시스템은 모든 역할을 공개하고 결과 화면을 표시해야 한다
15. WHEN 결과 화면이 표시되면 → 시스템은 10초 후 자동으로 방 대기실로 돌아가야 한다

**점수 업데이트 흐름**:
16. WHEN 시민이 라이어를 맞추면 → 시스템은 모든 시민에게 1점씩 추가해야 한다
17. WHEN 라이어가 발견되지 않으면 → 시스템은 라이어에게 1점을 추가해야 한다
18. WHEN 라이어가 키워드를 맞추면 → 시스템은 라이어에게 추가 1점을 부여해야 한다
19. WHEN 점수가 업데이트되면 → 시스템은 데이터베이스에 영구 저장하고 플레이어에게 알려야 한다

### Unwanted Requirements (방지해야 할 상황)

1. IF 게임 상태가 WAITING이 아니면 → 게임 시작 버튼이 비활성화되어야 한다
2. IF 플레이어가 자신의 턴이 아니면 → 발언 버튼이 비활성화되어야 한다
3. IF 이미 투표한 플레이어는 → 투표를 변경할 수 없어야 한다
4. IF 게임이 진행 중이면 → 새로운 플레이어가 참여할 수 없어야 한다
5. IF 라이어가 키워드를 알게 되면 → 게임 무결성이 훼손되므로 암호화 전송이 필수이다

### State-Driven Requirements (상태 기반 요구사항)

1. WHILE 게임 상태가 PLAYING이면 → 타이머를 표시하고 남은 시간을 초당 업데이트해야 한다
2. WHILE 토론 단계이면 → 현재 턴 플레이어를 강조 표시하고 나머지는 대기 상태로 표시해야 한다
3. WHILE 투표 단계이면 → 투표 진행률과 남은 시간을 실시간으로 표시해야 한다
4. WHILE 결과 단계이면 → 모든 역할과 투표 결과를 공개 표시해야 한다
5. WHILE 플레이어가 연결 끊김 상태이면 → "통신 중..." 상태를 다른 플레이어에게 표시해야 한다

### Optional Requirements (선택적 요구사항)

1. WHERE 난이도가 '쉬움'이면 → 일상적인 키워드를 선택해야 한다
2. WHERE 난이도가 '어려움'이면 → 추상적이거나 전문적인 키워드를 선택해야 한다
3. WHERE 방 설정에 시간 제한이 있으면 → 해당 시간 제한을 적용해야 한다
4. WHERE 게임 설정에 라이어 수가 지정되면 → 지정된 수만큼 라이어를 배정해야 한다 (기본값: 1명)
5. WHERE 플레이어가 관전자 모드를 선택하면 → 게임을 관전만 할 수 있어야 한다 (미래 기능)

## Specifications

### 1. 게임 시작 프로세스 (Game Start Process)

#### 1.1 역할 배정 시스템 (Role Assignment)

```typescript
interface RoleAssignment {
  liarCount: number;         // 라이어 수 (기본값: 1)
  roles: Map<number, Role>;  // userId -> Role 매핑
}

interface Role {
  type: 'LIAR' | 'CIVILIAN';
  userId: number;
  encrypted: string;         // 암호화된 역할 정보
}

// WebSocket 이벤트: 게임 시작
interface GameStartedEvent {
  room: Room;
  players: Player[];
  phase: 'DISCUSSION';
  turnOrder: number[];       // userId 배열 (랜덤 순서)
  currentTurn: number;       // 현재 턴 플레이어 userId
  discussionDuration: number; // 토론 시간 (초)
}

// WebSocket 개별 전송: 역할 정보
interface RoleAssignedEvent {
  role: 'LIAR' | 'CIVILIAN';
  keyword?: string;          // 시민: 실제 키워드
  category?: string;         // 라이어: 카테고리만
  encryptedRole: string;     // 검증용 암호화 데이터
}
```

**구현 요구사항**:
- 무작위 역할 배정: `Math.random()`을 사용하여 공정성 보장
- 역할 정보 암호화: 서버 측에서만 복호화 가능한 형태로 전송
- 개별 전송: 각 플레이어에게 자신의 역할만 전송
- 역할 공개 금지: 게임 종료 전까지 역할 노출 방지

#### 1.2 키워드 선택 시스템 (Keyword Selection)

```typescript
interface Keyword {
  id: number;
  word: string;              // 실제 키워드 (예: "사과")
  category: string;          // 카테고리 (예: "과일")
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  createdAt: Date;
}

interface KeywordSelectionService {
  selectRandomKeyword(difficulty: Difficulty): Promise<Keyword>;
  getKeywordsByCategory(category: string): Promise<Keyword[]>;
  validateKeyword(keywordId: number): Promise<boolean>;
}
```

**구현 요구사항**:
- 데이터베이스에서 난이도별 키워드 조회
- 무작위 선택 알고리즘 (최근 사용 키워드 제외)
- 키워드 캐싱 (Redis): 1시간 TTL
- 키워드 변경 방지: 게임 시작 후 변경 불가

### 2. 토론 단계 프로세스 (Discussion Phase)

#### 2.1 턴 관리 시스템 (Turn Management)

```typescript
interface TurnManager {
  roomId: number;
  turnOrder: number[];       // userId 배열
  currentTurnIndex: number;
  turnDuration: number;      // 각 턴당 시간 (초, 기본값: 30초)
  startedAt: Date;

  nextTurn(): void;
  skipTurn(userId: number): void;
  getCurrentPlayer(): Player;
  getRemainingTime(): number;
}

// WebSocket 이벤트: 턴 전환
interface TurnChangedEvent {
  currentTurn: number;       // 현재 턴 플레이어 userId
  nextTurn: number;          // 다음 턴 플레이어 userId
  turnIndex: number;         // 현재 턴 인덱스 (0부터 시작)
  remainingTime: number;     // 남은 시간 (초)
}
```

**구현 요구사항**:
- 턴 순서 랜덤 생성: Fisher-Yates 셔플 알고리즘
- 자동 턴 전환: 30초 경과 시 자동으로 다음 턴
- 연결 끊김 처리: 5초 대기 후 자동 스킵
- 타이머 동기화: 서버 기준 시간으로 클라이언트 동기화

#### 2.2 발언 시스템 (Speech System)

```typescript
interface Speech {
  id: number;
  roomId: number;
  userId: number;
  content: string;
  turnNumber: number;
  timestamp: Date;
}

// WebSocket 이벤트: 발언 전송
interface SpeechSubmittedEvent {
  userId: number;
  nickname: string;
  content: string;
  timestamp: Date;
}
```

**구현 요구사항**:
- 발언 내용 검증: XSS 필터링, 최대 200자
- 실시간 전송: 모든 플레이어에게 즉시 전송
- 발언 기록: 데이터베이스에 저장 (게임 이력용)
- 부적절한 내용 필터링: 욕설/비속어 감지 (선택사항)

### 3. 투표 단계 프로세스 (Voting Phase)

#### 3.1 투표 시스템 (Voting System)

```typescript
interface Vote {
  id: number;
  roomId: number;
  voterId: number;           // 투표한 플레이어
  targetId: number;          // 투표 대상 플레이어
  timestamp: Date;
}

interface VotingProgress {
  totalPlayers: number;
  votedCount: number;
  remainingTime: number;     // 남은 시간 (초)
}

// WebSocket 이벤트: 투표 진행률
interface VotingProgressEvent {
  votedCount: number;
  totalPlayers: number;
  progress: number;          // 0-100 (%)
  remainingTime: number;
}

// WebSocket 이벤트: 투표 완료
interface VoteSubmittedEvent {
  voterId: number;
  hasVoted: boolean;         // 투표 여부만 공개
}
```

**구현 요구사항**:
- 익명 투표: 누가 누구에게 투표했는지 비공개
- 1인 1표: 중복 투표 방지
- 투표 변경 불가: 한 번 투표하면 변경 불가
- 실시간 진행률: 투표할 때마다 진행률 업데이트
- 자동 집계: 모든 플레이어 투표 완료 시 즉시 결과 계산

#### 3.2 결과 집계 시스템 (Result Calculation)

```typescript
interface VoteResult {
  targetId: number;
  nickname: string;
  voteCount: number;
}

interface GameResult {
  winner: 'LIAR' | 'CIVILIAN';
  liarId: number;
  mostVotedPlayerId: number;
  voteResults: VoteResult[];
  roles: Map<number, Role>;  // 모든 역할 공개
  scoreUpdates: ScoreUpdate[]; // 점수 업데이트 내역
  liarKeywordCorrect?: boolean; // 라이어가 키워드를 맞췄는지 여부
}

interface ScoreUpdate {
  userId: number;
  nickname: string;
  previousScore: number;
  scoreChange: number;        // +1, +2 등
  newScore: number;
  reason: 'CIVILIAN_WIN' | 'LIAR_WIN' | 'KEYWORD_CORRECT';
}

// WebSocket 이벤트: 게임 결과
interface GameEndedEvent {
  winner: 'LIAR' | 'CIVILIAN';
  liarId: number;
  liarNickname: string;
  keyword: string;           // 실제 키워드 공개
  mostVotedPlayerId: number;
  voteResults: VoteResult[];
  roles: Array<{ userId: number; nickname: string; role: string }>;
  scoreUpdates: ScoreUpdate[]; // 점수 업데이트 내역
  liarKeywordCorrect?: boolean; // 라이어가 키워드를 맞췄는지
}
```

**구현 요구사항**:
- 최다 득표자 계산: 동점 시 먼저 투표된 플레이어 선택
- 승패 결정 로직:
  - 최다 득표자 === 라이어 → 시민 승리 (시민 전원 +1점)
  - 최다 득표자 !== 라이어 → 라이어 승리 (라이어 +1점)
- 라이어 키워드 추측 기회: 라이어가 발견되지 않았을 경우에만 제공
  - 키워드 정답 시: 라이어 추가 +1점 (총 +2점)
  - 키워드 오답 시: 점수 변동 없음
- 점수 업데이트: 트랜잭션으로 원자성 보장
- 모든 역할 공개: 결과 화면에서 전체 공개
- 투표 결과 공개: 각 플레이어별 득표 수 공개
- 점수 변동 표시: 각 플레이어별 점수 증감 애니메이션

### 4. 실시간 상태 관리 (Real-Time State Management)

#### 4.1 Redis 캐싱 전략

```typescript
interface GameStateCache {
  roomId: number;
  status: RoomStatus;
  phase: GamePhase;
  turnOrder: number[];
  currentTurnIndex: number;
  votes: Map<number, number>; // voterId -> targetId
  keyword: Keyword;
  roles: Map<number, Role>;

  ttl: number; // 1시간
}
```

**구현 요구사항**:
- 게임 상태 캐싱: 모든 게임 상태를 Redis에 저장
- TTL 관리: 게임 종료 시 즉시 삭제, 그 외는 1시간
- 빠른 조회: 데이터베이스 대신 Redis 우선 조회
- 동기화: 상태 변경 시 Redis와 MySQL 동시 업데이트

#### 4.2 WebSocket 메시지 최적화

**구현 요구사항**:
- 메시지 압축: Socket.IO 압축 기능 활성화
- 배칭: 짧은 시간 내 여러 이벤트를 묶어서 전송
- 선택적 전송: 필요한 플레이어에게만 전송 (개별 역할 정보 등)
- 에러 처리: 연결 끊김 시 자동 재연결 및 상태 복원

### 5. 타이머 시스템 (Timer System)

```typescript
interface GameTimer {
  roomId: number;
  phase: GamePhase;
  startedAt: Date;
  duration: number;          // 총 시간 (초)

  start(): void;
  stop(): void;
  getRemainingTime(): number;
  onTimeout(callback: () => void): void;
}

// WebSocket 이벤트: 타이머 업데이트
interface TimerUpdateEvent {
  phase: GamePhase;
  remainingTime: number;     // 남은 시간 (초)
  progress: number;          // 0-100 (%)
}
```

**구현 요구사항**:
- 서버 기준 시간: 클라이언트 시간과 무관하게 서버에서 관리
- 초당 업데이트: 1초마다 모든 플레이어에게 남은 시간 전송
- 자동 단계 전환: 시간 종료 시 자동으로 다음 단계로 전환
- 정확성 보장: `setInterval` 대신 `setTimeout` 재귀 호출로 정확도 향상

### 6. 점수 시스템 (Score System)

#### 6.1 점수 데이터 모델

```typescript
interface User {
  id: number;
  email: string;
  nickname: string;
  score: number;             // 누적 점수 (기본값: 0)
  createdAt: Date;
  updatedAt: Date;
}

interface ScoreUpdate {
  userId: number;
  nickname: string;
  previousScore: number;
  scoreChange: number;        // +1, +2 등
  newScore: number;
  reason: 'CIVILIAN_WIN' | 'LIAR_WIN' | 'KEYWORD_CORRECT';
}

interface ScoreUpdateService {
  updateScore(userId: number, scoreChange: number, reason: string): Promise<User>;
  bulkUpdateScores(updates: ScoreUpdate[]): Promise<User[]>;
  getPlayerScore(userId: number): Promise<number>;
}
```

#### 6.2 점수 계산 로직

**시민 승리 시 (시민이 라이어를 맞춤)**:
```typescript
// 최다 득표자 === 라이어
const civilians = players.filter(p => p.role === 'CIVILIAN');
civilians.forEach(player => {
  player.score += 1; // 각 시민에게 +1점
  scoreUpdates.push({
    userId: player.userId,
    nickname: player.nickname,
    previousScore: player.score - 1,
    scoreChange: 1,
    newScore: player.score,
    reason: 'CIVILIAN_WIN'
  });
});
```

**라이어 승리 시 (라이어가 발견되지 않음)**:
```typescript
// 최다 득표자 !== 라이어
const liar = players.find(p => p.role === 'LIAR');
liar.score += 1; // 라이어에게 +1점

// 라이어에게 키워드 추측 기회 제공
const keywordGuess = await promptLiarForKeyword(liar.userId);

if (keywordGuess === keyword.word) {
  liar.score += 1; // 키워드 정답 시 추가 +1점 (총 +2점)
  scoreUpdates.push({
    userId: liar.userId,
    nickname: liar.nickname,
    previousScore: liar.score - 2,
    scoreChange: 2,
    newScore: liar.score,
    reason: 'KEYWORD_CORRECT'
  });
} else {
  scoreUpdates.push({
    userId: liar.userId,
    nickname: liar.nickname,
    previousScore: liar.score - 1,
    scoreChange: 1,
    newScore: liar.score,
    reason: 'LIAR_WIN'
  });
}
```

#### 6.3 라이어 키워드 추측 시스템

```typescript
// WebSocket 이벤트: 라이어에게 키워드 추측 요청
interface KeywordGuessRequestEvent {
  category: string;          // 힌트로 카테고리 제공
  timeLimit: number;         // 제한 시간 (15초)
}

// WebSocket 이벤트: 라이어가 키워드 제출
interface KeywordGuessSubmitEvent {
  userId: number;
  guessedKeyword: string;
  isCorrect: boolean;
  correctKeyword: string;    // 결과 공개 시 정답 표시
}
```

**구현 요구사항**:
- 라이어 승리 확정 후에만 키워드 추측 기회 제공
- 제한 시간: 15초 (타이머 표시)
- 대소문자 구분 없이 비교 (toLowerCase())
- 공백 제거 후 비교 (trim())
- 키워드 정답 시: 라이어 추가 +1점
- 키워드 오답 또는 시간 초과 시: 점수 변동 없음

#### 6.4 점수 업데이트 트랜잭션

**구현 요구사항**:
- 원자성 보장: 모든 점수 업데이트를 단일 트랜잭션으로 처리
- 롤백 처리: 업데이트 실패 시 모든 변경 사항 롤백
- 동시성 제어: 낙관적 잠금 또는 비관적 잠금으로 동시 수정 방지
- 감사 로깅: 모든 점수 변경 이력을 game_history 테이블에 기록

```typescript
async updateGameScores(roomId: number, scoreUpdates: ScoreUpdate[]): Promise<void> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    for (const update of scoreUpdates) {
      await queryRunner.manager.update(User,
        { id: update.userId },
        { score: update.newScore }
      );
    }

    await queryRunner.manager.insert(GameHistory, {
      roomId,
      scoreUpdates: JSON.stringify(scoreUpdates),
      timestamp: new Date()
    });

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

#### 6.5 점수 표시 UI

**WebSocket 이벤트: 점수 업데이트 알림**:
```typescript
interface ScoreUpdatedEvent {
  scoreUpdates: ScoreUpdate[];
  animations: {
    userId: number;
    scoreChange: number;      // +1, +2 등
    animationType: 'bounce' | 'slide' | 'fade';
  }[];
}
```

**구현 요구사항**:
- 결과 화면에서 점수 증감 애니메이션 표시
- 각 플레이어별 이전 점수 → 새 점수 전환 효과
- 점수 증가 시: 녹색 (+1, +2) 표시
- 점수 변동 없을 시: 회색 (0) 표시
- 전체 플레이어 순위 표시 (점수 높은 순)

## Traceability

- TAG-START-001: 게임 시작 프로세스 (역할 배정, 키워드 선택)
- TAG-START-002: 토론 단계 (턴 관리, 발언 시스템)
- TAG-START-003: 투표 단계 (투표 시스템, 결과 집계)
- TAG-START-004: 실시간 상태 관리 (Redis 캐싱, WebSocket 최적화)
- TAG-START-005: 타이머 시스템
- TAG-START-006: 점수 시스템 (누적 점수, 승리 조건별 점수 부여, 키워드 추측)
- REF-GAME-001: SPEC-GAME-001 (게임 핵심 로직 설계 참조)
- REF-LOBBY-001: SPEC-LOBBY-001 (로비 시스템 완료 후 진행)

## Dependencies

- SPEC-LOBBY-001: 게임 방 생성 및 참가 시스템 (완료 필수)
- Socket.IO 4.8.1: 실시간 양방향 통신
- Redis 7.x: 게임 상태 캐싱
- TypeORM 0.3.20: 데이터베이스 ORM
- MySQL: 게임 이력 영구 저장

## Security Considerations

1. **역할 정보 보호**: 서버에서만 역할 배정, 클라이언트 노출 금지
2. **키워드 암호화**: 라이어에게는 카테고리만 전송
3. **투표 익명성**: 투표 내용은 결과 집계 전까지 비공개
4. **치팅 방지**: 클라이언트 검증은 참고용, 서버 최종 검증 필수
5. **XSS 방지**: 발언 내용 필터링 및 HTML 이스케이핑

## Performance Requirements

- WebSocket 메시지 지연: P95 < 100ms
- 게임 시작 소요 시간: < 3초 (역할 배정 + 키워드 선택)
- 턴 전환 소요 시간: < 500ms
- 투표 집계 소요 시간: < 1초
- Redis 조회 시간: < 10ms

## Testing Requirements

- 단위 테스트: 역할 배정, 키워드 선택, 투표 집계 로직 (커버리지 90% 이상)
- 통합 테스트: WebSocket 이벤트 흐름 전체 (시작 → 토론 → 투표 → 결과)
- 부하 테스트: 동시 100개 게임 방 운영 (각 8명)
- E2E 테스트: 전체 게임 시나리오 (Playwright)
