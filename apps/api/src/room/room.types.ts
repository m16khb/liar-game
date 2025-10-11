// @CODE:ROOM-001:DATA | SPEC: .moai/specs/SPEC-ROOM-001/spec.md | TEST: test/room/room.service.test.ts
// @CODE:ROOM-001:DATA: 방 데이터 타입 정의

export interface RoomSettings {
  maxPlayers: number; // 최대 인원 (4-10)
  discussionTime: number; // 토론 시간(초, 기본 180)
  isPublic: boolean; // 공개 여부
  password?: string; // 비밀번호 (선택)
}

export interface Player {
  id: string; // User ID
  username: string; // 닉네임
  isReady: boolean; // 준비 상태
  isHost: boolean; // 방장 여부
}

export interface Room {
  code: string; // UUID v4 (550e8400-e29b-41d4-a716-446655440000)
  hostId: string; // 방장 User ID
  players: Player[]; // 플레이어 목록
  settings: RoomSettings; // 방 설정
  status: 'waiting' | 'playing' | 'finished';
  createdAt: string; // ISO 8601
  expiresAt: string; // 24시간 후 자동 만료
}

export interface CreateRoomResponse {
  code: string;
  url: string;
  qrUrl: string;
}

export interface JoinRoomInput {
  id: string;
  username: string;
  password?: string;
}
