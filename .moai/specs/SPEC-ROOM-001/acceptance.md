# @SPEC:ROOM-001 인수 기준 (Acceptance Criteria)

## Definition of Done (완료 조건)

### 기능 완료 기준
- [ ] 모든 EARS 요구사항 구현 완료 (Ubiquitous, Event, State, Constraints)
- [ ] Redis 기반 방 생성/조회/삭제 정상 동작
- [ ] Socket.IO 실시간 동기화 정상 동작
- [ ] UUID v4 방 코드 생성 및 형식 검증 (중복 방지 로직 불필요)

### 품질 완료 기준
- [ ] 모든 테스트 통과 (Jest + Vitest)
- [ ] 테스트 커버리지 ≥85%
- [ ] ESLint 경고 0개
- [ ] TypeScript 타입 에러 0개
- [ ] API 문서 자동 생성 (Swagger)

### 성능 완료 기준
- [ ] Redis 조회 레이턴시 <10ms (P99)
- [ ] Socket.IO 메시지 전송 <100ms (P99)
- [ ] 방 생성 API 응답 시간 <200ms (P95)

### 보안 완료 기준
- [ ] JWT 인증 검증 (모든 API 및 WebSocket)
- [ ] Rate Limiting 적용 (방 생성 5회/분)
- [ ] XSS 방어 (사용자 입력 sanitize)

---

## Given-When-Then 시나리오

### 시나리오 1: 방 생성 및 URL 공유

```gherkin
Feature: 게임 방 생성
  As a 로그인한 사용자
  I want to 게임 방을 생성하고
  So that 친구들에게 URL을 공유하여 초대할 수 있다

Scenario: 방 생성 성공
  Given 사용자가 Supabase OAuth로 로그인된 상태이고
  When "방 만들기" 버튼을 클릭하면
  Then 시스템은 UUID v4 고유 코드를 생성하고 (예: 550e8400-e29b-41d4-a716-446655440000)
  And Redis에 방 메타데이터를 저장하고
  And 공유 URL을 반환하고 (예: https://liar-game.com/room/550e8400-e29b-41d4-a716-446655440000)
  And QR 코드 생성 URL을 포함하고
  And 대기실 화면으로 리다이렉트한다

Scenario: 방 설정 저장
  Given 사용자가 방 설정을 커스터마이즈하고
    | maxPlayers | discussionTime | isPublic |
    | 6          | 120            | false    |
  When "방 만들기"를 클릭하면
  Then 시스템은 해당 설정을 Redis에 저장하고
  And 대기실에서 설정 정보를 표시한다
```

**검증 방법**:
```typescript
// E2E 테스트 (Playwright)
test('should create room and redirect to lobby', async ({ page }) => {
  await page.goto('/room-list');
  await page.click('text=방 만들기');
  // UUID v4 형식 대기 (8-4-4-4-12)
  await page.waitForURL(/\/room\/[0-9a-f-]{36}/i);
  const url = page.url();
  expect(url).toMatch(/\/room\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});
```

---

### 시나리오 2: 방 참여 (코드 입력)

```gherkin
Feature: 게임 방 참여
  As a 로그인한 사용자
  I want to URL 링크를 클릭하거나 QR 코드를 스캔하여
  So that 친구의 방에 참여할 수 있다

Scenario: 유효한 URL로 방 입장
  Given 유효한 방 URL이 존재하고 (예: /room/550e8400-e29b-41d4-a716-446655440000)
  And 현재 방 인원이 5명이고
  When 사용자가 URL을 클릭하여 접속하면
  Then 시스템은 해당 방의 대기실로 입장시키고
  And 플레이어 목록에 새 사용자를 추가하고
  And Socket.IO로 기존 플레이어들에게 "player-joined" 이벤트를 브로드캐스트한다

Scenario: 존재하지 않는 방 코드
  Given 존재하지 않는 방 UUID로 접속하면
  Then 시스템은 "존재하지 않는 방입니다" 에러 메시지를 표시하고
  And 방 목록 화면으로 리다이렉트한다

Scenario: 방 인원 초과
  Given 방의 현재 인원이 10명(최대)이고
  When 11번째 사용자가 URL로 참여 시도하면
  Then 시스템은 "방이 가득 찼습니다" 에러 메시지를 표시하고
  And 입장을 거부한다
```

**검증 방법**:
```typescript
// 통합 테스트
describe('POST /api/room/:code/join', () => {
  const roomCode = '550e8400-e29b-41d4-a716-446655440000';
  const fullRoomCode = '550e8400-e29b-41d4-a716-446655440001';

  it('should add player to room', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/room/${roomCode}/join`)
      .set('Authorization', `Bearer ${jwt}`)
      .expect(200);

    const room = await roomService.getRoom(roomCode);
    expect(room.players).toHaveLength(6); // 5 + 1
  });

  it('should reject when room is full', async () => {
    await request(app.getHttpServer())
      .post(`/api/room/${fullRoomCode}/join`)
      .set('Authorization', `Bearer ${jwt}`)
      .expect(403)
      .expect({ message: '방이 가득 찼습니다' });
  });
});
```

---

### 시나리오 3: 대기실 실시간 동기화

```gherkin
Feature: 대기실 실시간 동기화
  As a 대기실에 입장한 사용자
  I want to 다른 플레이어의 입장/퇴장을 실시간으로 확인하고
  So that 현재 방 상태를 정확히 파악할 수 있다

Scenario: 새 플레이어 입장 알림
  Given 방(UUID: 550e8400-e29b-41d4-a716-446655440000)에 3명의 플레이어가 대기 중이고
  When 4번째 플레이어가 입장하면
  Then Socket.IO는 모든 클라이언트에게 "room:player-joined" 이벤트를 브로드캐스트하고
  And 각 클라이언트는 플레이어 목록을 업데이트하여
    | username   | isReady | isHost |
    | 플레이어1  | true    | true   |
    | 플레이어2  | false   | false  |
    | 플레이어3  | true    | false  |
    | 플레이어4  | false   | false  |
  And 화면에 "플레이어4님이 입장했습니다" 토스트를 표시한다

Scenario: 플레이어 퇴장 알림
  Given 방에 4명의 플레이어가 대기 중이고
  When 플레이어2가 방을 나가면
  Then Socket.IO는 모든 클라이언트에게 "room:player-left" 이벤트를 브로드캐스트하고
  And 각 클라이언트는 플레이어 목록에서 플레이어2를 제거하고
  And Redis에서 해당 플레이어 정보를 삭제한다

Scenario: 마지막 플레이어 퇴장 시 방 삭제
  Given 방에 1명의 플레이어만 남아 있고
  When 해당 플레이어가 방을 나가면
  Then 시스템은 Redis에서 해당 방 키를 삭제하고
  And 방 목록에서 해당 방을 제거한다
```

**검증 방법**:
```typescript
// Socket.IO 테스트
describe('RoomGateway', () => {
  it('should broadcast player-joined event', (done) => {
    const roomCode = '550e8400-e29b-41d4-a716-446655440000';
    const socket1 = io('http://localhost:3001');
    const socket2 = io('http://localhost:3001');

    socket1.emit('room:join', { roomCode });
    socket2.on('room:player-joined', (players) => {
      expect(players).toHaveLength(1);
      done();
    });
  });
});
```

---

### 시나리오 4: 게임 시작 조건 검증

```gherkin
Feature: 게임 시작 조건
  As a 방장
  I want to 최소 4명이 준비되었을 때만
  So that 게임을 시작할 수 있다

Scenario: 인원 부족 (4명 미만)
  Given 방에 3명의 플레이어가 대기 중이고
  And 모든 플레이어가 준비 완료 상태이고
  When 방장이 "게임 시작" 버튼을 클릭하면
  Then 버튼이 비활성화 상태이고
  And "최소 4명이 필요합니다" 툴팁이 표시된다

Scenario: 인원 충족 (4명 이상)
  Given 방에 4명의 플레이어가 대기 중이고
  And 모든 플레이어가 준비 완료 상태이고
  When 방장이 "게임 시작" 버튼을 클릭하면
  Then 시스템은 게임을 시작하고
  And 게임 화면으로 전환하고
  And GAME-001 로직을 실행한다

Scenario: 준비되지 않은 플레이어 존재
  Given 방에 5명의 플레이어가 대기 중이고
  And 플레이어3이 준비 완료하지 않은 상태이고
  When 방장이 "게임 시작" 버튼을 클릭하면
  Then 시스템은 "모든 플레이어가 준비해야 합니다" 경고를 표시하고
  And 게임을 시작하지 않는다
```

**검증 방법**:
```typescript
// Frontend 테스트
test('should disable start button when less than 4 players', () => {
  render(<RoomPage room={{ players: [{}, {}, {}] }} />);
  const button = screen.getByText('게임 시작');
  expect(button).toBeDisabled();
});
```

---

### 시나리오 5: 방 만료 처리

```gherkin
Feature: 방 자동 만료
  As a 시스템
  I want to 24시간 후 사용하지 않는 방을
  So that 자동으로 삭제하여 Redis 메모리를 절약한다

Scenario: 24시간 후 자동 만료
  Given 방이 2025-10-12 10:00:00에 생성되었고
  When 2025-10-13 10:00:01 (24시간 + 1초)이 되면
  Then Redis TTL이 만료되어 해당 방 키가 자동 삭제되고
  And 해당 방 URL로 접근 시도하면 "존재하지 않는 방입니다" 에러가 발생한다

Scenario: 만료 전 갱신 (활동 감지)
  Given 방이 23시간 전에 생성되었고
  When 새 플레이어가 입장하면
  Then 시스템은 Redis TTL을 24시간으로 재설정하고
  And 방 만료 시간을 연장한다
```

**검증 방법**:
```typescript
// Redis TTL 테스트
test('should set 24-hour TTL on room creation', async () => {
  const room = await service.createRoom(userId, settings);
  const ttl = await redis.ttl(`room:${room.code}`);
  expect(ttl).toBeGreaterThan(86300); // ~24시간
  expect(ttl).toBeLessThanOrEqual(86400);
});
```

---

## 비기능 요구사항 검증

### 성능 테스트

```gherkin
Scenario: Redis 조회 성능
  Given 100개의 방이 Redis에 저장되어 있고
  When 방 조회 API를 100회 호출하면
  Then P99 레이턴시가 10ms 이하이고
  And 평균 레이턴시가 5ms 이하여야 한다
```

**검증 방법**:
```bash
# 부하 테스트 (k6)
k6 run --vus 50 --duration 30s load-test.js
```

### 보안 테스트

```gherkin
Scenario: JWT 인증 검증
  Given 유효하지 않은 JWT 토큰을 사용하고
  When 방 생성 API를 호출하면
  Then 시스템은 401 Unauthorized를 반환하고
  And 방을 생성하지 않는다

Scenario: Rate Limiting
  Given 사용자가 1분 내에 6번 방 생성을 시도하면
  Then 6번째 요청부터는 429 Too Many Requests를 반환하고
  And "잠시 후 다시 시도하세요" 메시지를 표시한다
```

---

## 회귀 테스트 체크리스트

- [ ] 방 생성 후 24시간 TTL 설정 확인
- [ ] UUID v4 형식 검증 (8-4-4-4-12 패턴)
- [ ] 방 인원 10명 제한 검증
- [ ] 마지막 플레이어 퇴장 시 방 삭제
- [ ] Socket.IO 연결 끊김 시 자동 재연결
- [ ] JWT 인증 실패 시 401 응답
- [ ] Rate Limiting 5회/분 제한
- [ ] URL/QR 공유 기능 정상 동작

---

## 사용자 인수 테스트

### 테스트 환경
- **브라우저**: Chrome 최신, Safari 최신, 모바일 (iOS/Android)
- **네트워크**: WiFi, 4G, 느린 3G (Network Throttling)
- **디바이스**: Desktop, Tablet, Mobile (375px~)

### 테스트 시나리오
1. **Desktop에서 방 생성** → URL 복사 → **Mobile에서 방 입장** → 실시간 동기화 확인
2. **방장이 게임 시작** → 4명 미만 시 경고 → 4명 충족 시 게임 화면 전환
3. **플레이어 중간 퇴장** → 다른 플레이어 화면에서 즉시 제거 확인

---

## Definition of Ready (DoR)

다음 조건이 충족되면 SPEC-ROOM-001은 완료로 간주합니다:

- [x] YAML Front Matter 작성 (spec.md)
- [x] HISTORY 섹션 작성 (v0.0.1 INITIAL)
- [x] EARS 요구사항 작성 (Ubiquitous, Event, State, Constraints)
- [x] Acceptance Criteria 작성 (5개 시나리오)
- [x] plan.md 작성 (RED-GREEN-REFACTOR 계획)
- [ ] TDD 구현 완료 (/alfred:2-build)
- [ ] 테스트 커버리지 ≥85%
- [ ] TAG 체인 검증 (/alfred:3-sync)
- [ ] 사용자 인수 테스트 통과

---

## 다음 단계

1. `/alfred:2-build SPEC-ROOM-001` 실행 → TDD 구현
2. 모든 테스트 통과 확인
3. `/alfred:3-sync` 실행 → Living Document 동기화
4. SPEC-GAME-001 작성 진행
