import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
// @CODE:AUTH-001:DATA | SPEC: SPEC-AUTH-001.md

/**
 * 회원가입 DTO (REQ-002)
 */
export class RegisterDto {
  @IsEmail({}, { message: '유효한 이메일 형식이 아닙니다' })
  email: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  password: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsOptional()
  @IsString()
  supabaseId?: string; // OAuth 연동 시 Supabase UID
}
