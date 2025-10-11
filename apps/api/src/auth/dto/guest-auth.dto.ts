// @CODE:AUTH-001 | SPEC: .moai/specs/SPEC-AUTH-001/spec.md | TEST: test/auth/guest.test.ts
// 게스트 인증 DTO

import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class GuestAuthDto {
  @IsString()
  @MinLength(3, { message: 'Username must be between 3 and 20 characters' })
  @MaxLength(20, { message: 'Username must be between 3 and 20 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username must contain only alphanumeric characters and underscores',
  })
  username: string;
}
