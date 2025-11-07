/**
 * JWT 토큰 페이로드 인터페이스
 * 액세스 토큰과 리프레시 토큰에 공통으로 포함되는 정보
 */
export interface TokenPayload {
  /** 사용자 ID */
  sub: number;
  /** 이메일 주소 */
  email: string;
  /** 사용자 등급 */
  tier: string;
  /** 사용자 권한 */
  role: string;
  /** 토큰 발급 시간 (Unix timestamp) */
  iat?: number;
  /** 토큰 만료 시간 (Unix timestamp) */
  exp?: number;
}

/**
 * 리프레시 토큰 페이로드 인터페이스
 * 리프레시 토큰에만 포함되는 추가 정보
 */
export interface RefreshTokenPayload extends TokenPayload {
  /** 토큰 ID (리프레시 토큰 회전을 위한 고유 식별자) */
  jti: string;
  /** 토큰 타입 구분 */
  type: 'refresh';
}

/**
 * 액세스 토큰 페이로드 인터페이스
 * 액세스 토큰에만 포함되는 추가 정보
 */
export interface AccessTokenPayload extends TokenPayload {
  /** 토큰 타입 구분 */
  type: 'access';
}

/**
 * 저장된 리프레시 토큰 정보
 * Redis에 저장되는 리프레시 토큰 메타데이터
 */
export interface StoredRefreshToken {
  /** 사용자 ID */
  userId: number;
  /** 토큰 ID */
  tokenId: string;
  /** 발급 시간 */
  issuedAt: Date;
  /** 만료 시간 */
  expiresAt: Date;
  /** 사용자 에이전트 정보 */
  userAgent?: string;
  /** IP 주소 */
  ipAddress?: string;
}
