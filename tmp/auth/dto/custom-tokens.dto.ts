// @CODE:AUTH-OAUTH-001 | SPEC: SPEC-AUTH-OAUTH-001.md
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

/**
 * Supabase Auth Hook 요청 DTO
 * Supabase가 Custom Access Token Hook 호출 시 전송하는 형식
 */
export class SupabaseAuthHookRequestDto {
  @ApiProperty({
    description: 'Supabase User ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    description: 'Current JWT claims',
    example: {
      aud: 'authenticated',
      exp: 1234567890,
      iat: 1234567890,
      sub: 'a1b2c3...',
      email: 'user@example.com',
      role: 'authenticated',
    },
  })
  @IsObject()
  @IsNotEmpty()
  claims: Record<string, any>;

  @ApiProperty({
    description: 'Authentication method',
    example: 'password',
    enum: ['password', 'oauth', 'anonymous', 'magiclink'],
  })
  @IsString()
  @IsNotEmpty()
  authentication_method: string;
}

/**
 * 기존 Client 직접 호출용 DTO (Deprecated 예정)
 */
export class CustomTokensRequestDto {
  @ApiProperty({
    description: 'Supabase Access Token (JWT)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  supabaseAccessToken: string;
}

/**
 * Supabase Auth Hook 응답 DTO
 * Backend가 Supabase Hook에 반환하는 형식
 * Backend JWT는 포함하지 않고, 사용자 메타데이터만 추가
 */
export class SupabaseAuthHookResponseDto {
  @ApiProperty({
    description: 'Updated JWT claims with custom Backend user metadata',
    example: {
      aud: 'authenticated',
      exp: 1234567890,
      iat: 1234567890,
      sub: 'a1b2c3...',
      email: 'user@example.com',
      role: 'authenticated',
      user_tier: 'premium',
      user_role: 'user',
      user_id: 123,
    },
  })
  claims: Record<string, any>;
}

/**
 * 기존 Client 직접 호출용 응답 DTO (Deprecated 예정)
 */
export class CustomTokensResponseDto {
  @ApiProperty({
    description: 'Custom Backend Access Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Custom Backend Refresh Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token: string;

  @ApiProperty({
    description: '사용자 정보 (비밀번호 제외)',
  })
  user: {
    id: number;
    email: string;
    tier: string;
    role: string;
    oauthProvider: string | null;
    oauthId: string | null;
    isEmailVerified: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };

  @ApiProperty({
    description: 'Access Token 만료 시간 (초)',
    example: 86400,
  })
  expiresIn: number;

  @ApiProperty({
    description: '토큰 타입',
    example: 'Bearer',
  })
  tokenType: string;
}
