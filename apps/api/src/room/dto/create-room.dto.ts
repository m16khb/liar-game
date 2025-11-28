import { IsString, IsOptional, IsEnum, IsInt, IsBoolean, IsNumber, Min, Max, IsJSON, IsNotEmpty, Length, ValidateIf } from 'class-validator';
import { GameDifficulty } from '../entities/room.entity';
import { IsPasswordStrength } from '@/common/decorators/password-strength.decorator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100, { message: '방 제목은 1-100자 사이여야 합니다.' })
  title: string;

  @IsEnum(GameDifficulty)
  @IsOptional()
  difficulty?: GameDifficulty = GameDifficulty.NORMAL;

  @IsInt()
  @Min(2, { message: '최소 인원은 2명 이상이어야 합니다.' })
  @Max(10, { message: '최소 인원은 10명 이하여야 합니다.' })
  @IsOptional()
  minPlayers?: number = 2;

  @IsInt()
  @Min(2, { message: '최대 인원은 2명 이상이어야 합니다.' })
  @Max(10, { message: '최대 인원은 10명 이하여야 합니다.' })
  @IsOptional()
  maxPlayers?: number = 8;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean = false;

  @IsString()
  @ValidateIf(o => o.isPrivate === true, { message: '비공개 방은 비밀번호가 필요합니다.' })
  @IsPasswordStrength({ message: '비밀번호는 4-20자여야 합니다.' })
  @Length(4, 20, { message: '비밀번호는 4-20자여야 합니다.' })
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