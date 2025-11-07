# Data Model: 프로젝트 기초 생성

**Date**: 2025-11-07
**ORM**: TypeORM (MySQL v8 LTS)
**Pattern**: Repository Pattern with SOLID Principles

## Core Entities

### User (사용자)
```typescript
// Supabase Auth와 연동되는 사용자 정보
interface User {
  id: number;           // Auto Increment Unsigned Integer
  supabaseId: string;  // Supabase UUID (고유 식별자)
  email: string;        // 이메일 (Supabase에서 관리)
  nickname: string;     // 게임 내 닉네임
  avatarUrl?: string;   // 프로필 이미지 URL (선택)
  createdAt: Date;      // 생성일시 (UTC)
  updatedAt: Date;      // 수정일시 (UTC)
}
```

### GameRoom (게임 방)
```typescript
// 실시간 게임 방 관리
interface GameRoom {
  id: number;           // Auto Increment Unsigned Integer
  roomCode: string;     // 고유 방 코드 (6자리)
  hostId: number;       // 방장 ID (User FK)
  name: string;         // 방 이름
  maxPlayers: number;   // 최대 플레이어 수 (기본 6)
  currentPlayers: number; // 현재 플레이어 수
  status: RoomStatus;    // 방 상태 (WAITING, PLAYING, FINISHED)
  createdAt: Date;      // 생성일시 (UTC)
  updatedAt: Date;      // 수정일시 (UTC)
}

enum RoomStatus {
  WAITING = 'waiting',   // 대기 중
  PLAYING = 'playing',   // 게임 중
  FINISHED = 'finished'  // 종료됨
}
```

### RoomPlayer (방 참여자)
```typescript
// 게임 방에 참여한 플레이어 정보
interface RoomPlayer {
  id: number;           // Auto Increment Unsigned Integer
  roomId: number;       // 방 ID (GameRoom FK)
  userId: number;       // 사용자 ID (User FK)
  isHost: boolean;      // 방장 여부
  joinedAt: Date;       // 입장 시각 (UTC)
  isActive: boolean;    // 활성 상태
}
```

## Entity Relationships

```
User (1) ←→ (N) RoomPlayer (N) ←→ (1) GameRoom
```

- **User**: 여러 게임 방에 참여 가능
- **GameRoom**: 여러 플레이어 수용 가능
- **RoomPlayer**: User와 GameRoom의 중간 테이블

## Validation Rules

### User
- `nickname`: 2-20자, 특수문자 제한
- `email`: Supabase에서 유효성 검증
- `avatarUrl`: 유효한 URL 형식

### GameRoom
- `id`: 6자리 영문자+숫자 조합, 중복 불가
- `name`: 1-50자
- `maxPlayers`: 2-10 사이 값
- `currentPlayers`: maxPlayers를 초과할 수 없음

### RoomPlayer
- `isActive`: true/false 값만 허용
- `joinedAt`: 현재 시각 이전만 가능

## State Transitions

### GameRoom Lifecycle
```
CREATED → WAITING → PLAYING → FINISHED
    ↓         ↓         ↓         ↓
  생성     대기 중    게임 중    종료됨
```

### RoomPlayer Status
```
JOINED → ACTIVE → INACTIVE → LEFT
   ↓        ↓         ↓        ↓
 입장    활성 상태  비활성    퇴장
```

## Data Access Patterns

### Repository Pattern Implementation
```typescript
// SOLID 원칙을 준수하는 Repository 인터페이스
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(userData: Partial<User>): Promise<User>;
  update(id: string, userData: Partial<User>): Promise<User>;
}

interface IGameRoomRepository {
  findById(id: string): Promise<GameRoom | null>;
  findByCode(code: string): Promise<GameRoom | null>;
  create(roomData: Partial<GameRoom>): Promise<GameRoom>;
  update(id: string, roomData: Partial<GameRoom>): Promise<GameRoom>;
  findAvailableRooms(): Promise<GameRoom[]>;
}
```

## Performance Considerations

### Indexing Strategy
- `User.email`: 고유 인덱스 (Supabase에서 관리)
- `GameRoom.id`: 고유 인덱스
- `GameRoom.status`: 일반 인덱스 (방 목록 조회 최적화)
- `RoomPlayer.roomId`: 일반 인덱스
- `RoomPlayer.userId`: 일반 인덱스

### Query Optimization
- 방 목록 조회: status='waiting' 조건으로 필터링
- 플레이어 조회: JOIN 최소화, 필요한 컬럼만 선택
- 실시간 데이터: Redis에 캐싱하여 데이터베이스 부하 감소

## Security Considerations

### Data Protection
- 사용자 민감 정보: Supabase에서 관리
- 게임 데이터: 암호화되지 않은 정보만 저장
- SQL Injection: TypeORM 파라미터 바인딩으로 방어

### Access Control
- 방장 권한: hostId 기반으로 검증
- 플레이어 제한: maxPlayers로 실시간 검증
- 데이터 접근: 사용자 자신의 데이터만 접근 허용