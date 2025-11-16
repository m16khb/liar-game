import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, Max, ValidateIf, IsBoolean, IsObject, MinLength, MaxLength } from 'class-validator';
import { GameDifficulty } from '@/room/entities/room.entity';

export class CreateGameRoomDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @IsInt()
  @Min(2)
  @Max(12)
  minPlayers: number;

  @IsInt()
  @Min(2)
  @Max(12)
  maxPlayers: number;

  @IsEnum(GameDifficulty)
  difficulty: GameDifficulty;

  @IsBoolean()
  isPrivate: boolean;

  @ValidateIf((o) => o.isPrivate === true)
  @IsString()
  @IsOptional()
  password?: string;

  @IsInt()
  @Min(60)
  @Max(3600)
  @IsOptional()
  timeLimit?: number;

  @IsObject()
  @IsOptional()
  gameSettings?: Record<string, any>;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}