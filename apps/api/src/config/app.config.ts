// 애플리케이션 설정 관리
// 환경 변수 중앙 관리 및 타입 안전성 보장

import { plainToClass, Transform } from 'class-transformer'
import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, validateSync } from 'class-validator'

export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

export class EnvironmentVariables {
  @IsString()
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.DEVELOPMENT

  // 서버 설정
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number = 4000

  @IsString()
  FRONTEND_URL: string = 'http://localhost:3000'

  // 데이터베이스 설정
  @IsString()
  DB_HOST: string = 'localhost'

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  DB_PORT: number = 3306

  @IsString()
  DB_USERNAME: string = 'liaruser'

  @IsString()
  DB_PASSWORD: string

  @IsString()
  DB_NAME: string = 'liardb'

  // Redis 설정
  @IsString()
  REDIS_URL: string = 'redis://localhost:6379'

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string

  // Supabase 설정
  @IsString()
  SUPABASE_URL: string

  @IsString()
  SUPABASE_ANON_KEY: string

  @IsString()
  SUPABASE_SERVICE_ROLE_KEY: string

  // JWT 설정
  @IsString()
  JWT_SECRET: string

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  JWT_EXPIRES_IN?: number = 3600 // 1시간

  // 로깅 설정
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  LOG_SQL_QUERIES?: boolean = false

  @IsOptional()
  @IsEnum(['debug', 'info', 'warn', 'error'])
  LOG_LEVEL?: string = 'info'

  // 시간대 설정
  @IsString()
  TZ: string = 'UTC'

  // CORS 설정
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  ENABLE_CORS?: boolean = true

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string = 'http://localhost:3000'

  // Rate Limiting 설정
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_TTL?: number = 60 // 1분

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_LIMIT?: number = 100 // 요청당 100회

  // 파일 업로드 설정
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  MAX_FILE_SIZE?: number = 10 * 1024 * 1024 // 10MB

  @IsOptional()
  @IsString()
  UPLOAD_PATH?: string = './uploads'
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  })

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  })

  if (errors.length > 0) {
    const errorMessages = errors.map(error => {
      const constraints = Object.values(error.constraints || {})
      return `${error.property}: ${constraints.join(', ')}`
    })

    throw new Error(`환경 변수 검증 실패: ${errorMessages.join('; ')}`)
  }

  return validatedConfig
}

/**
 * 애플리케이션 설정 상수
 */
export const APP_CONFIG = {
  // API 버전
  API_VERSION: 'v1',
  API_PREFIX: '/api',

  // 기본 설정
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // 게임 관련 상수
  GAME_CONSTANTS: {
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 10,
    DEFAULT_PLAYERS: 6,
    ROOM_CODE_LENGTH: 6,
    NICKNAME_MIN_LENGTH: 2,
    NICKNAME_MAX_LENGTH: 20,
    ROOM_NAME_MIN_LENGTH: 1,
    ROOM_NAME_MAX_LENGTH: 50,
  },

  // 세션 관련 상수
  SESSION_CONSTANTS: {
    SESSION_TIMEOUT: 24 * 60 * 60, // 24시간 (초)
    ONLINE_TIMEOUT: 5 * 60, // 5분 (초)
    ROOM_CACHE_TIMEOUT: 60 * 60, // 1시간 (초)
  },

  // 파일 관련 상수
  FILE_CONSTANTS: {
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
  },

  // 보안 관련 상수
  SECURITY_CONSTANTS: {
    PASSWORD_MIN_LENGTH: 8,
    MAX_LOGIN_ATTEMPTS: 5,
    LOGIN_COOLDOWN: 15 * 60, // 15분 (초)
  },

  // 성능 관련 상수
  PERFORMANCE_CONSTANTS: {
    API_TIMEOUT: 30 * 1000, // 30초 (밀리초)
    WS_PING_INTERVAL: 30 * 1000, // 30초 (밀리초)
    CACHE_TTL: {
      SHORT: 5 * 60, // 5분
      MEDIUM: 30 * 60, // 30분
      LONG: 60 * 60, // 1시간
    },
  },
} as const

/**
 * 설정 유틸리티 함수
 */
export const configUtils = {
  /**
   * 개발 환경인지 확인
   */
  isDevelopment(): boolean {
    return process.env.NODE_ENV === Environment.DEVELOPMENT
  },

  /**
   * 프로덕션 환경인지 확인
   */
  isProduction(): boolean {
    return process.env.NODE_ENV === Environment.PRODUCTION
  },

  /**
   * 테스트 환경인지 확인
   */
  isTest(): boolean {
    return process.env.NODE_ENV === Environment.TEST
  },

  /**
   * 현재 환경에 따른 데이터베이스 설정 반환
   */
  getDatabaseConfig() {
    return {
      synchronize: this.isDevelopment(),
      logging: this.isDevelopment(),
      timezone: '+00:00', // UTC 기준
    }
  },

  /**
   * CORS 설정 반환
   */
  getCorsConfig() {
    return {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }
  },
}