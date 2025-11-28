# SPEC-START-001 인수 기준 (Acceptance Criteria)

## 개요

게임 시작 및 실시간 진행 구현의 인수 기준을 정의합니다. 모든 기준은 Given-When-Then 형식으로 작성되며, 실제 테스트 시나리오로 활용됩니다.

## 1. 게임 시작 및 역할 배정 (Game Start & Role Assignment)

### AC-1.1: 게임 시작 조건 검증

**Given**: 게임 방에 4명 이상의 플레이어가 참여하고 모두 준비 상태이다
**When**: 방장이 게임 시작 버튼을 클릭한다
**Then**:
- 게임 상태가 WAITING에서 PLAYING으로 변경된다
- 모든 플레이어에게 `game-started` 이벤트가 전송된다
- 페이로드에 `phase: 'DISCUSSION'`, `turnOrder`, `currentTurn`이 포함된다

**Verification**:
```typescript
// 백엔드 테스트
expect(room.status).toBe(RoomStatus.PLAYING);
expect(room.phase).toBe(GamePhase.DISCUSSION);
expect(gameStartedEvent.turnOrder).toHaveLength(4);

// 프론트엔드 테스트
await expect(page.locator('.game-phase-label')).toHaveText('토론 중');
```

### AC-1.2: 역할 무작위 배정

**Given**: 8명의 플레이어가 게임을 시작한다
**When**: 역할 배정이 실행된다
**Then**:
- 정확히 1명이 라이어 역할을 받는다
- 나머지 7명은 시민 역할을 받는다
- 각 플레이어는 자신의 역할만 수신한다 (다른 플레이어 역할은 수신하지 않음)

**Verification**:
```typescript
const roles = await roleAssignmentService.assignRoles(players);
const liarCount = Array.from(roles.values()).filter(r => r.type === 'LIAR').length;
expect(liarCount).toBe(1);

const civilianCount = Array.from(roles.values()).filter(r => r.type === 'CIVILIAN').length;
expect(civilianCount).toBe(7);
```

### AC-1.3: 역할 정보 개별 전송

**Given**: 역할이 배정된 게임이 시작되었다
**When**: 각 플레이어가 `role-assigned` 이벤트를 수신한다
**Then**:
- 라이어는 `{ role: 'LIAR', category: '과일' }`을 수신한다 (키워드 없음)
- 시민은 `{ role: 'CIVILIAN', keyword: '사과', category: '과일' }`을 수신한다

**Verification**:
```typescript
// 라이어 클라이언트
expect(roleEvent.role).toBe('LIAR');
expect(roleEvent.keyword).toBeUndefined();
expect(roleEvent.category).toBeDefined();

// 시민 클라이언트
expect(roleEvent.role).toBe('CIVILIAN');
expect(roleEvent.keyword).toBe('사과');
expect(roleEvent.category).toBe('과일');
```

### AC-1.4: 키워드 난이도별 선택

**Given**: 방 설정에서 난이도가 '쉬움'으로 설정되었다
**When**: 키워드 선택 서비스가 실행된다
**Then**:
- 난이도가 'EASY'인 키워드가 선택된다
- 선택된 키워드가 데이터베이스에 존재한다

**Verification**:
```typescript
const keyword = await keywordSelectionService.selectRandomKeyword('EASY');
expect(keyword.difficulty).toBe('EASY');
expect(keyword.word).toBeDefined();
expect(keyword.category).toBeDefined();

const dbKeyword = await keywordRepository.findOne({ where: { id: keyword.id } });
expect(dbKeyword).toBeDefined();
```

## 2. 토론 단계 (Discussion Phase)

### AC-2.1: 턴 순서 무작위 생성

**Given**: 게임이 시작되고 토론 단계로 진입했다
**When**: 턴 순서가 생성된다
**Then**:
- 모든 플레이어가 turnOrder 배열에 포함된다
- 순서는 무작위로 생성된다 (매번 다른 순서)
- 첫 번째 플레이어가 currentTurn으로 지정된다

**Verification**:
```typescript
const turnOrder = turnManager.generateTurnOrder(players);
expect(turnOrder).toHaveLength(players.length);
expect(new Set(turnOrder).size).toBe(players.length); // 중복 없음

// 여러 번 실행 시 순서가 달라지는지 확인
const turnOrder2 = turnManager.generateTurnOrder(players);
expect(turnOrder).not.toEqual(turnOrder2); // 무작위성 검증
```

### AC-2.2: 자동 턴 전환 (30초 타이머)

**Given**: 현재 턴 플레이어가 발언하지 않고 30초가 경과했다
**When**: 타이머가 종료된다
**Then**:
- 자동으로 다음 턴으로 전환된다
- 모든 플레이어에게 `turn-changed` 이벤트가 전송된다
- `currentTurn`이 다음 플레이어로 업데이트된다

**Verification**:
```typescript
jest.useFakeTimers();
const initialTurn = turnManager.currentTurn;

jest.advanceTimersByTime(30000); // 30초 경과

expect(turnManager.currentTurn).not.toBe(initialTurn);
expect(turnChangedEventEmitted).toBe(true);
```

### AC-2.3: 발언 제출 및 전송

**Given**: 현재 턴 플레이어가 발언을 입력했다
**When**: 발언 버튼을 클릭한다
**Then**:
- 발언 내용이 모든 플레이어에게 실시간으로 전송된다
- `speech-submitted` 이벤트에 `userId`, `content`, `timestamp`가 포함된다
- 발언 내용이 데이터베이스에 저장된다
- 자동으로 다음 턴으로 전환된다

**Verification**:
```typescript
// 백엔드 테스트
await gameGateway.handleSubmitSpeech(socket, { content: '이건 사과 아닌가요?' });

expect(speechSubmittedEventEmitted).toBe(true);
expect(speechSubmittedEvent.content).toBe('이건 사과 아닌가요?');

const speech = await speechRepository.findOne({ where: { userId, roomId } });
expect(speech).toBeDefined();
expect(speech.content).toBe('이건 사과 아닌가요?');
```

### AC-2.4: 발언 내용 XSS 필터링

**Given**: 플레이어가 악의적인 스크립트를 포함한 발언을 입력했다
**When**: 발언을 제출한다
**Then**:
- 스크립트 태그가 제거된다
- 안전한 내용만 전송 및 저장된다

**Verification**:
```typescript
const maliciousContent = '<script>alert("XSS")</script>안녕하세요';
await gameGateway.handleSubmitSpeech(socket, { content: maliciousContent });

expect(speechSubmittedEvent.content).not.toContain('<script>');
expect(speechSubmittedEvent.content).toContain('안녕하세요');
```

### AC-2.5: 연결 끊김 처리 (5초 대기)

**Given**: 현재 턴 플레이어의 연결이 끊어졌다
**When**: 5초가 경과한다
**Then**:
- 자동으로 다음 턴으로 스킵된다
- 다른 플레이어들에게 "플레이어가 연결 끊김"이라는 알림이 표시된다

**Verification**:
```typescript
jest.useFakeTimers();

// 플레이어 연결 끊김 시뮬레이션
await gameGateway.handleDisconnect(socket);

jest.advanceTimersByTime(5000); // 5초 경과

expect(turnSkippedEventEmitted).toBe(true);
expect(playerDisconnectedNotification).toHaveBeenCalled();
```

### AC-2.6: 토론 시간 종료 시 투표 단계 전환

**Given**: 토론 시간이 설정된 3분이 경과했다
**When**: 토론 타이머가 종료된다
**Then**:
- 자동으로 투표 단계로 전환된다
- 모든 플레이어에게 `voting-started` 이벤트가 전송된다
- 게임 상태가 `phase: 'VOTING'`으로 변경된다

**Verification**:
```typescript
jest.useFakeTimers();

jest.advanceTimersByTime(180000); // 3분 경과

expect(room.phase).toBe(GamePhase.VOTING);
expect(votingStartedEventEmitted).toBe(true);
```

## 3. 투표 단계 (Voting Phase)

### AC-3.1: 투표 UI 표시

**Given**: 투표 단계가 시작되었다
**When**: 플레이어가 투표 화면을 본다
**Then**:
- 자신을 제외한 다른 플레이어 목록이 표시된다
- 각 플레이어 옆에 투표 버튼이 표시된다
- 타이머가 30초로 설정된다

**Verification**:
```typescript
// 프론트엔드 테스트
await expect(page.locator('.voting-player-list')).toBeVisible();

const playerCount = await page.locator('.voting-player-item').count();
expect(playerCount).toBe(7); // 자신 제외

await expect(page.locator('.voting-timer')).toHaveText('00:30');
```

### AC-3.2: 투표 제출 및 진행률 업데이트

**Given**: 플레이어가 투표 대상을 선택했다
**When**: 투표 버튼을 클릭한다
**Then**:
- 투표가 데이터베이스에 저장된다
- 모든 플레이어에게 `voting-progress` 이벤트가 전송된다
- 진행률이 실시간으로 업데이트된다 (예: 3/8명 투표 완료)

**Verification**:
```typescript
await gameGateway.handleSubmitVote(socket, { targetUserId: 5 });

const vote = await voteRepository.findOne({ where: { voterId: userId, roomId } });
expect(vote).toBeDefined();
expect(vote.targetId).toBe(5);

expect(votingProgressEventEmitted).toBe(true);
expect(votingProgressEvent.votedCount).toBe(3);
expect(votingProgressEvent.totalPlayers).toBe(8);
expect(votingProgressEvent.progress).toBe(37.5); // 3/8 * 100
```

### AC-3.3: 중복 투표 방지

**Given**: 플레이어가 이미 투표를 완료했다
**When**: 다시 투표를 시도한다
**Then**:
- 투표가 거부된다
- "이미 투표하셨습니다"라는 에러 메시지가 표시된다

**Verification**:
```typescript
await gameGateway.handleSubmitVote(socket, { targetUserId: 5 });

// 중복 투표 시도
await expect(
  gameGateway.handleSubmitVote(socket, { targetUserId: 6 })
).rejects.toThrow('이미 투표하셨습니다');

const voteCount = await voteRepository.count({ where: { voterId: userId, roomId } });
expect(voteCount).toBe(1); // 1표만 기록됨
```

### AC-3.4: 모든 플레이어 투표 완료 시 즉시 결과 전환

**Given**: 7명의 플레이어가 투표를 완료했다
**When**: 마지막 플레이어가 투표를 제출한다
**Then**:
- 타이머가 남아 있어도 즉시 결과 단계로 전환된다
- 모든 플레이어에게 `game-ended` 이벤트가 전송된다

**Verification**:
```typescript
// 7명 투표 완료
for (let i = 0; i < 7; i++) {
  await gameGateway.handleSubmitVote(sockets[i], { targetUserId: 1 });
}

// 마지막 플레이어 투표
await gameGateway.handleSubmitVote(sockets[7], { targetUserId: 1 });

expect(gameEndedEventEmitted).toBe(true);
expect(room.phase).toBe(GamePhase.RESULT);
```

### AC-3.5: 투표 시간 종료 시 자동 집계

**Given**: 투표 시간 30초가 경과했다
**When**: 타이머가 종료된다
**Then**:
- 투표하지 않은 플레이어는 무효 처리된다
- 결과가 집계되어 `game-ended` 이벤트가 전송된다

**Verification**:
```typescript
jest.useFakeTimers();

// 일부 플레이어만 투표 (5/8명)
for (let i = 0; i < 5; i++) {
  await gameGateway.handleSubmitVote(sockets[i], { targetUserId: 1 });
}

jest.advanceTimersByTime(30000); // 30초 경과

expect(gameEndedEventEmitted).toBe(true);
expect(gameEndedEvent.voteResults.length).toBe(8); // 모든 플레이어 포함
```

## 4. 결과 단계 (Result Phase)

### AC-4.1: 승패 결정 로직

**Given**: 투표가 완료되고 최다 득표자가 라이어이다
**When**: 결과가 집계된다
**Then**:
- `winner: 'CIVILIAN'`으로 결정된다
- 시민 승리 메시지가 표시된다

**Verification**:
```typescript
// 라이어가 최다 득표
const result = await resultCalculator.calculateResult(roomId, liarId);
expect(result.winner).toBe('CIVILIAN');
expect(result.mostVotedPlayerId).toBe(liarId);
```

**Given**: 투표가 완료되고 최다 득표자가 라이어가 아니다
**When**: 결과가 집계된다
**Then**:
- `winner: 'LIAR'`로 결정된다
- 라이어 승리 메시지가 표시된다

**Verification**:
```typescript
// 시민이 최다 득표
const result = await resultCalculator.calculateResult(roomId, civilianId);
expect(result.winner).toBe('LIAR');
expect(result.mostVotedPlayerId).not.toBe(liarId);
```

### AC-4.2: 역할 공개

**Given**: 게임이 종료되었다
**When**: 결과 화면이 표시된다
**Then**:
- 모든 플레이어의 역할이 공개된다
- 라이어가 누구인지 강조 표시된다
- 실제 키워드가 공개된다

**Verification**:
```typescript
expect(gameEndedEvent.roles).toHaveLength(8);
expect(gameEndedEvent.liarId).toBe(liarUserId);
expect(gameEndedEvent.keyword).toBe('사과');

// 프론트엔드 테스트
await expect(page.locator('.liar-reveal')).toHaveText('라이어: Player 3');
await expect(page.locator('.keyword-reveal')).toHaveText('키워드: 사과');
```

### AC-4.3: 투표 결과 상세 표시

**Given**: 게임이 종료되었다
**When**: 결과 화면을 본다
**Then**:
- 각 플레이어가 받은 득표 수가 표시된다
- 최다 득표자가 강조 표시된다

**Verification**:
```typescript
expect(gameEndedEvent.voteResults).toEqual([
  { targetId: 1, nickname: 'Player 1', voteCount: 5 },
  { targetId: 2, nickname: 'Player 2', voteCount: 2 },
  { targetId: 3, nickname: 'Player 3', voteCount: 1 },
  // ...
]);

// 프론트엔드 테스트
await expect(page.locator('.vote-result-item').first()).toHaveClass(/most-voted/);
await expect(page.locator('.vote-result-item').first()).toHaveText(/Player 1.*5표/);
```

### AC-4.4: 10초 후 자동 방 대기실 복귀

**Given**: 결과 화면이 표시되었다
**When**: 10초가 경과한다
**Then**:
- 자동으로 방 대기실로 돌아간다
- 게임 상태가 WAITING으로 변경된다
- 모든 플레이어의 준비 상태가 NOT_READY로 초기화된다

**Verification**:
```typescript
jest.useFakeTimers();

jest.advanceTimersByTime(10000); // 10초 경과

expect(room.status).toBe(RoomStatus.WAITING);
expect(room.phase).toBe(GamePhase.LOBBY);

const players = await playerRepository.find({ where: { roomId } });
players.forEach(player => {
  expect(player.status).toBe(PlayerStatus.NOT_READY);
});
```

## 5. 실시간 성능 및 안정성 (Real-Time Performance & Stability)

### AC-5.1: WebSocket 메시지 지연 P95 < 100ms

**Given**: 8명의 플레이어가 게임을 진행 중이다
**When**: 발언 제출 이벤트가 전송된다
**Then**:
- 모든 플레이어가 100ms 이내에 메시지를 수신한다 (95% 이상)

**Verification**:
```typescript
const latencies: number[] = [];

for (let i = 0; i < 100; i++) {
  const startTime = Date.now();
  await gameGateway.handleSubmitSpeech(socket, { content: 'Test' });
  const endTime = Date.now();
  latencies.push(endTime - startTime);
}

latencies.sort((a, b) => a - b);
const p95 = latencies[Math.floor(latencies.length * 0.95)];
expect(p95).toBeLessThan(100); // P95 < 100ms
```

### AC-5.2: 플레이어 재접속 시 상태 복원

**Given**: 게임이 진행 중이고 플레이어의 연결이 끊어졌다
**When**: 5초 이내에 재접속한다
**Then**:
- 현재 게임 상태가 복원된다
- `player-reconnect` 이벤트로 `gameState`를 수신한다
- 게임이 중단 없이 계속 진행된다

**Verification**:
```typescript
// 연결 끊김 시뮬레이션
await gameGateway.handleDisconnect(socket);

// 5초 이내 재접속
jest.advanceTimersByTime(3000); // 3초 경과
await gameGateway.handleConnection(newSocket);

expect(playerReconnectEventEmitted).toBe(true);
expect(playerReconnectEvent.gameState).toBeDefined();
expect(playerReconnectEvent.gameState.phase).toBe('DISCUSSION');
```

### AC-5.3: Redis 캐싱 동작

**Given**: 게임 상태가 변경되었다
**When**: 게임 상태를 조회한다
**Then**:
- Redis에서 캐시된 상태를 먼저 조회한다
- 캐시가 없으면 데이터베이스에서 조회하고 Redis에 저장한다

**Verification**:
```typescript
// 첫 번째 조회 (캐시 없음)
const state1 = await gameCacheService.getGameState(roomId);
expect(redisMock.get).toHaveBeenCalledWith(`game:state:${roomId}`);
expect(dbQueryMock).toHaveBeenCalled();
expect(redisMock.set).toHaveBeenCalledWith(`game:state:${roomId}`, expect.any(String), 'EX', 3600);

// 두 번째 조회 (캐시 있음)
const state2 = await gameCacheService.getGameState(roomId);
expect(redisMock.get).toHaveBeenCalledWith(`game:state:${roomId}`);
expect(dbQueryMock).toHaveBeenCalledTimes(1); // 추가 호출 없음
```

### AC-5.4: 타이머 정확도

**Given**: 토론 시간이 3분으로 설정되었다
**When**: 타이머가 시작된다
**Then**:
- 1초마다 정확하게 `timer-update` 이벤트가 전송된다
- 오차는 ±50ms 이내이다

**Verification**:
```typescript
jest.useFakeTimers();

const timerUpdates: number[] = [];
socket.on('timer-update', (event) => {
  timerUpdates.push(Date.now());
});

gameTimer.start(roomId, 180);

for (let i = 0; i < 180; i++) {
  jest.advanceTimersByTime(1000);
}

// 간격 검증 (1초 ± 50ms)
for (let i = 1; i < timerUpdates.length; i++) {
  const interval = timerUpdates[i] - timerUpdates[i - 1];
  expect(interval).toBeGreaterThanOrEqual(950);
  expect(interval).toBeLessThanOrEqual(1050);
}
```

## 6. 보안 및 무결성 (Security & Integrity)

### AC-6.1: 역할 정보 노출 방지

**Given**: 게임이 시작되었다
**When**: 클라이언트가 다른 플레이어의 역할을 요청한다
**Then**:
- 요청이 거부된다
- 서버는 각 플레이어에게 자신의 역할만 전송한다

**Verification**:
```typescript
// 악의적인 요청 시뮬레이션
await expect(
  gameGateway.handleGetPlayerRole(socket, { targetUserId: 5 })
).rejects.toThrow('권한이 없습니다');
```

### AC-6.2: 투표 익명성 보장

**Given**: 투표가 진행 중이다
**When**: 플레이어가 투표한다
**Then**:
- 투표 대상은 서버에만 저장된다
- 다른 플레이어에게는 "투표 완료 여부"만 전송된다
- 투표 내용은 결과 집계 전까지 비공개이다

**Verification**:
```typescript
await gameGateway.handleSubmitVote(socket, { targetUserId: 5 });

expect(voteSubmittedEventBroadcast).not.toContain('targetUserId');
expect(voteSubmittedEventBroadcast).toEqual({
  voterId: userId,
  hasVoted: true
});
```

### AC-6.3: 서버 측 최종 검증

**Given**: 클라이언트가 조작된 투표 요청을 전송했다
**When**: 서버가 요청을 검증한다
**Then**:
- 유효하지 않은 요청은 거부된다
- 에러 메시지가 클라이언트에 전송된다

**Verification**:
```typescript
// 자기 자신에게 투표 시도 (금지)
await expect(
  gameGateway.handleSubmitVote(socket, { targetUserId: socket.userId })
).rejects.toThrow('자신에게 투표할 수 없습니다');

// 존재하지 않는 플레이어에게 투표 시도
await expect(
  gameGateway.handleSubmitVote(socket, { targetUserId: 9999 })
).rejects.toThrow('존재하지 않는 플레이어입니다');
```

## 7. 점수 시스템 (Score System)

### AC-7.1: 시민 승리 시 점수 부여

**Given**: 게임에서 시민 5명, 라이어 1명이 플레이하고 있다
**When**: 투표 결과 라이어가 최다 득표자로 선정된다
**Then**:
- 모든 시민(5명)의 점수가 각각 1점씩 증가한다
- 라이어의 점수는 변동이 없다
- 점수 업데이트 이벤트가 모든 플레이어에게 전송된다

**Verification**:
```typescript
const civilians = players.filter(p => p.role === 'CIVILIAN');
const initialScores = civilians.map(p => p.score);

await resultCalculator.calculateResult(room);

civilians.forEach((player, index) => {
  expect(player.score).toBe(initialScores[index] + 1);
});

expect(scoreUpdateEvent.scoreUpdates).toHaveLength(5);
expect(scoreUpdateEvent.scoreUpdates.every(u => u.scoreChange === 1)).toBe(true);
```

### AC-7.2: 라이어 승리 시 점수 부여 (키워드 추측 실패)

**Given**: 게임에서 라이어가 발견되지 않았다
**When**: 라이어가 키워드 추측에 실패한다
**Then**:
- 라이어의 점수가 1점 증가한다
- 시민들의 점수는 변동이 없다
- 라이어에게만 점수 업데이트 이벤트가 전송된다

**Verification**:
```typescript
const liar = players.find(p => p.role === 'LIAR');
const initialScore = liar.score;

await resultCalculator.calculateResult(room);
await keywordGuessService.submitGuess(liar.userId, '잘못된답');

expect(liar.score).toBe(initialScore + 1);
expect(scoreUpdateEvent.scoreUpdates).toHaveLength(1);
expect(scoreUpdateEvent.scoreUpdates[0].scoreChange).toBe(1);
expect(scoreUpdateEvent.scoreUpdates[0].reason).toBe('LIAR_WIN');
```

### AC-7.3: 라이어 키워드 정답 시 추가 점수

**Given**: 게임에서 라이어가 발견되지 않았고 키워드는 "사과"이다
**When**: 라이어가 키워드를 "사과"로 정확히 추측한다
**Then**:
- 라이어의 점수가 2점 증가한다 (승리 1점 + 키워드 정답 1점)
- `liarKeywordCorrect`가 `true`로 설정된다
- 점수 변경 이유가 `KEYWORD_CORRECT`로 기록된다

**Verification**:
```typescript
const liar = players.find(p => p.role === 'LIAR');
const initialScore = liar.score;
const keyword = '사과';

await resultCalculator.calculateResult(room);
await keywordGuessService.submitGuess(liar.userId, keyword);

expect(liar.score).toBe(initialScore + 2);
expect(gameResult.liarKeywordCorrect).toBe(true);
expect(scoreUpdateEvent.scoreUpdates[0].scoreChange).toBe(2);
expect(scoreUpdateEvent.scoreUpdates[0].reason).toBe('KEYWORD_CORRECT');
```

### AC-7.4: 라이어 키워드 추측 제한 시간

**Given**: 라이어가 승리하여 키워드 추측 기회가 주어졌다
**When**: 15초 타이머가 만료된다
**Then**:
- 키워드 추측 창이 자동으로 닫힌다
- 라이어는 기본 승리 점수 1점만 받는다 (추가 점수 없음)
- 타임아웃 결과가 결과 화면에 표시된다

**Verification**:
```typescript
const liar = players.find(p => p.role === 'LIAR');
const initialScore = liar.score;

await resultCalculator.calculateResult(room);
await sleep(15000); // 15초 대기

expect(liar.score).toBe(initialScore + 1);
expect(gameResult.liarKeywordCorrect).toBe(false);
```

### AC-7.5: 점수 업데이트 트랜잭션 원자성

**Given**: 게임 결과 집계 후 점수 업데이트가 실행된다
**When**: 점수 업데이트 중 데이터베이스 오류가 발생한다
**Then**:
- 모든 점수 변경이 롤백된다
- 플레이어들의 점수가 이전 값으로 복원된다
- 에러 로그가 기록된다

**Verification**:
```typescript
const initialScores = players.map(p => ({ id: p.userId, score: p.score }));

// 데이터베이스 오류 시뮬레이션
jest.spyOn(userRepository, 'update').mockRejectedValueOnce(new Error('DB Error'));

await expect(scoreUpdateService.bulkUpdateScores(scoreUpdates)).rejects.toThrow();

players.forEach((player, index) => {
  expect(player.score).toBe(initialScores[index].score);
});
```

### AC-7.6: 점수 증감 UI 애니메이션

**Given**: 게임 결과 화면이 표시되고 점수 업데이트 데이터가 수신되었다
**When**: 점수 증감 애니메이션이 재생된다
**Then**:
- 각 플레이어의 이전 점수에서 새 점수로 숫자가 전환된다
- 점수 증가는 녹색으로 표시된다 (+1, +2)
- 점수 변동이 없으면 회색으로 표시된다 (0)
- 전체 순위가 점수 높은 순으로 정렬된다

**Verification**:
```typescript
await page.waitForSelector('.score-animation');

const scoreChanges = await page.locator('.score-change').all();
expect(scoreChanges).toHaveLength(6);

const positiveChanges = await page.locator('.score-change.positive').all();
expect(positiveChanges.length).toBeGreaterThan(0);

const scoreRanking = await page.locator('.player-ranking').allTextContents();
expect(scoreRanking[0]).toContain('1위');
```

### AC-7.7: 키워드 추측 대소문자/공백 처리

**Given**: 정답 키워드가 "사과"이다
**When**: 라이어가 "  사과  " (공백 포함) 또는 "사과" (대소문자 다름)를 입력한다
**Then**:
- 모두 정답으로 인정된다
- 라이어가 추가 1점을 받는다

**Verification**:
```typescript
expect(await keywordGuessService.isCorrect('  사과  ', '사과')).toBe(true);
expect(await keywordGuessService.isCorrect('사과', '사과')).toBe(true);
expect(await keywordGuessService.isCorrect('APPLE', 'apple')).toBe(true);
```

## 품질 게이트 기준 (Quality Gates)

### 필수 조건 (Must Have)
- [ ] 모든 Given-When-Then 시나리오 통과 (100%)
- [ ] 단위 테스트 커버리지 90% 이상
- [ ] 통합 테스트 통과 (모든 WebSocket 이벤트 흐름)
- [ ] E2E 테스트 통과 (전체 게임 시나리오)
- [ ] WebSocket 메시지 지연 P95 < 100ms
- [ ] 보안 테스트 통과 (역할 정보 노출 방지, 투표 익명성)

### 선택 조건 (Should Have)
- [ ] 부하 테스트 통과 (동시 100개 게임 방)
- [ ] 성능 프로파일링 (메모리 누수 없음)
- [ ] 접근성 테스트 통과 (WCAG 2.1 Level AA)
- [ ] 모바일 반응형 테스트 (iOS Safari, Android Chrome)

## 검증 방법 (Verification Methods)

### 자동화 테스트
- Jest 단위 테스트 (백엔드)
- Vitest 컴포넌트 테스트 (프론트엔드)
- Supertest 통합 테스트 (API 및 WebSocket)
- Playwright E2E 테스트 (전체 시나리오)
- K6 부하 테스트 (성능 검증)

### 수동 테스트
- 실제 사용자 시나리오 테스트 (2명 이상)
- 네트워크 지연 시뮬레이션 (Chrome DevTools)
- 연결 끊김 시나리오 (Wi-Fi 끄기)

### 도구
- Prometheus + Grafana: 실시간 메트릭 모니터링
- Redis CLI: 캐싱 동작 확인
- MySQL Workbench: 데이터베이스 상태 확인
- Socket.IO Inspector: WebSocket 메시지 디버깅

## 완료 정의 (Definition of Done)

1. ✅ 모든 인수 기준 (AC-1.1 ~ AC-7.7) 통과
2. ✅ 품질 게이트 필수 조건 충족
3. ✅ 코드 리뷰 완료 (최소 1명)
4. ✅ 문서 업데이트 (API 문서, 아키텍처 다이어그램)
5. ✅ 성능 테스트 통과 (P95 < 100ms)
6. ✅ 보안 테스트 통과 (역할 노출 방지, 투표 익명성)
7. ✅ 점수 시스템 트랜잭션 무결성 확인 (롤백 테스트)
8. ✅ 점수 증감 UI 애니메이션 QA 통과
9. ✅ 프로덕션 배포 준비 완료 (환경 변수, 시크릿 설정)
