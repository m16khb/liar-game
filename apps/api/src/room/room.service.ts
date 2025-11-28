import { Injectable, NotFoundException, BadRequestException, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import { randomUUID } from 'crypto';
import { RoomEntity, RoomStatus } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { SanitizeUtil } from '@/common/utils/sanitize.util';
import { PlayerService } from '../player/player.service';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  constructor(
    @InjectRepository(RoomEntity)
    private readonly roomRepository: Repository<RoomEntity>,
    private readonly playerService: PlayerService,
  ) {}

  /**
   * 방 생성
   */
  async createRoom(createRoomDto: CreateRoomDto, hostId?: number): Promise<RoomEntity> {
    // 인증 검증 - hostId는 필수
    if (!hostId || hostId === undefined || hostId === null) {
      this.logger.warn(`[createRoom] 인증되지 않은 사용자의 방 생성 시도`);
      throw new UnauthorizedException('방을 생성하려면 로그인이 필요합니다.');
    }

    // 비공개 방인데 비밀번호가 없는 경우
    if (createRoomDto.isPrivate && !createRoomDto.password) {
      throw new BadRequestException('비공개 방은 비밀번호가 필요합니다.');
    }

    // 입력값 Sanitization
    const sanitizedTitle = SanitizeUtil.sanitizeRoomTitle(createRoomDto.title);
    const sanitizedDescription = createRoomDto.description
      ? SanitizeUtil.sanitizeRoomDescription(createRoomDto.description)
      : undefined;

    // 플레이어 수 검증
    const playerCountValidation = SanitizeUtil.validatePlayerCount(
      createRoomDto.minPlayers || 4,
      createRoomDto.maxPlayers || 8
    );
    if (!playerCountValidation.isValid) {
      throw new BadRequestException(playerCountValidation.errors.join(', '));
    }

    // 비밀번호 복잡도 검증 (비공개 방인 경우)
    if (createRoomDto.isPrivate && createRoomDto.password) {
      const passwordValidation = SanitizeUtil.validatePasswordStrength(createRoomDto.password);
      if (!passwordValidation.isValid) {
        throw new BadRequestException(passwordValidation.errors.join(', '));
      }
    }

    // 게임 설정 검증
    if (createRoomDto.gameSettings) {
      const gameSettingsValidation = SanitizeUtil.validateGameSettings(createRoomDto.gameSettings);
      if (!gameSettingsValidation.isValid) {
        throw new BadRequestException(gameSettingsValidation.errors.join(', '));
      }
    }

    // 방 코드 생성 (UUID에서 하이픈 제거)
    const code = await this.generateUniqueRoomCode();

    const room = this.roomRepository.create({
      ...createRoomDto,
      title: sanitizedTitle,
      description: sanitizedDescription,
      code,
      hostId,
      currentPlayers: 0,
    });

    console.log(`[RoomService.createRoom] 방 엔티티 생성:`, {
      code,
      hostId,
      title: createRoomDto.title,
      isPrivate: createRoomDto.isPrivate
    });

    const savedRoom = await this.roomRepository.save(room);

    console.log(`[RoomService.createRoom] 데이터베이스에 방 저장 완료:`, {
      id: savedRoom.id,
      code: savedRoom.code,
      hostId: savedRoom.hostId
    });

    return savedRoom;
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

    // 검색어 Sanitization
    const sanitizedKeyword = SanitizeUtil.sanitizeSearchKeyword(keyword.trim());

    const rooms = await this.roomRepository.find({
      where: {
        title: Like(`%${sanitizedKeyword}%`),
        status: RoomStatus.WAITING,
        isPrivate: false,
        deletedAt: IsNull(),
      },
      relations: ['host'],
      order: {
        createdAt: 'DESC',
      },
    });

    this.logger.log(`[searchRooms] 검색 수행 - 키워드: "${sanitizedKeyword}", 결과: ${rooms.length}개`);

    return rooms.map(room => this.mapToRoomResponseDto(room));
  }

  /**
   * 방 코드로 방 조회
   */
  async findByCode(code: string): Promise<RoomEntity> {
    // 방 코드 형식 검증
    if (!SanitizeUtil.validateRoomCode(code)) {
      this.logger.warn(`[findByCode] 잘못된 방 코드 형식: ${code}`);
      throw new BadRequestException('올바르지 않은 방 코드 형식입니다.');
    }

    const room = await this.roomRepository.findOne({
      where: { code, deletedAt: IsNull() },
      relations: ['host'],
    });

    if (!room) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }

    return room;
  }

  /**
   * ID로 방 조회
   */
  async findById(id: number): Promise<RoomEntity | null> {
    return await this.roomRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  /**
   * 인원 수 증가
   */
  async incrementPlayers(roomId: number): Promise<RoomEntity> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }

    // 최대 인원 체크
    if (room.currentPlayers >= room.maxPlayers) {
      throw new BadRequestException('방이 가득 찼습니다.');
    }

    room.currentPlayers += 1;
    this.logger.log(`[incrementPlayers] 방 참가 - roomId: ${roomId}, 현재 인원: ${room.currentPlayers}/${room.maxPlayers}`);
    return await this.roomRepository.save(room);
  }

  /**
   * 방 참가 (인증 필요)
   */
  async joinRoom(roomCode: string, userId: number, password?: string): Promise<RoomEntity> {
    // 인증 검증
    if (!userId || userId === undefined || userId === null) {
      this.logger.warn(`[joinRoom] 인증되지 않은 사용자의 방 참가 시도`);
      throw new UnauthorizedException('방에 참가하려면 로그인이 필요합니다.');
    }

    // 방 조회
    const room = await this.findByCode(roomCode);

    // 이미 참가 중인 플레이어인지 확인
    const existingPlayer = await this.playerService.findPlayer(room.id, userId);
    const isRejoining = existingPlayer !== null;

    this.logger.log(`[joinRoom] 참가 시도 - roomId: ${room.id}, userId: ${userId}, 재참가: ${isRejoining}`);

    // 방 상태 확인 (재참가가 아닌 경우에만)
    if (!isRejoining && room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('이미 시작된 방에는 참가할 수 없습니다.');
    }

    // 최대 인원 확인 (재참가가 아닌 경우에만)
    if (!isRejoining && room.currentPlayers >= room.maxPlayers) {
      throw new BadRequestException('방이 가득 찼습니다.');
    }

    // 비공개 방 비밀번호 확인 (재참가가 아닌 경우에만)
    if (!isRejoining && room.isPrivate) {
      if (!password) {
        throw new BadRequestException('비공개 방은 비밀번호가 필요합니다.');
      }
      // TODO: 비밀번호 해시 비교 구현 (현재는 평문 비교)
      if (room.password !== password) {
        this.logger.warn(`[joinRoom] 잘못된 비밀번호 시도 - roomId: ${room.id}, userId: ${userId}`);
        throw new BadRequestException('비밀번호가 일치하지 않습니다.');
      }
    }

    // 재참가인 경우 인원 수 증가 없이 방 정보만 반환
    if (isRejoining) {
      this.logger.log(`[joinRoom] 재참가 성공 - roomId: ${room.id}, userId: ${userId}`);
      return room;
    }

    // 신규 참가인 경우 인원 수 증가
    const updatedRoom = await this.incrementPlayers(room.id);

    this.logger.log(`[joinRoom] 방 참가 성공 - roomId: ${room.id}, userId: ${userId}, 현재 인원: ${updatedRoom.currentPlayers}`);

    return updatedRoom;
  }

  /**
   * 인원 수 감소
   */
  async decrementPlayers(roomId: number): Promise<RoomEntity> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }

    if (room.currentPlayers > 0) {
      room.currentPlayers -= 1;
    }
    return await this.roomRepository.save(room);
  }

  /**
   * 방 상태 업데이트
   */
  async updateStatus(roomId: number, status: RoomStatus): Promise<RoomEntity> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }

    room.status = status;
    return await this.roomRepository.save(room);
  }

  /**
   * 방 정보 업데이트 (인원 수 등)
   */
  async updateRoom(id: number, updates: Partial<RoomEntity>): Promise<RoomResponseDto> {
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
   * 방장 변경
   */
  async updateHost(roomId: number, newHostId: number): Promise<void> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId, deletedAt: IsNull() },
    });

    if (!room) {
      throw new NotFoundException('존재하지 않는 방입니다.');
    }

    await this.roomRepository.update(roomId, { hostId: newHostId });
    console.log(`[RoomService.updateHost] 방장 변경 - roomId: ${roomId}, oldHostId: ${room.hostId}, newHostId: ${newHostId}`);
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
   * 중복되지 않는 방 코드 생성 (UUID에서 하이픈 제거)
   */
  private async generateUniqueRoomCode(): Promise<string> {
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      // UUID 생성 후 하이픈(-) 제거
      code = randomUUID().replace(/-/g, '');

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
   * RoomEntity를 RoomResponseDto로 변환
   */
  mapToRoomResponseDto(room: RoomEntity): RoomResponseDto {
    return {
      id: room.id,
      code: room.code,
      title: room.title,
      status: room.status,
      difficulty: room.difficulty,
      minPlayers: room.minPlayers,
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
