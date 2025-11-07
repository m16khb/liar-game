import { UserEntity } from '@/modules/user/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 인증 응답 DTO
 * 로그인/회원가입 성공 시 반환되는 데이터 구조
 */
export class AuthResponseDto {
  @ApiProperty({
    description: '사용자 정보 (비밀번호 제외)',
    type: 'object',
    properties: {
      id: { type: 'number', description: '사용자 고유 ID' },
      email: { type: 'string', description: '이메일 주소' },
      tier: {
        type: 'string',
        enum: ['guest', 'member', 'premium', 'admin'],
        description: '사용자 등급',
      },
      isEmailVerified: { type: 'boolean', description: '이메일 인증 상태' },
      lastLoginAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: '마지막 로그인 시간',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: '계정 생성일',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: '정보 수정일',
      },
    },
  })
  user: Omit<UserEntity, 'password'>;

  @ApiProperty({
    description: 'JWT 액세스 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT 리프레시 토큰',
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
