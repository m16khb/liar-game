import { Controller, Get, Post, Query, Body, UseGuards, ValidationPipe, Param, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { RoomStatus } from './entities/room.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserEntity, UserRole } from '../user/entities/user.entity';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('rooms')
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  /**
   * 방 생성 (인증 필요)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '방 생성' })
  @ApiResponse({ status: 201, description: '방 생성 성공', type: RoomResponseDto })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async createRoom(
    @Body(ValidationPipe) createRoomDto: CreateRoomDto,
    @CurrentUser() user: UserEntity,
  ): Promise<RoomResponseDto> {
    // 로그 추가
    console.log(`[RoomController.createRoom] 사용자가 방 생성을 시도합니다:`, {
      userId: user.id,
      userEmail: user.email,
      roomTitle: createRoomDto.title
    });

    // 최소 인원수가 최대 인원수보다 큰 경우 체크
    if (createRoomDto.minPlayers && createRoomDto.maxPlayers) {
      if (createRoomDto.minPlayers > createRoomDto.maxPlayers) {
        throw new Error('최소 인원수는 최대 인원수보다 작거나 같아야 합니다.');
      }
    }

    const room = await this.roomService.createRoom(createRoomDto, user.id);

    console.log(`[RoomController.createRoom] 방 생성 완료:`, {
      roomId: room.id,
      roomCode: room.code,
      hostId: room.hostId,
      title: room.title
    });

    return this.roomService.mapToRoomResponseDto(room);
  }

  /**
   * 방 참가 (인증 필요)
   */
  @Post(':code/join')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '방 참가' })
  @ApiParam({ name: 'code', description: '방 코드 (32자)', example: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6' })
  @ApiResponse({ status: 200, description: '방 참가 성공', type: RoomResponseDto })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 404, description: '존재하지 않는 방' })
  async joinRoom(
    @Param('code') code: string,
    @Body() body: { password?: string },
    @CurrentUser() user: UserEntity,
  ): Promise<RoomResponseDto> {
    const room = await this.roomService.joinRoom(code, user.id, body.password);
    return this.roomService.mapToRoomResponseDto(room);
  }

  /**
   * 전체 방 목록 조회 (인증 불필요)
   */
  @Get()
  @Public()
  @ApiOperation({ summary: '방 목록 조회', description: '모든 사용자가 호출 가능' })
  @ApiQuery({ name: 'status', required: false, enum: RoomStatus, description: '방 상태 필터' })
  @ApiResponse({ status: 200, description: '조회 성공', type: [RoomResponseDto] })
  async findAllRooms(
    @Query('status') status?: RoomStatus,
  ): Promise<RoomResponseDto[]> {
    return this.roomService.findAllRooms(status);
  }

  /**
   * 방 검색 (인증 불필요)
   */
  @Get('search')
  @ApiOperation({ summary: '방 검색', description: '제목으로 방 검색 (인증 불필요)' })
  @ApiQuery({ name: 'q', required: true, description: '검색어 (최소 2자)' })
  @ApiResponse({ status: 200, description: '검색 성공', type: [RoomResponseDto] })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async searchRooms(@Query('q') keyword: string): Promise<RoomResponseDto[]> {
    return this.roomService.searchRooms(keyword);
  }

  /**
   * 방 코드로 방 조회 (인증 불필요)
   */
  @Get(':code')
  @ApiOperation({ summary: '방 코드로 조회', description: '방 코드로 상세 정보 조회 (인증 불필요)' })
  @ApiResponse({ status: 200, description: '조회 성공', type: RoomResponseDto })
  @ApiResponse({ status: 404, description: '존재하지 않는 방' })
  async findByCode(code: string): Promise<RoomResponseDto> {
    const room = await this.roomService.findByCode(code);
    return this.roomService.mapToRoomResponseDto(room);
  }
}
