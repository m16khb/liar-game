// @CODE:AUTH-PASSWORD-001 | SPEC: SPEC-AUTH-PASSWORD-001.md
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

/**
 * 비밀번호 재설정 요청 DTO
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요' })
  email: string;

  @ApiProperty({
    description: '6자리 인증 코드',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6, { message: '인증 코드는 6자리여야 합니다' })
  @Matches(/^\d{6}$/, { message: '인증 코드는 숫자만 입력 가능합니다' })
  verifyCode: string;
}
