---
# 필수 필드 (7개)
id: ROOM-001
version: 0.1.0
status: completed
created: 2025-01-12
updated: 2025-01-12
author: MoAI Developer
priority: high

# 선택 필드 - 분류/메타
category: feature
labels:
  - room-management
  - websocket
  - realtime

# 선택 필드 - 범위
scope:
  packages:
    - src/room
  files:
    - room.service.ts
    - room.gateway.ts
    - room.types.ts
    - room-code.generator.ts
---

# @SPEC:ROOM-001: 방 생성 및 관리 시스템

## HISTORY

### v0.1.0 (2025-01-12)
- **COMPLETED**: TDD 구현 완료 (RED-GREEN-REFACTOR)
- **TESTS**: 18개 테스트 통과
  - RoomService: 8개 테스트 (방 생성, 조회, 입장, 퇴장)
  - RoomGateway: 10개 테스트 (Socket.IO 실시간 동기화)
- **IMPLEMENTATION**: RoomService, RoomGateway, DTOs, Entities
- **TAGS**: @TEST:ROOM-001, @CODE:ROOM-001, @DOC:ROOM-001 체인 완성

### v0.0.1 (2025-01-12)
- **INITIAL**: 방 생성/관리 시스템 명세 작성
- **AUTHOR**: MoAI Developer
- **SCOPE**: 방 생성, 조회, 입장, 퇴장, 설정 수정, 게임 시작
- **CONTEXT**: 라이어 게임 멀티플레이어 방 관리 기능

## 개요

라이어 게임을 진행하기 위한 멀티플레이어 방 생성 및 관리 시스템입니다. UUID v4 기반 방 코드 생성, Redis 기반 메타데이터 저장, Socket.IO 기반 실시간 동기화를 제공합니다.

## EARS 요구사항

### Ubiquitous (보편적 기능)

- **REQ-ROOM-001**: 시스템은 UUID v4 형식의 고유한 방 코드를 생성해야 한다
- **REQ-ROOM-002**: 시스템은 방 메타데이터를 Redis에 24시간 TTL로 저장해야 한다
- **REQ-ROOM-003**: 시스템은 방 생성 시 방장을 첫 번째 플레이어로 자동 추가해야 한다
- **REQ-ROOM-004**: 시스템은 공개 방일 경우 로비 목록에 자동 추가해야 한다
- **REQ-ROOM-005**: 시스템은 방 URL과 QR 코드 URL을 제공해야 한다

### Event-driven (이벤트 기반)

- **REQ-ROOM-006**: WHEN 플레이어가 방에 입장하면, 시스템은 Socket.IO 방에 join하고 다른 참여자에게 알림을 브로드캐스트해야 한다
- **REQ-ROOM-007**: WHEN 플레이어가 방을 퇴장하면, 시스템은 Redis에서 플레이어를 제거하고 다른 참여자에게 알림을 브로드캐스트해야 한다
- **REQ-ROOM-008**: WHEN 마지막 플레이어가 퇴장하면, 시스템은 방을 자동 삭제해야 한다
- **REQ-ROOM-009**: WHEN 플레이어가 준비 상태를 변경하면, 시스템은 모든 참여자에게 브로드캐스트해야 한다
- **REQ-ROOM-010**: WHEN 방장이 게임을 시작하면, 시스템은 모든 참여자에게 게임 시작 알림을 보내야 한다

### State-driven (상태 기반)

- **REQ-ROOM-011**: WHILE 방 인원이 최대치에 도달한 상태일 때, 시스템은 추가 입장을 차단해야 한다
- **REQ-ROOM-012**: WHILE 플레이어가 최소 4명 미만일 때, 시스템은 게임 시작을 차단해야 한다
- **REQ-ROOM-013**: WHILE 방에 비밀번호가 설정된 상태일 때, 시스템은 입장 시 비밀번호를 검증해야 한다

### Optional (선택적 기능)

- **REQ-ROOM-014**: WHERE 방이 공개 방이면, 시스템은 로비 목록에 표시할 수 있다
- **REQ-ROOM-015**: WHERE 방장이 아닌 사용자가 설정을 변경하려 하면, 시스템은 권한 오류를 반환할 수 있다

### Constraints (제약 사항)

- **REQ-ROOM-016**: IF 방 코드가 중복되면, 시스템은 재생성해야 한다 (UUID v4 충돌 시)
- **REQ-ROOM-017**: IF 방이 24시간 동안 활동이 없으면, 시스템은 자동으로 만료시켜야 한다
- **REQ-ROOM-018**: IF 플레이어가 이미 방에 참여 중이면, 시스템은 중복 입장을 차단해야 한다

## 데이터 모델

### Room
```typescript
interface Room {
  code: string;               // UUID v4 (550e8400-e29b-41d4-a716-446655440000)
  hostId: string;             // 방장 User ID
  players: Player[];          // 플레이어 목록
  settings: RoomSettings;     // 방 설정
  status: 'waiting' | 'playing' | 'finished';
  createdAt: string;          // ISO 8601
  expiresAt: string;          // 24시간 후 자동 만료
}
```

### RoomSettings
```typescript
interface RoomSettings {
  maxPlayers: number;         // 최대 인원 (4-10)
  discussionTime: number;     // 토론 시간(초, 기본 180)
  isPublic: boolean;          // 공개 여부
  password?: string;          // 비밀번호 (선택)
}
```

### Player
```typescript
interface Player {
  id: string;                 // User ID
  username: string;           // 닉네임
  isReady: boolean;           // 준비 상태
  isHost: boolean;            // 방장 여부
}
```

## API 명세

### REST API

#### POST /room/create
방 생성 API

**Request**:
```json
{
  "settings": {
    "maxPlayers": 8,
    "discussionTime": 180,
    "isPublic": true,
    "password": "secret123"
  }
}
```

**Response**:
```json
{
  "code": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://liar-game.com/room/550e8400-e29b-41d4-a716-446655440000",
  "qrUrl": "https://api.qrserver.com/v1/create-qr-code/?data=..."
}
```

#### GET /room/:code
방 조회 API

**Response**:
```json
{
  "code": "550e8400-e29b-41d4-a716-446655440000",
  "hostId": "user-123",
  "players": [
    {
      "id": "user-123",
      "username": "방장",
      "isReady": true,
      "isHost": true
    }
  ],
  "settings": {
    "maxPlayers": 8,
    "discussionTime": 180,
    "isPublic": true
  },
  "status": "waiting",
  "createdAt": "2025-01-12T12:00:00.000Z",
  "expiresAt": "2025-01-13T12:00:00.000Z"
}
```

### Socket.IO 이벤트

#### Client → Server

##### room:join
방 입장
```typescript
{
  roomCode: string;
  username: string;
  password?: string;
}
```

##### room:leave
방 퇴장
```typescript
{
  roomCode: string;
}
```

##### room:ready
준비 상태 변경
```typescript
{
  roomCode: string;
  isReady: boolean;
}
```

##### room:update-settings
방 설정 수정 (방장만)
```typescript
{
  roomCode: string;
  settings: RoomSettings;
}
```

##### game:start
게임 시작 (방장만)
```typescript
{
  roomCode: string;
}
```

#### Server → Client

##### room:joined
입장 완료
```typescript
{
  code: string;
  hostId: string;
  players: Player[];
  settings: RoomSettings;
  status: string;
}
```

##### room:player-joined
새 플레이어 입장 알림 (브로드캐스트)
```typescript
{
  id: string;
  username: string;
  isReady: boolean;
  isHost: boolean;
}
```

##### room:player-left
플레이어 퇴장 알림 (브로드캐스트)
```typescript
{
  userId: string;
}
```

##### room:left
퇴장 완료
```typescript
{
  success: true;
}
```

##### room:player-ready
준비 상태 변경 알림 (브로드캐스트)
```typescript
{
  userId: string;
  isReady: boolean;
}
```

##### room:settings-updated
방 설정 변경 알림 (브로드캐스트)
```typescript
{
  settings: RoomSettings;
}
```

##### game:started
게임 시작 알림 (브로드캐스트)
```typescript
{
  roomCode: string;
  players: Player[];
}
```

##### room:error
에러 메시지
```typescript
{
  message: string;
}
```

## 비즈니스 로직

### 방 생성 플로우
1. UUID v4 형식의 고유 방 코드 생성
2. 방장을 첫 번째 플레이어로 추가 (isHost: true, isReady: true)
3. Redis에 방 메타데이터 저장 (24시간 TTL)
4. 공개 방이면 로비 목록에 추가
5. 방 URL 및 QR 코드 URL 생성
6. 응답 반환

### 방 입장 플로우
1. 방 존재 여부 확인
2. 최대 인원 체크
3. 중복 입장 체크
4. 비밀번호 검증 (선택)
5. Redis에 플레이어 추가
6. Socket.IO 방에 join
7. 다른 참여자에게 입장 알림 브로드캐스트

### 방 퇴장 플로우
1. Redis에서 플레이어 제거
2. 마지막 플레이어면 방 삭제 (공개 방 목록에서도 제거)
3. 그렇지 않으면 Redis 업데이트
4. 다른 참여자에게 퇴장 알림 브로드캐스트
5. Socket.IO 방에서 leave

### 게임 시작 플로우
1. 방장 권한 확인
2. 최소 인원 확인 (4명)
3. 방 상태를 'playing'으로 변경
4. 모든 참여자에게 게임 시작 알림 브로드캐스트

## 에러 처리

| 에러 메시지                        | 상황                          | HTTP Status |
| ---------------------------------- | ----------------------------- | ----------- |
| 존재하지 않는 방입니다             | 방 조회 실패                  | 400         |
| 방 인원이 가득 찼습니다            | 최대 인원 초과                | 400         |
| 이미 방에 참여 중입니다            | 중복 입장 시도                | 400         |
| 비밀번호가 일치하지 않습니다       | 잘못된 비밀번호               | 400         |
| 방장만 설정을 변경할 수 있습니다   | 권한 없는 설정 수정 시도      | 403         |
| 방장만 게임을 시작할 수 있습니다   | 권한 없는 게임 시작 시도      | 403         |
| 최소 4명 이상의 플레이어가 필요합니다 | 인원 부족 상태에서 게임 시작 | 400         |

## 테스트 계획

### RoomService 테스트 (8개)

#### 방 생성
- ✅ TEST-ROOM-001-CREATE: UUID v4 형식의 방 코드를 생성해야 한다
- ✅ TEST-ROOM-001-CREATE-TTL: 방은 24시간 TTL을 가져야 한다
- ✅ TEST-ROOM-001-CREATE-METADATA: 방 메타데이터가 정확히 저장되어야 한다

#### 방 조회
- ✅ TEST-ROOM-001-GET: 존재하는 방을 조회할 수 있어야 한다
- ✅ TEST-ROOM-001-GET-NOTFOUND: 존재하지 않는 방 조회 시 null을 반환해야 한다

#### 방 입장
- ✅ TEST-ROOM-001-JOIN: 플레이어가 방에 입장할 수 있어야 한다
- ✅ TEST-ROOM-001-JOIN-MAX: 최대 인원 초과 시 입장을 차단해야 한다
- ✅ TEST-ROOM-001-JOIN-DUPLICATE: 중복 입장 시도 시 차단해야 한다

#### 방 퇴장
- ✅ TEST-ROOM-001-LEAVE: 플레이어가 방을 나갈 수 있어야 한다
- ✅ TEST-ROOM-001-LEAVE-DELETE: 마지막 플레이어가 나가면 방이 삭제되어야 한다

### RoomGateway 테스트 (10개)

#### 방 입장
- ✅ TEST-ROOM-001-WS-JOIN: 플레이어 입장 시 Socket.IO 방에 join하고 브로드캐스트해야 한다
- ✅ TEST-ROOM-001-WS-JOIN-ERROR: 존재하지 않는 방 입장 시 에러를 emit해야 한다

#### 방 퇴장
- ✅ TEST-ROOM-001-WS-LEAVE: 플레이어 퇴장 시 다른 참여자에게 알림을 브로드캐스트해야 한다

#### 준비 상태
- ✅ TEST-ROOM-001-WS-READY: 플레이어 준비 상태 변경 시 브로드캐스트해야 한다

#### 방 설정
- ✅ TEST-ROOM-001-WS-UPDATE: 방장이 방 설정을 수정하면 브로드캐스트해야 한다
- ✅ TEST-ROOM-001-WS-UPDATE-AUTH: 방장이 아닌 사용자의 설정 수정 시도는 차단해야 한다

#### 게임 시작
- ✅ TEST-ROOM-001-WS-START: 방장이 게임을 시작하면 모든 참여자에게 알림을 보내야 한다
- ✅ TEST-ROOM-001-WS-START-MIN: 최소 인원 미달 시 게임 시작을 차단해야 한다

## TAG 추적성

- **@SPEC:ROOM-001**: `.moai/specs/SPEC-ROOM-001/spec.md` (본 문서)
- **@TEST:ROOM-001**:
  - `test/room/room.service.test.ts` (8개 테스트)
  - `test/room/room.gateway.test.ts` (10개 테스트)
- **@CODE:ROOM-001**:
  - `src/room/room.service.ts` (@CODE:ROOM-001:DOMAIN)
  - `src/room/room.gateway.ts` (@CODE:ROOM-001:API)
  - `src/room/room.types.ts` (@CODE:ROOM-001:DATA)
  - `src/room/room-code.generator.ts` (@CODE:ROOM-001:DOMAIN)
- **@DOC:ROOM-001**: `docs/api/room.md` (API 문서)

## 구현 상태

- ✅ SPEC 작성 완료
- ✅ 테스트 작성 완료 (18/18 passed)
- ✅ 구현 완료 (RoomService, RoomGateway)
- ✅ 문서화 완료 (API 문서)

## 다음 단계

1. 프론트엔드 연동
2. 공개 방 로비 목록 조회 API 추가
3. 방장 위임 기능 추가
4. 게임 진행 상태 관리 (SPEC-GAME-001과 연계)
