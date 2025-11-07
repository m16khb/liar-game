import { ApiProperty } from '@nestjs/swagger';

export class EmailVerificationResponseDto {
  @ApiProperty({
    description: '성공 상태',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '응답 메시지',
    example: 'Verification email sent successfully',
  })
  message: string;

  @ApiProperty({
    description: '코드 만료까지 남은 시간(초)',
    example: 600,
    required: false,
  })
  expiresIn?: number;
}

export class VerifyEmailResponseDto {
  @ApiProperty({
    description: '성공 상태',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '응답 메시지',
    example: 'Email verified successfully',
  })
  message: string;

  @ApiProperty({
    description: '인증된 사용자 이메일',
    example: 'user@example.com',
  })
  email: string;
}
