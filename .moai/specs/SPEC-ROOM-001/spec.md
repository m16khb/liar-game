---
id: ROOM-001
version: 0.0.1
status: draft
created: 2025-10-12
updated: 2025-10-12
author: "@Goos"
priority: high
category: feature
labels:
  - room
  - realtime
  - websocket
  - url-sharing
depends_on:
  - AUTH-002
related_issue: null
scope:
  packages:
    - apps/api/src/room
    - apps/web/src/app/room
  files:
    - room.service.ts
    - room.gateway.ts
    - room-code.generator.ts
    - room-list/page.tsx
    - room/[id]/page.tsx
---

# @SPEC:ROOM-001: 게임 방 생성/관리 및 URL 공유 시스템

## HISTORY

### v0.0.1 (2025-10-12)
- **INITIAL**: 게임 방 생성/관리 SPEC 최초 작성
- **AUTHOR**: @Goos
- **SCOPE**: UUID v4 기반 방 코드 생성, URL/QR 공유 (필수), 대기실 실시간 동기화
- **CONTEXT**: product.md 핵심 가치 - "소셜 로그인으로 간편하게 시작, URL만으로 친구 초대"
- **NOTE**: 방 코드는 UUID v4 전체 사용 (36자), URL/QR 공유 필수 (수동 입력 불가)

## Environment (환경)

### 기술 스택
- **Backend**: NestJS 11 + Fastify 5 + Socket.IO
- **Frontend**: Next.js 15 + React 19
- **Database**: Redis (방 메타데이터, 대기실 상태)
- **실시간 통신**: Socket.IO WebSocket

### 전제 조건
- Supabase OAuth 인증 완료 (AUTH-002)
- Redis 연결 정상 (INFRA-001)
- Socket.IO Gateway 설정 완료

## Assumptions (가정)

1. **방 코드 고유성**: UUID v4는 중복 확률 거의 0 (2^122 조합, 재시도 로직 불필요)
2. **URL/QR 공유 필수**: 36자 UUID는 수동 입력 비현실적 → URL 클릭 또는 QR 스캔 필수
3. **Redis 성능**: 레이턴시 <10ms, 99.9% 가용성 보장
4. **동시 접속**: 초기 목표 100개 방 × 10명 = 1,000명 동시 접속
5. **브라우저 호환성**: Chrome 90+, Safari 14+, 모바일 브라우저 지원

## Requirements (요구사항)

### Ubiquitous Requirements (필수 기능)
- 시스템은 고유한 UUID v4 방 코드를 생성해야 한다 (예: 550e8400-e29b-41d4-a716-446655440000)
- 시스템은 방 생성자에게 공유 가능한 URL을 제공해야 한다 (예: https://liar-game.com/room/550e8400-e29b-41d4-a716-446655440000)
- 시스템은 QR 코드를 생성하여 모바일 스캔을 지원해야 한다 (URL 공유 필수)
- 시스템은 방 설정을 저장하고 조회할 수 있어야 한다 (인원, 제한시간, 공개 여부)
- 시스템은 대기실에서 플레이어 목록을 실시간으로 표시해야 한다

### Event-driven Requirements (이벤트 기반)
- WHEN 사용자가 "방 만들기"를 클릭하면, 시스템은 UUID v4 코드를 생성하고 Redis에 방 메타데이터를 저장해야 한다
- WHEN 사용자가 URL 링크를 클릭하거나 QR 코드를 스캔하면, 시스템은 Redis에서 방 존재 여부를 확인하고 대기실로 입장시켜야 한다
- WHEN 플레이어가 방에 입장하면, 시스템은 Socket.IO로 모든 참여자에게 새 플레이어 정보를 브로드캐스트해야 한다
- WHEN 플레이어가 방을 나가면, 시스템은 참여자 목록을 업데이트하고 브로드캐스트해야 한다
- WHEN 방 코드가 유효하지 않으면, 시스템은 "존재하지 않는 방입니다" 에러 메시지를 표시해야 한다

### State-driven Requirements (상태 기반)
- WHILE 방이 대기 상태일 때, 시스템은 플레이어 입장/퇴장을 실시간 동기화해야 한다
- WHILE 방 인원이 MIN_PLAYERS(4명) 미만일 때, 시스템은 게임 시작 버튼을 비활성화해야 한다
- WHILE 방 인원이 MAX_PLAYERS(10명)에 도달하면, 시스템은 추가 입장을 차단해야 한다
- WHILE 방장이 온라인 상태일 때, 시스템은 방장에게만 방 설정 수정 권한을 부여해야 한다

### Optional Features (선택적 기능)
- WHERE QR 코드 생성 요청이 있으면, 시스템은 QR 이미지를 생성하여 반환할 수 있다
- WHERE 빠른 매칭 요청이 있으면, 시스템은 대기 중인 공개 방에 자동 배정할 수 있다
- WHERE 방 설정에서 비밀번호를 설정하면, 시스템은 입장 시 비밀번호를 검증할 수 있다

### Constraints (제약사항)
- 방 인원은 최소 4명, 최대 10명으로 제한되어야 한다
- 방 코드는 생성 후 24시간이 지나면 자동으로 만료되어야 한다
- Redis 응답 시간은 10ms 이하를 유지해야 한다
- Socket.IO 메시지 전송 레이턴시는 100ms 이하를 유지해야 한다
- 방 코드는 UUID v4 형식(36자)이어야 한다 (예: 550e8400-e29b-41d4-a716-446655440000)
- IF 방 인원이 0명이 되면, 시스템은 해당 방을 Redis에서 자동 삭제해야 한다

## Data Model (데이터 모델)

### Redis 구조
```typescript
// 방 메타데이터
interface Room {
  code: string;              // UUID v4 (550e8400-e29b-41d4-a716-446655440000)
  hostId: string;            // 방장 User ID
  players: Player[];         // 플레이어 목록
  settings: RoomSettings;    // 방 설정
  status: 'waiting' | 'playing' | 'finished';
  createdAt: string;         // ISO 8601
  expiresAt: string;         // 24시간 후 자동 만료
}

interface Player {
  id: string;                // User ID
  username: string;          // 닉네임
  isReady: boolean;          // 준비 상태
  isHost: boolean;           // 방장 여부
}

interface RoomSettings {
  maxPlayers: number;        // 최대 인원 (4-10)
  discussionTime: number;    // 토론 시간(초, 기본 180)
  isPublic: boolean;         // 공개 여부
  password?: string;         // 비밀번호 (선택)
}
```

### Redis Key 패턴
```
room:{code}                // Hash (방 메타데이터)
room:lobby:public          // List (공개 방 코드 목록)
room:expiry:{code}         // String (만료 시간, TTL 24시간)
```

## API Design (API 설계)

### REST API (NestJS)

#### POST /api/room
**설명**: 방 생성
**인증**: Required (JWT)
**요청**:
```json
{
  "settings": {
    "maxPlayers": 8,
    "discussionTime": 180,
    "isPublic": true,
    "password": null
  }
}
```
**응답** (201 Created):
```json
{
  "code": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://liar-game.com/room/550e8400-e29b-41d4-a716-446655440000",
  "qrUrl": "https://api.qrserver.com/v1/create-qr-code/?data=https://liar-game.com/room/550e8400-e29b-41d4-a716-446655440000"
}
```

#### GET /api/room/:code
**설명**: 방 정보 조회
**인증**: Required (JWT)
**응답** (200 OK):
```json
{
  "code": "550e8400-e29b-41d4-a716-446655440000",
  "hostId": "user-123",
  "players": [
    { "id": "user-123", "username": "플레이어1", "isReady": true, "isHost": true }
  ],
  "settings": { "maxPlayers": 8, "discussionTime": 180, "isPublic": true },
  "status": "waiting"
}
```

#### POST /api/room/:code/join
**설명**: 방 입장
**인증**: Required (JWT)
**요청**:
```json
{
  "password": null  // 비밀번호 방인 경우만
}
```
**응답** (200 OK):
```json
{
  "success": true,
  "message": "방에 입장했습니다"
}
```

### WebSocket (Socket.IO)

#### 클라이언트 → 서버
- `room:join` - 방 입장
- `room:leave` - 방 퇴장
- `room:ready` - 준비 완료 토글
- `room:update-settings` - 방 설정 수정 (방장만)
- `game:start` - 게임 시작 (방장만, 4명 이상 준비 시)

#### 서버 → 클라이언트
- `room:player-joined` - 새 플레이어 입장 알림
- `room:player-left` - 플레이어 퇴장 알림
- `room:player-ready` - 플레이어 준비 상태 변경
- `room:settings-updated` - 방 설정 변경 알림
- `room:error` - 에러 메시지

## UI/UX Design (UI/UX 설계)

### 방 목록 화면 (`/room-list`)
- 공개 방 카드 목록 (Grid)
- "방 만들기" 버튼 (Primary)
- 빠른 매칭 버튼 (Secondary)
- **참고**: UUID 36자는 수동 입력 불가능 → URL/QR 공유 필수

### 대기실 화면 (`/room/:code`)
- 방 코드 표시 (복사 버튼, QR 코드 버튼)
- 플레이어 목록 (최대 10명, 그리드 레이아웃)
- 준비 완료 체크박스
- 방장 전용: 방 설정 수정 버튼
- 방장 전용: 게임 시작 버튼 (4명 이상 준비 시 활성화)

## Performance Requirements (성능 요구사항)

- Redis 조회: <10ms (P99)
- Socket.IO 메시지 전송: <100ms (P99)
- 방 생성 API: <200ms (P95)
- 동시 접속: 1,000명 (초기 목표)
- UUID 생성 시간: <1ms (crypto.randomUUID() 성능)

## Security Requirements (보안 요구사항)

- JWT 인증 필수 (모든 API 및 WebSocket 연결)
- 방 코드는 추측 불가능한 UUID v4 (crypto.randomUUID())
- 비밀번호 방: bcrypt 해싱 (cost 10)
- Rate Limiting: 방 생성 5회/분, 입장 시도 20회/분
- XSS 방어: 사용자 입력 sanitize (방 이름, 닉네임)

## Traceability (@TAG)

- **SPEC**: @SPEC:ROOM-001 (.moai/specs/SPEC-ROOM-001/spec.md)
- **TEST**: tests/room/room.service.spec.ts, tests/room/room.gateway.spec.ts
- **CODE**: apps/api/src/room/room.service.ts, apps/api/src/room/room.gateway.ts
- **DOC**: docs/api/room.md (Swagger 자동 생성)

## Dependencies (의존성)

- **Depends on**:
  - SPEC-AUTH-002 (Supabase OAuth, JWT 인증)
  - SPEC-INFRA-001 (Redis 설정)
- **Blocks**:
  - SPEC-GAME-001 (게임 로직은 방 생성 후 가능)
  - SPEC-CHAT-001 (채팅은 방 내부에서 동작)
- **Related**:
  - SPEC-UI-001 (로그인 플로우)

## Testing Strategy (테스트 전략)

### 단위 테스트 (Jest)
- room.service.spec.ts: 방 생성, 조회, 삭제, UUID 생성
- room-code.generator.spec.ts: UUID v4 형식 검증 (중복 검증 불필요)
- room.gateway.spec.ts: Socket.IO 이벤트 핸들러

### 통합 테스트
- Redis 연동 테스트 (Test Container)
- Socket.IO 연결 및 메시지 브로드캐스트

### E2E 테스트 (예정 - SPEC-TEST-E2E-001)
- 방 생성 → URL 공유 → 다른 브라우저에서 입장 → 대기실 동기화

## Implementation Notes (구현 참고사항)

### 방 코드 생성 알고리즘
```typescript
// apps/api/src/room/room-code.generator.ts
import { randomUUID } from 'crypto';

export function generateRoomCode(): string {
  // UUID v4 생성 (36자, 중복 확률 거의 0)
  return randomUUID();
  // 예: "550e8400-e29b-41d4-a716-446655440000"
}
```

**장점**:
- 중복 확률 거의 0 (2^122 조합)
- 재시도 로직 불필요
- Node.js 내장 함수 (추가 의존성 없음)

**단점**:
- 36자로 수동 입력 불가능 → URL/QR 공유 필수

### Redis TTL 설정
```typescript
// 방 생성 시 24시간 TTL
await redis.setex(`room:${code}`, 86400, JSON.stringify(room));
```

### Socket.IO 방 관리
```typescript
// NestJS Gateway
socket.join(roomCode);  // 방 입장
socket.to(roomCode).emit('room:player-joined', player);  // 브로드캐스트
```

## Risks and Mitigations (위험 요소 및 대응)

### 위험 1: 사용자가 URL/QR 공유 없이 방 참여 불가
- **영향**: 수동 코드 입력 불가능 (36자 UUID)
- **대응**: UI에서 URL 복사 버튼 + QR 코드 생성 버튼 강조 표시
- **완화**: 빠른 매칭 기능 제공 (공개 방 자동 배정)

### 위험 2: Redis 장애 시 모든 방 손실
- **영향**: 게임 중단, 사용자 이탈
- **대응**: Redis Sentinel (HA), 5분마다 PostgreSQL 백업

### 위험 3: Socket.IO 연결 끊김
- **영향**: 대기실 상태 동기화 실패
- **대응**: 자동 재연결 (Socket.IO 기본 기능), 재연결 시 방 상태 재조회

### 위험 4: 긴 URL로 인한 QR 코드 복잡도 증가
- **영향**: QR 코드 스캔 정확도 하락
- **대응**: URL 단축 서비스 통합 (선택적, bitly 또는 자체 구축)

## Future Enhancements (향후 개선)

- [ ] QR 코드 생성 (qrcode 라이브러리)
- [ ] 빠른 매칭 (공개 방 자동 배정)
- [ ] 방 비밀번호 (선택적 입장 제한)
- [ ] 방 히스토리 (PostgreSQL 영구 저장)
- [ ] 방 즐겨찾기 (사용자별)
