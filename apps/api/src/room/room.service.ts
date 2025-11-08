import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import { Room, RoomStatus } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { UserEntity } from '../user/entities/user.entity';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  /**
   * 방 생성
   */
  async createRoom(createRoomDto: CreateRoomDto, host: UserEntity): Promise<RoomResponseDto> {
    // 비공개 방인데 비밀번호가 없는 경우
    if (createRoomDto.isPrivate && !createRoomDto.password) {
      throw new BadRequestException('비공개 방은 비밀번호가 필요합니다.');
    }

    // 방 코드 생성 (6자리 영문 대문자 + 숫자)
    const code = await this.generateUniqueRoomCode();

    const room = this.roomRepository.create({
      ...createRoomDto,
      code,
      host,
      hostId: host.id,
      currentPlayers: host ? 1 : 0,
    });

    const savedRoom = await this.roomRepository.save(room);

    return this.mapToRoomResponseDto(savedRoom);
  }

  /**
   * 전체 방 목록 조회 (인증 없이 호출 가능)
   */
  async findAllRooms(status?: RoomStatus): Promise<RoomResponseDto[]> {
    const whereCondition: any = { deletedAt: IsNull() };

    if (status) {
      whereCondition.status = status;
    }

    const rooms = await this.roomRepository.find({
      where: whereCondition,
      relations: ['host'],
      order: {
        createdAt: 'DESC',
      },
    });

    return rooms.map(room => this.mapToRoomResponseDto(room));
  }

  /**
   * 방 검색 (제목으로 검색)
   */
  async searchRooms(keyword: string): Promise<RoomResponseDto[]> {
    if (!keyword || keyword.trim().length < 2) {
      throw new BadRequestException('검색어는 최소 2자 이상이어야 합니다.');
    }

    const rooms = await this.roomRepository.find({
      where: {
        title: Like(`%${keyword}%`),
        status: RoomStatus.WAITING,
        isPrivate: false,
        deletedAt: IsNull(),
      },
      relations: ['host'],
      order: {
        createdAt: 'DESC',
      },
    });

    return rooms.map(room => this.mapToRoomResponseDto(room));
  }

  /**
   * 방 코드로 방 조회
   */
  async findByCode(code: string): Promise<RoomResponseDto> {
    const room = await this.roomRepository.findOne({
      where: { code, deletedAt: IsNull() },
      relations: ['host'],
    });

    if (!room) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }

    return this.mapToRoomResponseDto(room);
  }

  /**
   * 방 정보 업데이트 (인원 수 등)
   */
  async updateRoom(id: number, updates: Partial<Room>): Promise<RoomResponseDto> {
    const room = await this.roomRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!room) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }

    const updatedRoom = await this.roomRepository.save({
      ...room,
      ...updates,
    });

    return this.mapToRoomResponseDto(updatedRoom);
  }

  /**
   * 방 삭제 (소프트 딜리트)
   */
  async deleteRoom(id: number): Promise<void> {
    const room = await this.roomRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!room) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }

    await this.roomRepository.softDelete(id);
  }

  /**
   * 중복되지 않는 방 코드 생성
   */
  private async generateUniqueRoomCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      const existingRoom = await this.roomRepository.findOne({
        where: { code, deletedAt: IsNull() },
      });

      if (!existingRoom) {
        isUnique = true;
      }
    }

    return code!;
  }

  /**
   * Room Entity를 RoomResponseDto로 변환
   */
  private mapToRoomResponseDto(room: Room): RoomResponseDto {
    return {
      id: room.id,
      code: room.code,
      title: room.title,
      status: room.status,
      difficulty: room.difficulty,
      maxPlayers: room.maxPlayers,
      currentPlayers: room.currentPlayers,
      isPrivate: room.isPrivate,
      timeLimit: room.timeLimit,
      description: room.description,
      gameSettings: room.gameSettings,
      host: room.host ? {
        id: room.host.id,
        nickname: '플레이어',
        avatar: undefined,
      } : undefined,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }
}
