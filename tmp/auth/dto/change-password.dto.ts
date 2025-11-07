// @CODE:AUTH-PASSWORD-001 | SPEC: SPEC-AUTH-PASSWORD-001.md
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

/**
 * 비밀번호 변경 요청 DTO
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: '현재 비밀번호',
    example: 'OldPassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  currentPassword: string;

  @ApiProperty({
    description: '새 비밀번호 (최소 8자, 대문자/숫자/특수문자 포함)',
    example: 'NewPassword456!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/, {
    message: '비밀번호는 대문자, 숫자, 특수문자를 포함해야 합니다',
  })
  newPassword: string;
}
