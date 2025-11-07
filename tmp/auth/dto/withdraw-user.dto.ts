// @CODE:USER-LIFECYCLE-001 | SPEC: SPEC-USER-LIFECYCLE-001.md
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

/**
 * 회원 탈퇴 요청 DTO
 * User withdrawal request DTO
 */
export class WithdrawUserDto {
  @ApiProperty({
    description: '현재 비밀번호 (최소 8자, 대문자/숫자/특수문자 포함)',
    example: 'MyPassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  password: string;
}
