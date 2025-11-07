import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: '사용자 이메일 주소',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '올바른 이메일 주소를 입력해주세요' })
  @IsNotEmpty({ message: '이메일은 필수입니다' })
  email: string;

  @ApiProperty({
    description: '사용자 비밀번호',
    example: 'SecurePassword123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString({ message: '비밀번호는 문자열이어야 합니다' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  @MaxLength(128, { message: '비밀번호는 128자를 초과할 수 없습니다' })
  @IsNotEmpty({ message: '비밀번호는 필수입니다' })
  password: string;

  @ApiProperty({
    description: '이메일 인증 코드 (6자리 숫자)',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({ message: '인증 코드는 문자열이어야 합니다' })
  @Length(6, 6, { message: '인증 코드는 6자리여야 합니다' })
  @IsNotEmpty({ message: '인증 코드는 필수입니다' })
  verificationCode: string;
}
