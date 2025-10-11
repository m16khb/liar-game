// @CODE:AUTH-001
export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserSession {
  userId: string;
  sessionId: string;
  createdAt: Date;
}
