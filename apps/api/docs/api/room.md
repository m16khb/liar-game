# @DOC:ROOM-001: Room Management API

**Last Updated**: 2025-01-12
**SPEC**: `.moai/specs/SPEC-ROOM-001/spec.md`
**Status**: ✅ Completed
**Test Coverage**: 18/18 passed (100%)

---

## 개요

라이어 게임 멀티플레이어 방 생성 및 관리 API입니다. UUID v4 기반 방 코드 생성, Redis 기반 메타데이터 저장, Socket.IO 기반 실시간 동기화를 제공합니다.

### 핵심 기능
- ✅ 방 생성 (UUID v4 코드, QR 코드 URL 제공)
- ✅ 방 조회 및 메타데이터 관리
- ✅ 실시간 방 입장/퇴장 동기화
- ✅ 플레이어 준비 상태 관리
- ✅ 방 설정 수정 (방장 권한)
- ✅ 게임 시작 (최소 4명 인원 체크)

### 기술 스택
- **Backend**: NestJS, TypeScript
- **WebSocket**: Socket.IO
- **Storage**: Redis (24시간 TTL)
- **Testing**: Jest, ioredis-mock

---

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

---

## REST API

### POST /room/create

방을 생성하고 UUID v4 코드, URL, QR 코드 URL을 반환합니다.

#### Request

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

**Parameters**:
- `maxPlayers` (number, required): 최대 인원 (4-10)
- `discussionTime` (number, required): 토론 시간 (초)
- `isPublic` (boolean, required): 공개 여부
- `password` (string, optional): 비밀번호

#### Response

```json
{
  "code": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://liar-game.com/room/550e8400-e29b-41d4-a716-446655440000",
  "qrUrl": "https://api.qrserver.com/v1/create-qr-code/?data=https%3A%2F%2Fliar-game.com%2Froom%2F550e8400-e29b-41d4-a716-446655440000"
}
```

**Status Codes**:
- `201 Created`: 방 생성 성공
- `400 Bad Request`: 잘못된 요청 (유효성 검증 실패)
- `401 Unauthorized`: 인증 실패

#### Implementation

- **Service**: `RoomService.createRoom()`
- **Storage**: Redis (key: `room:{code}`, TTL: 86400초)
- **Public Room**: `room:lobby:public` 리스트에 추가
- **UUID**: UUID v4 형식 (8-4-4-4-12)

---

### GET /room/:code

방 정보를 조회합니다.

#### Parameters

- `code` (string, required): 방 코드 (UUID v4)

#### Response

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

**Status Codes**:
- `200 OK`: 조회 성공
- `404 Not Found`: 방이 존재하지 않음

#### Implementation

- **Service**: `RoomService.getRoom()`
- **Storage**: Redis (key: `room:{code}`)

---

## Socket.IO Events

### Client → Server

#### room:join

방에 입장합니다.

**Payload**:
```typescript
{
  roomCode: string;
  username: string;
  password?: string;
}
```

**Server Response**:
- `room:joined`: 입장 성공 (방 전체 정보)
- `room:error`: 입장 실패 (에러 메시지)

**Broadcast** (to room):
- `room:player-joined`: 새 플레이어 정보

**Business Logic**:
1. 방 존재 여부 확인
2. 최대 인원 체크 (`maxPlayers`)
3. 중복 입장 체크 (`playerId`)
4. 비밀번호 검증 (선택)
5. Redis에 플레이어 추가
6. Socket.IO 방에 join
7. 브로드캐스트

**Error Cases**:
- `존재하지 않는 방입니다` (400)
- `방 인원이 가득 찼습니다` (400)
- `이미 방에 참여 중입니다` (400)
- `비밀번호가 일치하지 않습니다` (400)

---

#### room:leave

방에서 퇴장합니다.

**Payload**:
```typescript
{
  roomCode: string;
}
```

**Server Response**:
- `room:left`: 퇴장 성공
- `room:error`: 퇴장 실패

**Broadcast** (to room):
- `room:player-left`: 퇴장한 플레이어 ID

**Business Logic**:
1. Redis에서 플레이어 제거
2. 마지막 플레이어면 방 삭제 (+ 공개 방 목록에서 제거)
3. Socket.IO 방에서 leave
4. 브로드캐스트

**Error Cases**:
- `존재하지 않는 방입니다` (400)

---

#### room:ready

플레이어 준비 상태를 변경합니다.

**Payload**:
```typescript
{
  roomCode: string;
  isReady: boolean;
}
```

**Server Response**:
- `room:error`: 상태 변경 실패

**Broadcast** (to room):
- `room:player-ready`: 플레이어 준비 상태

**Business Logic**:
1. 방 정보 조회
2. 플레이어 찾기
3. 준비 상태 업데이트
4. 브로드캐스트

**Error Cases**:
- `존재하지 않는 방입니다` (400)
- `방에 참여하지 않은 사용자입니다` (400)

---

#### room:update-settings

방 설정을 수정합니다 (방장만 가능).

**Payload**:
```typescript
{
  roomCode: string;
  settings: RoomSettings;
}
```

**Server Response**:
- `room:error`: 설정 변경 실패

**Broadcast** (to room):
- `room:settings-updated`: 새로운 방 설정

**Business Logic**:
1. 방 정보 조회
2. 방장 권한 확인 (`hostId === userId`)
3. 방 설정 업데이트
4. 브로드캐스트

**Error Cases**:
- `존재하지 않는 방입니다` (400)
- `방장만 설정을 변경할 수 있습니다` (403)

---

#### game:start

게임을 시작합니다 (방장만 가능).

**Payload**:
```typescript
{
  roomCode: string;
}
```

**Server Response**:
- `room:error`: 게임 시작 실패

**Broadcast** (to room):
- `game:started`: 게임 시작 알림 (플레이어 목록 포함)

**Business Logic**:
1. 방 정보 조회
2. 방장 권한 확인 (`hostId === userId`)
3. 최소 인원 확인 (`players.length >= 4`)
4. 방 상태 변경 (`status: 'playing'`)
5. 브로드캐스트

**Error Cases**:
- `존재하지 않는 방입니다` (400)
- `방장만 게임을 시작할 수 있습니다` (403)
- `최소 4명 이상의 플레이어가 필요합니다` (400)

---

### Server → Client

#### room:joined

방 입장이 완료되었습니다.

**Payload**:
```typescript
{
  code: string;
  hostId: string;
  players: Player[];
  settings: RoomSettings;
  status: string;
  createdAt: string;
  expiresAt: string;
}
```

---

#### room:player-joined

새 플레이어가 방에 입장했습니다 (브로드캐스트).

**Payload**:
```typescript
{
  id: string;
  username: string;
  isReady: boolean;
  isHost: boolean;
}
```

---

#### room:player-left

플레이어가 방에서 퇴장했습니다 (브로드캐스트).

**Payload**:
```typescript
{
  userId: string;
}
```

---

#### room:left

방 퇴장이 완료되었습니다.

**Payload**:
```typescript
{
  success: true;
}
```

---

#### room:player-ready

플레이어 준비 상태가 변경되었습니다 (브로드캐스트).

**Payload**:
```typescript
{
  userId: string;
  isReady: boolean;
}
```

---

#### room:settings-updated

방 설정이 변경되었습니다 (브로드캐스트).

**Payload**:
```typescript
{
  settings: RoomSettings;
}
```

---

#### game:started

게임이 시작되었습니다 (브로드캐스트).

**Payload**:
```typescript
{
  roomCode: string;
  players: Player[];
}
```

---

#### room:error

에러가 발생했습니다.

**Payload**:
```typescript
{
  message: string;
}
```

---

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

---

## 사용 예시

### 방 생성 및 입장 플로우

```typescript
// 1. 방 생성 (REST API)
const response = await fetch('https://api.liar-game.com/room/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    settings: {
      maxPlayers: 8,
      discussionTime: 180,
      isPublic: true,
    },
  }),
});

const { code, url, qrUrl } = await response.json();

// 2. Socket.IO 연결
import { io } from 'socket.io-client';

const socket = io('wss://api.liar-game.com', {
  auth: { token: 'JWT_TOKEN' },
});

// 3. 방 입장
socket.emit('room:join', {
  roomCode: code,
  username: '플레이어1',
});

// 4. 입장 완료 이벤트 수신
socket.on('room:joined', (room) => {
  console.log('방 입장 완료:', room);
});

// 5. 새 플레이어 입장 알림 수신
socket.on('room:player-joined', (player) => {
  console.log('새 플레이어 입장:', player);
});

// 6. 준비 상태 변경
socket.emit('room:ready', {
  roomCode: code,
  isReady: true,
});

// 7. 게임 시작 (방장만)
socket.emit('game:start', {
  roomCode: code,
});

// 8. 게임 시작 알림 수신
socket.on('game:started', (data) => {
  console.log('게임 시작!', data);
});
```

---

## 테스트 결과

### RoomService (8/8 passed)

- ✅ UUID v4 형식의 방 코드 생성
- ✅ 24시간 TTL 적용
- ✅ 방 메타데이터 정확히 저장
- ✅ 존재하는 방 조회
- ✅ 존재하지 않는 방 조회 시 null 반환
- ✅ 플레이어 입장
- ✅ 최대 인원 초과 시 입장 차단
- ✅ 중복 입장 차단
- ✅ 플레이어 퇴장
- ✅ 마지막 플레이어 퇴장 시 방 삭제

### RoomGateway (10/10 passed)

- ✅ Socket.IO 방에 join 및 브로드캐스트
- ✅ 존재하지 않는 방 입장 시 에러 emit
- ✅ 플레이어 퇴장 브로드캐스트
- ✅ 준비 상태 변경 브로드캐스트
- ✅ 방장의 방 설정 수정 브로드캐스트
- ✅ 방장이 아닌 사용자의 설정 수정 차단
- ✅ 방장의 게임 시작 브로드캐스트
- ✅ 최소 인원 미달 시 게임 시작 차단

**Total**: 18/18 passed (100%)

---

## 구현 파일

| 파일                           | TAG                     | 역할                          |
| ------------------------------ | ----------------------- | ----------------------------- |
| `src/room/room.service.ts`     | @CODE:ROOM-001:DOMAIN   | 방 생성, 조회, 입장, 퇴장 로직 |
| `src/room/room.gateway.ts`     | @CODE:ROOM-001:API      | Socket.IO 실시간 동기화       |
| `src/room/room.types.ts`       | @CODE:ROOM-001:DATA     | 데이터 타입 정의              |
| `src/room/room-code.generator.ts` | @CODE:ROOM-001:DOMAIN | UUID v4 방 코드 생성          |
| `test/room/room.service.test.ts` | @TEST:ROOM-001        | RoomService 테스트 (8개)      |
| `test/room/room.gateway.test.ts` | @TEST:ROOM-001        | RoomGateway 테스트 (10개)     |

---

## TAG 추적성

```
@SPEC:ROOM-001 (.moai/specs/SPEC-ROOM-001/spec.md)
  ├─ @TEST:ROOM-001 (test/room/*.test.ts)
  ├─ @CODE:ROOM-001 (src/room/*.ts)
  └─ @DOC:ROOM-001 (docs/api/room.md) ← 현재 문서
```

---

## 다음 단계

1. **프론트엔드 연동**
   - React/Vue 클라이언트 구현
   - Socket.IO 클라이언트 상태 관리

2. **추가 기능**
   - 공개 방 로비 목록 조회 API
   - 방장 위임 기능
   - 강퇴 기능

3. **게임 진행**
   - SPEC-GAME-001: 게임 라운드 관리
   - SPEC-GAME-002: 투표 및 결과 처리

---

**참고 문서**:
- [SPEC-ROOM-001](../../.moai/specs/SPEC-ROOM-001/spec.md)
- [RoomService 구현](../../src/room/room.service.ts)
- [RoomGateway 구현](../../src/room/room.gateway.ts)
- [테스트 코드](../../test/room/)
