import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckEmailDto {
  @ApiProperty({
    description: '확인할 이메일 주소',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '올바른 이메일 주소를 입력해주세요' })
  @IsNotEmpty({ message: '이메일은 필수입니다' })
  email: string;
}

export class CheckEmailResponseDto {
  @ApiProperty({
    description: '이메일이 시스템에 등록되어 있는지 여부',
    example: true,
  })
  isExist: boolean;

  @ApiProperty({
    description: '탈퇴한 계정 여부',
    example: false,
  })
  isWithdrawn: boolean;
}
