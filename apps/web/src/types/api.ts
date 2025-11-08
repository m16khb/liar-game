// API 응답 타입 정의

export enum RoomStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

export enum GameDifficulty {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
}

export interface RoomResponse {
  id: string;
  code: string;
  title: string;
  status: RoomStatus;
  difficulty: GameDifficulty;
  maxPlayers: number;
  currentPlayers: number;
  isPrivate: boolean;
  timeLimit?: number;
  description?: string;
  gameSettings?: Record<string, any>;
  host?: {
    id: string;
    nickname: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoomRequest {
  title: string;
  difficulty?: GameDifficulty;
  maxPlayers?: number;
  isPrivate?: boolean;
  password?: string;
  timeLimit?: number;
  gameSettings?: Record<string, any>;
  description?: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  statusCode: number;
}