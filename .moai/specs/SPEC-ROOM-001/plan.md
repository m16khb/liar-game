# @SPEC:ROOM-001 구현 계획

## 개요

**목표**: Socket.IO 기반 실시간 게임 방 관리 시스템
**TDD 접근법**: RED → GREEN → REFACTOR

---

## Phase 1: RED (테스트 작성)

### 1.1 Backend 테스트 작성 (Jest)

**파일**: `apps/api/src/room/__tests__/room.service.spec.ts`

**테스트 케이스**:
```typescript
// @TEST:ROOM-001 | SPEC: SPEC-ROOM-001.md
describe('RoomService', () => {
  describe('createRoom', () => {
    it('should generate UUID v4 room code', async () => {
      const room = await service.createRoom(userId, settings);
      expect(room.code).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should save room metadata to Redis', async () => {
      const room = await service.createRoom(userId, settings);
      const saved = await redis.get(`room:${room.code}`);
      expect(JSON.parse(saved)).toMatchObject({ code: room.code });
    });

    it('should set 24-hour TTL on room', async () => {
      const room = await service.createRoom(userId, settings);
      const ttl = await redis.ttl(`room:${room.code}`);
      expect(ttl).toBeGreaterThan(86300); // ~24시간
    });
  });

  describe('joinRoom', () => {
    it('should add player to room', async () => {
      await service.joinRoom(roomCode, userId);
      const room = await service.getRoom(roomCode);
      expect(room.players).toHaveLength(1);
      expect(room.players[0].id).toBe(userId);
    });

    it('should reject join when room is full', async () => {
      // 10명 이미 입장
      await expect(service.joinRoom(roomCode, userId)).rejects.toThrow('방이 가득 찼습니다');
    });

    it('should reject join when room does not exist', async () => {
      await expect(service.joinRoom('INVALID', userId)).rejects.toThrow('존재하지 않는 방입니다');
    });
  });

  describe('leaveRoom', () => {
    it('should remove player from room', async () => {
      await service.leaveRoom(roomCode, userId);
      const room = await service.getRoom(roomCode);
      expect(room.players).toHaveLength(0);
    });

    it('should delete room when last player leaves', async () => {
      await service.leaveRoom(roomCode, lastUserId);
      const room = await redis.get(`room:${roomCode}`);
      expect(room).toBeNull();
    });
  });
});
```

**파일**: `apps/api/src/room/__tests__/room-code.generator.spec.ts`

**테스트 케이스**:
```typescript
// @TEST:ROOM-001 | SPEC: SPEC-ROOM-001.md
describe('generateRoomCode', () => {
  it('should generate valid UUID v4', () => {
    const code = generateRoomCode();
    // UUID v4 형식: 8-4-4-4-12 (36자)
    expect(code).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should generate 36-character code', () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(36);
  });

  it('should always have version 4 indicator', () => {
    const code = generateRoomCode();
    expect(code[14]).toBe('4'); // UUID v4 버전 필드
  });
});
```

**참고**: UUID v4는 중복 확률이 거의 0이므로 중복 검증 테스트는 불필요합니다.

**파일**: `apps/api/src/room/__tests__/room.gateway.spec.ts`

**테스트 케이스**:
```typescript
// @TEST:ROOM-001 | SPEC: SPEC-ROOM-001.md
describe('RoomGateway', () => {
  describe('room:join', () => {
    it('should broadcast player-joined event', async () => {
      const spy = jest.spyOn(gateway.server, 'to');
      await gateway.handleJoinRoom(socket, { roomCode });
      expect(spy).toHaveBeenCalledWith(roomCode);
    });

    it('should send player list to new player', async () => {
      const emitSpy = jest.spyOn(socket, 'emit');
      await gateway.handleJoinRoom(socket, { roomCode });
      expect(emitSpy).toHaveBeenCalledWith('room:player-list', expect.any(Array));
    });
  });

  describe('room:ready', () => {
    it('should toggle ready state and broadcast', async () => {
      await gateway.handlePlayerReady(socket, { roomCode });
      expect(mockService.toggleReady).toHaveBeenCalled();
    });
  });
});
```

### 1.2 Frontend 테스트 작성 (Vitest + Testing Library)

**파일**: `apps/web/src/app/room-list/__tests__/page.spec.tsx`

**테스트 케이스**:
```typescript
// @TEST:ROOM-001 | SPEC: SPEC-ROOM-001.md
describe('RoomListPage', () => {
  it('should display public rooms', async () => {
    render(<RoomListPage />);
    expect(await screen.findByText('공개 방 목록')).toBeInTheDocument();
  });

  it('should open create room modal on button click', async () => {
    render(<RoomListPage />);
    fireEvent.click(screen.getByText('방 만들기'));
    expect(screen.getByText('방 설정')).toBeInTheDocument();
  });
});
```

**예상 결과**: 모든 테스트 FAIL (구현 전)

---

## Phase 2: GREEN (최소 구현)

### 2.1 Backend 구현 (NestJS)

**2.1.1 방 코드 생성**

**파일**: `apps/api/src/room/room-code.generator.ts`

```typescript
// @CODE:ROOM-001 | SPEC: SPEC-ROOM-001.md | TEST: room-code.generator.spec.ts
import { randomUUID } from 'crypto';

export function generateRoomCode(): string {
  // UUID v4 생성 (36자, 중복 확률 거의 0)
  return randomUUID();
}
```

**장점**:
- 중복 확률 거의 0 (2^122 조합)
- 재시도 로직 불필요 (코드 간결화)
- Node.js 내장 함수 (추가 의존성 없음)

**2.1.2 RoomService 구현**

**파일**: `apps/api/src/room/room.service.ts`

```typescript
// @CODE:ROOM-001 | SPEC: SPEC-ROOM-001.md | TEST: room.service.spec.ts
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { generateRoomCode } from './room-code.generator';

@Injectable()
export class RoomService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async createRoom(hostId: string, settings: RoomSettings): Promise<Room> {
    // UUID v4는 중복 확률 거의 0 → 재시도 로직 불필요
    const code = generateRoomCode();

    const room: Room = {
      code,
      hostId,
      players: [{ id: hostId, username: 'Host', isReady: false, isHost: true }],
      settings,
      status: 'waiting',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    // Redis 저장 (24시간 TTL)
    await this.redis.setex(`room:${code}`, 86400, JSON.stringify(room));

    return room;
  }

  async getRoom(code: string): Promise<Room | null> {
    const data = await this.redis.get(`room:${code}`);
    return data ? JSON.parse(data) : null;
  }

  async joinRoom(code: string, userId: string): Promise<void> {
    const room = await this.getRoom(code);
    if (!room) throw new Error('존재하지 않는 방입니다');
    if (room.players.length >= room.settings.maxPlayers) {
      throw new Error('방이 가득 찼습니다');
    }

    room.players.push({ id: userId, username: 'Player', isReady: false, isHost: false });
    await this.redis.setex(`room:${code}`, 86400, JSON.stringify(room));
  }

  async leaveRoom(code: string, userId: string): Promise<void> {
    const room = await this.getRoom(code);
    if (!room) return;

    room.players = room.players.filter((p) => p.id !== userId);

    if (room.players.length === 0) {
      await this.redis.del(`room:${code}`); // 빈 방 삭제
    } else {
      await this.redis.setex(`room:${code}`, 86400, JSON.stringify(room));
    }
  }
}
```

**2.1.3 RoomGateway 구현**

**파일**: `apps/api/src/room/room.gateway.ts`

```typescript
// @CODE:ROOM-001 | SPEC: SPEC-ROOM-001.md | TEST: room.gateway.spec.ts
import { WebSocketGateway, SubscribeMessage, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';

@WebSocketGateway({ cors: true })
export class RoomGateway {
  @WebSocketServer() server: Server;

  constructor(private readonly roomService: RoomService) {}

  @SubscribeMessage('room:join')
  async handleJoinRoom(client: Socket, payload: { roomCode: string }) {
    const { roomCode } = payload;
    await client.join(roomCode);

    const room = await this.roomService.getRoom(roomCode);
    this.server.to(roomCode).emit('room:player-joined', room.players);
  }

  @SubscribeMessage('room:leave')
  async handleLeaveRoom(client: Socket, payload: { roomCode: string }) {
    const { roomCode } = payload;
    await client.leave(roomCode);

    const room = await this.roomService.getRoom(roomCode);
    this.server.to(roomCode).emit('room:player-left', room.players);
  }
}
```

### 2.2 Frontend 구현 (Next.js 15)

**2.2.1 방 목록 페이지**

**파일**: `apps/web/src/app/room-list/page.tsx`

```typescript
// @CODE:ROOM-001 | SPEC: SPEC-ROOM-001.md | TEST: room-list/page.spec.tsx
'use client';

import { useState } from 'react';

export default function RoomListPage() {
  const [rooms, setRooms] = useState([]);

  const handleCreateRoom = async () => {
    const res = await fetch('/api/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { maxPlayers: 8, discussionTime: 180, isPublic: true } }),
    });
    const { code } = await res.json();
    window.location.href = `/room/${code}`;
  };

  return (
    <div>
      <h1>공개 방 목록</h1>
      <button onClick={handleCreateRoom}>방 만들기</button>
    </div>
  );
}
```

**2.2.2 대기실 페이지**

**파일**: `apps/web/src/app/room/[id]/page.tsx`

```typescript
// @CODE:ROOM-001 | SPEC: SPEC-ROOM-001.md
'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function RoomPage({ params }: { params: { id: string } }) {
  const [room, setRoom] = useState(null);
  const socket = io('http://localhost:3001');

  useEffect(() => {
    socket.emit('room:join', { roomCode: params.id });
    socket.on('room:player-joined', (players) => {
      setRoom((prev) => ({ ...prev, players }));
    });

    return () => {
      socket.disconnect();
    };
  }, [params.id]);

  return (
    <div>
      <h1>방 코드: {params.id}</h1>
      <h2>플레이어 목록</h2>
      <ul>
        {room?.players?.map((p) => (
          <li key={p.id}>{p.username}</li>
        ))}
      </ul>
    </div>
  );
}
```

**예상 결과**: 모든 테스트 PASS (최소 구현 완료)

---

## Phase 3: REFACTOR (개선)

### 3.1 타입 정의 강화

**파일**: `packages/types/src/room.types.ts`

```typescript
// @CODE:ROOM-001:DATA | SPEC: SPEC-ROOM-001.md
export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  settings: RoomSettings;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: string;
  expiresAt: string;
}

export interface Player {
  id: string;
  username: string;
  isReady: boolean;
  isHost: boolean;
}

export interface RoomSettings {
  maxPlayers: number;       // 4-10
  discussionTime: number;   // 초 (기본 180)
  isPublic: boolean;
  password?: string;
}
```

### 3.2 에러 핸들링 개선

```typescript
// Custom Exception
export class RoomNotFoundException extends HttpException {
  constructor() {
    super('존재하지 않는 방입니다', HttpStatus.NOT_FOUND);
  }
}

export class RoomFullException extends HttpException {
  constructor() {
    super('방이 가득 찼습니다', HttpStatus.FORBIDDEN);
  }
}
```

### 3.3 코드 중복 제거

- Redis 조회 로직을 별도 메서드로 분리
- Socket.IO 브로드캐스트 유틸 함수 작성

### 3.4 성능 최적화

- Redis Pipeline 사용 (다중 키 조회)
- Socket.IO Binary 전송 (JSON 대신)

---

## TDD 이력 주석 규칙

모든 코드에 다음 주석 추가:

```typescript
// TDD History:
// - RED: 테스트 작성 (room.service.spec.ts)
// - GREEN: 최소 구현 완료
// - REFACTOR: 타입 정의 강화, 에러 처리 개선
```

---

## 체크리스트

### Phase 1: RED
- [ ] `room.service.spec.ts` 작성 (7개 테스트, UUID 형식 검증)
- [ ] `room-code.generator.spec.ts` 작성 (3개 테스트, UUID v4 검증)
- [ ] `room.gateway.spec.ts` 작성 (4개 테스트)
- [ ] `room-list/page.spec.tsx` 작성 (2개 테스트)
- [ ] 모든 테스트 실행 → FAIL 확인

### Phase 2: GREEN
- [ ] `room-code.generator.ts` 구현
- [ ] `room.service.ts` 구현
- [ ] `room.gateway.ts` 구현
- [ ] `room-list/page.tsx` 구현
- [ ] `room/[id]/page.tsx` 구현
- [ ] 모든 테스트 실행 → PASS 확인

### Phase 3: REFACTOR
- [ ] `room.types.ts` 타입 정의
- [ ] Custom Exception 작성
- [ ] 코드 중복 제거
- [ ] ESLint 경고 0개
- [ ] 테스트 커버리지 ≥85%

---

## 다음 단계

1. `/alfred:2-build SPEC-ROOM-001` 실행
2. RED → GREEN → REFACTOR 사이클 진행
3. 완료 후 `/alfred:3-sync` 실행 (문서 동기화)
