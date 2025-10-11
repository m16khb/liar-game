// @CODE:ROOM-001:API | SPEC: .moai/specs/SPEC-ROOM-001/spec.md
// @CODE:ROOM-001:API: REST API 엔드포인트

import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomResponse, Room } from './room.types';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';

@ApiTags('room')
@Controller('room')
// @UseGuards(JwtAuthGuard) // JWT 인증 가드 추가 (AUTH-002 완료 후)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  /**
   * POST /api/room
   * 방 생성
   */
  @Post()
  @ApiOperation({ summary: '방 생성' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: '방 생성 성공',
  })
  async createRoom(
    @Request() req: any,
    @Body() dto: CreateRoomDto,
  ): Promise<CreateRoomResponse> {
    // JWT에서 userId 추출 (인증 가드 추가 후)
    const userId = req.user?.id || 'test-user-123';

    return this.roomService.createRoom(userId, dto.settings);
  }

  /**
   * GET /api/room/:code
   * 방 정보 조회
   */
  @Get(':code')
  @ApiOperation({ summary: '방 정보 조회' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: '방 정보 조회 성공',
  })
  @ApiResponse({
    status: 404,
    description: '존재하지 않는 방',
  })
  async getRoom(@Param('code') code: string): Promise<Room | null> {
    return this.roomService.getRoom(code);
  }

  /**
   * POST /api/room/:code/join
   * 방 입장
   */
  @Post(':code/join')
  @ApiOperation({ summary: '방 입장' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: '방 입장 성공',
  })
  @ApiResponse({
    status: 400,
    description: '방 입장 실패 (인원 초과, 중복 입장 등)',
  })
  async joinRoom(
    @Request() req: any,
    @Param('code') code: string,
    @Body() dto: JoinRoomDto,
  ): Promise<{ success: boolean; message: string }> {
    // JWT에서 userId, username 추출 (인증 가드 추가 후)
    const userId = req.user?.id || 'test-user-456';
    const username = req.user?.username || '테스트유저';

    await this.roomService.joinRoom(code, {
      id: userId,
      username,
      password: dto.password,
    });

    return {
      success: true,
      message: '방에 입장했습니다',
    };
  }
}
