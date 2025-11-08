import { Controller, Get, Post, Query, Body, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
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
    return this.roomService.createRoom(createRoomDto, user);
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
    return this.roomService.findByCode(code);
  }
}
