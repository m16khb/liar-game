import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
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
  })
  @IsString({ message: '비밀번호는 문자열이어야 합니다' })
  @IsNotEmpty({ message: '비밀번호는 필수입니다' })
  password: string;
}
