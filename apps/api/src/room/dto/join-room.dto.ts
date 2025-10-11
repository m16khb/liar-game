// @CODE:ROOM-001:DATA | SPEC: .moai/specs/SPEC-ROOM-001/spec.md
// @CODE:ROOM-001:DATA: 방 입장 DTO

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class JoinRoomDto {
  @ApiProperty({
    description: '방 비밀번호 (비밀방인 경우)',
    required: false,
    example: 'password123',
  })
  @IsOptional()
  @IsString()
  password?: string;
}
