import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomStatus, GameDifficulty } from '../entities/room.entity';

export class RoomResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: RoomStatus })
  status: RoomStatus;

  @ApiProperty({ enum: GameDifficulty })
  difficulty: GameDifficulty;

  @ApiProperty()
  minPlayers: number;

  @ApiProperty()
  maxPlayers: number;

  @ApiProperty()
  currentPlayers: number;

  @ApiPropertyOptional()
  isPrivate: boolean;

  @ApiPropertyOptional()
  timeLimit: number;

  @ApiPropertyOptional()
  description: string;

  @ApiPropertyOptional()
  gameSettings?: Record<string, any>;

  @ApiPropertyOptional()
  host?: {
    id: number;
    nickname: string;
    avatar?: string;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}