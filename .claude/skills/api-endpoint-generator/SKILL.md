---
name: api-endpoint-generator
description: NestJS API 엔드포인트 전체 생성 (Controller, Service, DTO, Entity). 새로운 API 기능 구축, CRUD 작업 구현, liar-game 백엔드용 RESTful 엔드포인트 설계 시 사용합니다.
---

# API 엔드포인트 생성기

## 지침

프로젝트 아키텍처 패턴을 따르는 완전한 NestJS API 구조 생성:

1. **요구사항 분석**: 핵심 엔티티와 비즈니스 로직 식별
2. **3계층 아키텍처 설계** (Controller → Service → Repository)
3. **필요한 모든 파일 생성**:
   - REST 엔드포인트를 포함한 Controller
   - 비즈니스 로직을 포함한 Service
   - 검증 및 문서화용 DTO
   - TypeORM 매핑용 Entity
   - 의존성 주입용 Module 파일
4. **기존 프로젝트 패턴과 일관성** 확보
5. **적절한 에러 처리**와 검증 포함

## 예시

### 게임 방 관리 API
```typescript
// Controller: HTTP 요청 처리
@Controller('rooms')
export class RoomController {
  @Post()
  createRoom(@Body() createDto: CreateRoomDto) {
    return this.roomService.create(createDto);
  }

  @Get(':code')
  getRoomByCode(@Param('code') code: string) {
    return this.roomService.findByCode(code);
  }
}

// Service: 비즈니스 로직 포함
@Injectable()
export class RoomService {
  async create(createDto: CreateRoomDto): Promise<GameRoom> {
    const room = this.roomRepository.create({
      ...createDto,
      roomCode: this.generateRoomCode(),
      status: RoomStatus.WAITING
    });
    return await this.roomRepository.save(room);
  }
}

// DTO: 검증 및 문서화
export class CreateRoomDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsInt()
  @Min(2)
  @Max(10)
  maxPlayers: number;
}

// Entity: 데이터베이스 매핑
@Entity('game_rooms')
export class GameRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  roomCode: string;

  @Column()
  name: string;

  @Column()
  maxPlayers: number;

  @Column({ default: 0 })
  currentPlayers: number;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.WAITING
  })
  status: RoomStatus;
}
```

## 핵심 패턴

- **Fastify 사용**: 적절한 HTTP 상태 코드를 위한 Reply 객체
- **검증 포함**: DTO의 class-validator 데코레이터
- **Swagger 문서화**: @ApiProperty 데코레이터
- **에러 처리**: NotFoundException, BadRequestException
- **명명 규칙 준수**: 일관된 파일 및 메서드 이름
- **페이지네이션 포함**: 목록 엔드포인트용
- **적절한 TypeScript 타입**: 모든 인터페이스 및 반환값용