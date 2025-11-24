// 게임 관련 타입 정의

export interface Player {
  id: number
  userId: number
  nickname: string
  isHost: boolean
  status: 'ready' | 'not_ready' | 'playing' | 'eliminated'
  joinOrder: number
  user?: {
    email?: string
  }
}

export interface Room {
  id: number
  code: string
  title: string
  status: 'waiting' | 'playing' | 'finished'
  difficulty: 'easy' | 'normal' | 'hard'
  minPlayers: number
  maxPlayers: number
  currentPlayers: number
  isPrivate: boolean
  description?: string
  hostId?: number
  host?: {
    id: number
    nickname: string
  }
}

// 소켓 이벤트 데이터 타입
export interface RoomJoinedData {
  room: Room
  players: Player[]
}

export interface RoomUpdatedData {
  room: Room
  players: Player[]
  hostChanged?: boolean
  newHostId?: number
}

export interface PlayerReadyChangedData {
  players: Player[]
}

export interface HostTransferredData {
  players: Player[]
  newHostId: number
}

export interface RoomDeletedData {
  message: string
}

// 컨텍스트 메뉴 상태
export interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  targetPlayer: Player | null
}
