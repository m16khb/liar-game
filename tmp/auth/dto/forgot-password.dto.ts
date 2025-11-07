// @CODE:AUTH-PASSWORD-001 | SPEC: SPEC-AUTH-PASSWORD-001.md
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

/**
 * 비밀번호 찾기 요청 DTO
 */
export class ForgotPasswordDto {
  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요' })
  email: string;
}
