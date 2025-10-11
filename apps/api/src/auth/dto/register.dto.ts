import { IsEmail, IsString, MinLength } from 'class-validator';
// @CODE:AUTH-001:DATA

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
