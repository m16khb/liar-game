import { IsString, IsOptional, IsEnum, IsInt, IsBoolean, IsNumber, Min, Max, IsJSON, IsNotEmpty, Length } from 'class-validator';
import { GameDifficulty } from '../entities/room.entity';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  title: string;

  @IsEnum(GameDifficulty)
  @IsOptional()
  difficulty?: GameDifficulty = GameDifficulty.NORMAL;

  @IsInt()
  @Min(4)
  @Max(8)
  @IsOptional()
  minPlayers?: number = 4;

  @IsInt()
  @Min(4)
  @Max(8)
  @IsOptional()
  maxPlayers?: number = 8;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean = false;

  @IsString()
  @IsOptional()
  @Length(0, 255)
  password?: string;

  @IsNumber()
  @IsOptional()
  @Min(30)
  @Max(600)
  timeLimit?: number;

  @IsJSON()
  @IsOptional()
  gameSettings?: Record<string, any>;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;
}