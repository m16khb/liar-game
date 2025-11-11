import { IsString, IsNotEmpty, Length } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: '방 코드는 6자리여야 합니다.' })
  roomCode: string;
}