// @CODE:ROOM-001:DATA | SPEC: .moai/specs/SPEC-ROOM-001/spec.md
// @CODE:ROOM-001:DATA: 방 생성 DTO

import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class RoomSettingsDto {
  @ApiProperty({
    description: '최대 인원',
    minimum: 4,
    maximum: 10,
    example: 8,
  })
  @IsInt()
  @Min(4, { message: '최소 인원은 4명입니다' })
  @Max(10, { message: '최대 인원은 10명입니다' })
  maxPlayers: number;

  @ApiProperty({
    description: '토론 시간 (초)',
    minimum: 60,
    maximum: 600,
    example: 180,
  })
  @IsInt()
  @Min(60, { message: '최소 토론 시간은 60초입니다' })
  @Max(600, { message: '최대 토론 시간은 600초입니다' })
  discussionTime: number;

  @ApiProperty({
    description: '공개 방 여부',
    example: true,
  })
  @IsBoolean()
  isPublic: boolean;

  @ApiProperty({
    description: '방 비밀번호 (선택)',
    required: false,
    example: 'password123',
  })
  @IsOptional()
  @IsString()
  password?: string;
}

export class CreateRoomDto {
  @ApiProperty({ type: RoomSettingsDto })
  settings: RoomSettingsDto;
}
