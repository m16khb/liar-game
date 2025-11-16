---
id: SPEC-GAME-001
version: 1.0.0
status: draft
created: 2025-11-16
updated: 2025-11-16
author: spec-builder
priority: high
tags: [game, logic, state-machine, liar-game]
---

# SPEC-GAME-001: 라이어 게임 핵심 로직 구현

## HISTORY

- 2025-11-16: v1.0.0 초기 작성 (spec-builder)

## Environment

시스템은 다음 환경에서 실행된다:
- Node.js 18+ 환경
- PostgreSQL 데이터베이스
- WebSocket 지원
- Redis 세션 저장소

## Assumptions

다음 가정 하에 시스템이 설계된다:
- 플레이어는 실시간으로 접속 가능하다
- 네트워크 지연은 500ms 이내이다
- 최소 3명, 최대 8명의 플레이어가 참여 가능하다
- 모든 플레이어는 한국어를 이해한다

## Requirements

### Ubiquitous Requirements (항상 적용되는 요구사항)

1. 시스템은 모든 게임 상태 변경을 데이터베이스에 기록해야 한다
2. 시스템은 모든 플레이어 행동을 로그에 남겨야 한다
3. 시스템은 모든 턴 제한 시간을 초당 업데이트해야 한다

### Event-Driven Requirements (이벤트 기반 요구사항)

1. WHEN 방장이 게임을 시작하면 → 게임 상태를 WAITING에서 PLAYING으로 변경하고 역할을 배정해야 한다
2. WHEN 플레이어가 발언을 완료하면 → 다음 플레이어에게 턴을 넘겨야 한다
3. WHEN 모든 플레이어가 투표를 완료하면 → 투표 결과를 집계하고 승리자를 결정해야 한다
4. WHEN 토론 시간이 종료되면 → 자동으로 투표 단계로 전환해야 한다
5. WHEN 플레이어가 방에서 나가면 → AI 플레이어로 교체하거나 게임을 중단해야 한다

### Unwanted Requirements (방지해야 할 상황)

1. IF 게임 상태가 PLAYING이 아니면 → 플레이어는 발언할 수 없다
2. IF 투표 단계가 아니면 → 플레이어는 투표할 수 없다
3. IF 플레이어의 턴이 아니면 → 발언 버튼이 비활성화되어야 한다
4. IF 이미 투표한 플레이어는 → 다시 투표할 수 없다
5. IF 최소 인원 미만이면 → 게임을 시작할 수 없다

### State-Driven Requirements (상태 기반 요구사항)

1. WHILE 게임 상태가 PLAYING이면 → 타이머를 표시하고 남은 시간을 실시간 업데이트해야 한다
2. WHILE 플레이어의 턴이면 → 해당 플레이어만 발언할 수 있어야 한다
3. WHILE 토론 단계이면 → 모든 플레이어가 채팅에 참여할 수 있어야 한다
4. WHILE 투표 단계이면 → 투표 진행률과 남은 시간을 표시해야 한다
5. WHILE 게임이 종료되면 → 결과 화면을 표시하고 재시작 옵션을 제공해야 한다

### Optional Requirements (선택적 요구사항)

1. WHERE 난이도가 '어려움'이면 → 라이어에게 더 복잡한 키워드를 제공해야 한다
2. WHERE AI 플레이어가 참여하면 → 인공지능 발언 패턴을 사용해야 한다
3. WHERE 관전자 모드가 활성화되면 → 게임을 관전할 수 있어야 한다
4. WHERE 친구 목록이 있으면 → 초대 기능을 사용할 수 있어야 한다
5. WHERE 이력 기능이 활성화되면 → 이전 게임 결과를 조회할 수 있어야 한다

## Specifications

### 1. 게임 상태 머신 (Game State Machine)

```typescript
enum GameState {
  WAITING = 'WAITING',      // 대기 중
  PLAYING = 'PLAYING',      // 게임 진행 중
  DISCUSSION = 'DISCUSSION', // 토론 중
  VOTING = 'VOTING',        // 투표 중
  FINISHED = 'FINISHED'     // 게임 종료
}

interface GameStateMachine {
  currentState: GameState;
  transitionTo(state: GameState): void;
  canTransitionTo(state: GameState): boolean;
  getValidTransitions(): GameState[];
}
```

### 2. 역할 배정 시스템 (Role Assignment)

- 참여자 중 1명을 랜덤으로 라이어로 지정
- 나머지 모두는 시민으로 지정
- 역할 정보는 게임 종료까지 비공개
- 라이어는 일반 키워드만 알 수 있음

```typescript
interface Role {
  type: 'LIAR' | 'CIVILIAN';
  hasSecretKeyword?: boolean;
}

interface RoleAssignment {
  assignRoles(players: Player[]): Map<PlayerId, Role>;
  getKeywordForPlayer(playerId: PlayerId): string;
  revealAllRoles(): void;
}
```

### 3. 턴 관리 시스템 (Turn Management)

- 시계 방향으로 턴 순서 결정
- 각 플레이어별 발언 시간: 기본 30초
- 발언 시간 초과 시 자동으로 다음 턴으로 전환

```typescript
interface TurnManager {
  currentTurn: PlayerId;
  turnOrder: PlayerId[];
  timeLimit: number; // 초
  remainingTime: number;
  nextTurn(): void;
  skipTurn(playerId: PlayerId): void;
  isPlayerTurn(playerId: PlayerId): boolean;
}
```

### 4. 키워드 선택 시스템 (Keyword Selection)

난이도별 카테고리:
- 쉬움: 일상적인 단어 (사과, 의자, 학교 등)
- 보통: 특정 주제 관련 단어 (프로그래밍, 스포츠 등)
- 어려움: 추상적이거나 전문적인 단어

```typescript
interface Keyword {
  id: string;
  word: string;
  category: string;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  liarHint: string; // 라이어에게 주어지는 힌트
}

interface KeywordSelector {
  selectKeyword(difficulty: 'EASY' | 'NORMAL' | 'HARD'): Promise<Keyword>;
  validateKeyword(keyword: string): boolean;
}
```

### 5. 발언 시스템 (Speech System)

- 플레이어는 자신의 턴에만 발언 가능
- 발언 내용은 모든 플레이어에게 실시간 전송
- 부적절한 내용 필터링 기능

```typescript
interface Speech {
  id: string;
  playerId: PlayerId;
  content: string;
  timestamp: Date;
  turnNumber: number;
}

interface SpeechSystem {
  submitSpeech(playerId: PlayerId, content: string): Promise<Speech>;
  validateSpeech(content: string): boolean;
  filterInappropriateContent(content: string): string;
}
```

### 6. 익명 투표 시스템 (Anonymous Voting)

- 각 플레이어는 1표만 행사 가능
- 투표 결과는 모든 플레이어에게 공개
- 최다 득표자가 라이어로 지목됨

```typescript
interface Vote {
  voterId: PlayerId;
  targetId: PlayerId;
  timestamp: Date;
}

interface VotingSystem {
  startVoting(): void;
  submitVote(voterId: PlayerId, targetId: PlayerId): Promise<void>;
  calculateResults(): Map<PlayerId, number>;
  getMostVoted(): PlayerId[];
  hasAllVoted(): boolean;
}
```

### 7. 승패 계산 시스템 (Win/Lose Calculation)

- 라이어가 정체를 밝히지 않고 투표에서 살아남으면 라이어 승리
- 시민들이 라이어를 정확히 지목하면 시민 승리

```typescript
interface GameResult {
  winner: 'LIAR' | 'CIVILIAN';
  liarId: PlayerId;
  votes: Map<PlayerId, number>;
  gameDuration: number; // 초
  participants: PlayerId[];
}

interface WinCalculator {
  calculateResult(
    actualLiarId: PlayerId,
    mostVotedPlayerId: PlayerId
  ): GameResult;
}
```

## Traceability

- TAG-GAME-001: 게임 상태 관리
- TAG-GAME-002: 플레이어 역할 배정
- TAG-GAME-003: 턴 기반 진행
- TAG-GAME-004: 키워드 관리
- TAG-GAME-005: 실시간 통신