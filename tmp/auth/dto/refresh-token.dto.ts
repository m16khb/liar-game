import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 리프레시 토큰 요청 DTO
 * 액세스 토큰 갱신 요청 시 사용
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'JWT 리프레시 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: '리프레시 토큰은 문자열이어야 합니다' })
  @IsNotEmpty({ message: '리프레시 토큰은 필수입니다' })
  refreshToken: string;
}

/**
 * 토큰 갱신 응답 DTO
 * 새로운 액세스 토큰과 리프레시 토큰 반환
 */
export class RefreshTokenResponseDto {
  @ApiProperty({
    description: '새로운 JWT 액세스 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: '새로운 JWT 리프레시 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: '액세스 토큰 만료 시간 (초)',
    example: 86400,
  })
  expiresIn: number;

  @ApiProperty({
    description: '토큰 타입',
    example: 'Bearer',
  })
  tokenType: string;
}
