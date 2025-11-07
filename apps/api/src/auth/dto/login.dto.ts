// 로그인 DTO
// 이메일/비밀번호 로그인 요청 데이터 검증

import { IsEmail, IsString, MinLength } from 'class-validator'

export class LoginDto {
  /**
   * 이메일 주소
   * 유효한 이메일 형식이어야 함
   */
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요' })
  email: string

  /**
   * 비밀번호
   * 최소 6자 이상이어야 함
   */
  @IsString({ message: '비밀번호는 문자열이어야 합니다' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다' })
  password: string
}