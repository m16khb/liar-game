// 프론트엔드와 백엔드에서 공유하는 타입 정의
// 실제 데이터베이스 스키마와 API 계약을 기반으로 정의

// ===== 사용자 관련 타입 =====
export interface User {
  id: number                      // Auto Increment Unsigned Integer
  supabaseId: string             // Supabase UUID (고유 식별자)
  email: string                  // 이메일 (Supabase에서 관리)
  nickname: string               // 게임 내 닉네임 (2-20자)
  avatarUrl?: string             // 프로필 이미지 URL (선택)
  createdAt: Date                // 생성일시 (UTC)
  updatedAt: Date                // 수정일시 (UTC)
}

export interface UserProfile {
  id: number
  email: string
  nickname: string
  avatarUrl?: string
  createdAt: string              // ISO 8601 문자열
  updatedAt: string              // ISO 8601 문자열
}

// ===== 게임 방 관련 타입 =====
export enum RoomStatus {
  WAITING = 'waiting',           // 대기 중
  PLAYING = 'playing',           // 게임 중
  FINISHED = 'finished'          // 종료됨
}

export interface GameRoom {
  id: number                     // Auto Increment Unsigned Integer
  roomCode: string               // 고유 방 코드 (6자리)
  hostId: number                 // 방장 ID (User FK)
  name: string                   // 방 이름 (1-50자)
  maxPlayers: number             // 최대 플레이어 수 (2-10)
  currentPlayers: number         // 현재 플레이어 수
  status: RoomStatus             // 방 상태
  createdAt: Date                // 생성일시 (UTC)
  updatedAt: Date                // 수정일시 (UTC)
}

export interface GameRoomResponse {
  id: number
  roomCode: string
  hostId: number
  name: string
  maxPlayers: number
  currentPlayers: number
  status: string
  createdAt: string              // ISO 8601 문자열
  updatedAt: string              // ISO 8601 문자열
  players?: RoomPlayer[]         // 참여자 정보 (可选)
}

// ===== 방 참여자 관련 타입 =====
export interface RoomPlayer {
  id: number                     // Auto Increment Unsigned Integer
  roomId: number                 // 방 ID (GameRoom FK)
  userId: number                 // 사용자 ID (User FK)
  nickname: string               // 사용자 닉네임 (중복 제거를 위해 포함)
  avatarUrl?: string             // 사용자 프로필 이미지
  isHost: boolean                // 방장 여부
  joinedAt: Date                 // 입장 시각 (UTC)
  isActive: boolean              // 활성 상태
}

export interface RoomPlayerResponse {
  id: number
  userId: number
  nickname: string
  avatarUrl?: string
  isHost: boolean
  joinedAt: string               // ISO 8601 문자열
}

// ===== Socket.IO 이벤트 타입 =====
export interface SocketEvents {
  // 클라이언트 → 서버 이벤트
  'join-room': JoinRoomEvent
  'leave-room': LeaveRoomEvent

  // 서버 → 클라이언트 이벤트
  'room-joined': RoomJoinedEvent
  'room-left': RoomLeftEvent
  'player-joined': PlayerJoinedEvent
  'player-left': PlayerLeftEvent
  'room-updated': RoomUpdatedEvent
  'error': SocketErrorEvent
}

export interface JoinRoomEvent {
  roomCode: string
}

export interface LeaveRoomEvent {
  roomId?: number
}

export interface RoomJoinedEvent {
  room: GameRoomResponse
  player: RoomPlayerResponse
}

export interface RoomLeftEvent {
  playerId: number
  roomId: number
}

export interface PlayerJoinedEvent {
  player: RoomPlayerResponse
  room: GameRoomResponse
}

export interface PlayerLeftEvent {
  playerId: number
  roomId: number
}

export interface RoomUpdatedEvent {
  room: GameRoomResponse
}

export interface SocketErrorEvent {
  code: string
  message: string
  details?: any
}

// ===== API 응답 타입 =====
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
}

// ===== 인증 관련 타입 =====
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthUser {
  id: string                     // Supabase UUID
  email: string
  user_metadata?: {
    nickname?: string
    avatar_url?: string
  }
}

export interface AuthSession {
  user: AuthUser
  tokens: AuthTokens
}

// ===== API DTO 타입 =====
export interface CreateRoomRequest {
  name: string                   // 방 이름 (1-50자)
  maxPlayers?: number            // 최대 플레이어 수 (2-10, 기본 6)
}

export interface JoinRoomRequest {
  roomCode: string               // 6자리 방 코드
}

export interface UpdateProfileRequest {
  nickname: string               // 닉네임 (2-20자)
  avatarUrl?: string             // 프로필 이미지 URL
}

// ===== WebSocket 클라이언트 상태 타입 =====
export interface SocketState {
  connected: boolean
  roomId?: number
  error?: string
}

// ===== 게임 관련 상수 타입 =====
export const GAME_CONSTANTS = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 10,
  DEFAULT_PLAYERS: 6,
  ROOM_CODE_LENGTH: 6,
  NICKNAME_MIN_LENGTH: 2,
  NICKNAME_MAX_LENGTH: 20,
  ROOM_NAME_MIN_LENGTH: 1,
  ROOM_NAME_MAX_LENGTH: 50,
} as const

export type GameConstants = typeof GAME_CONSTANTS

// ===== 유틸리티 타입 =====
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>