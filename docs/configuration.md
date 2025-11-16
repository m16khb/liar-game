# 설정 문서

## 개요

Liar Game 애플리케이션의 구성 설정 및 보안 설정을 설명합니다.

---

## 1. 보안 설정

### 1.1 입력값 정제 유틸리티 (SanitizeUtil)

**위치**: `/apps/api/src/common/utils/sanitize.util.ts`

**기능**: XSS 및 SQL Injection 방지를 위한 입력값 정제 유틸리티 클래스

#### 주요 메서드

| 메서드 | 설명 | 적용 대상 |
|--------|------|----------|
| `sanitizeHtml()` | HTML 태그 및 스크립트 제거 | 모든 텍스트 입력 |
| `sanitizeSql()` | SQL Injection 패턴 제거 | 모든 텍스트 입력 |
| `sanitizeRoomTitle()` | 방 제목 정제 | 방 제목 |
| `sanitizeRoomDescription()` | 방 설명 정제 | 방 설명 |
| `sanitizeSearchKeyword()` | 검색어 정제 | 검색어 |

#### 정제 규칙
```typescript
// HTML 태그 제거
.replace(/<[^>]*>/g, '')

// 스크립트 태그 제거
.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

// 이벤트 핸들러 제거
.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')

// SQL Injection 방지
.replace(/\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b/gi, '')
```

### 1.2 보안 예외 필터 (SecurityExceptionFilter)

**위치**: `/apps/api/src/common/filters/security-exception.filter.ts`

**기능**: 모든 HTTP 예외에 대한 보안 로깅 및 감사

#### 특징
- 자동으로 모든 요청에 적용됨
- 보안 관련 오류 감지 및 로깅
- 프로덕션 환경에서 오류 메시지 마스킹
- 보안 이벤트 추적

#### 보안 감사 로깅
```typescript
// 보안 이벤트 로깅 포맷
{
  event: 'SECURITY_VIOLATION',
  message: '오류 메시지',
  method: 'HTTP 메서드',
  url: '요청 URL',
  ip: '클라이언트 IP',
  userAgent: '사용자 에이전트',
  userId: '사용자 ID',
  timestamp: '타임스탬프'
}
```

### 1.3 인증 및 권한 관리

#### JWT 인증 가드
```typescript
@UseGuards(JwtAuthGuard)  // JWT 토큰 검증
@UseGuards(RolesGuard)    // 역할 기반 접근 제어
@Roles(UserRole.USER, UserRole.ADMIN)  // 허용 역할
```

#### 역할 기반 접근 제어
- **USER**: 일반 사용자 권한
- **ADMIN**: 관리자 권한
- **PUBLIC**: 인증 불필요 엔드포인트

---

## 2. 데이터베이스 설정

### 2.1 기본 구성

**TypeORM**을 사용한 PostgreSQL 연결:

```typescript
// 애플리케이션 구성
database:
  type: 'postgres'
  host: process.env.DB_HOST
  port: parseInt(process.env.DB_PORT)
  username: process.env.DB_USERNAME
  password: process.env.DB_PASSWORD
  database: process.env.DB_DATABASE
  entities: [RoomEntity, UserEntity]
  synchronize: false  // 프로덕션에서는 false
  logging: true
```

### 2.2 인덱싱 전략

#### 방 테이블 인덱싱
```typescript
@Entity()
@Index(['code'], { unique: true })           // 방 코드 고유성 보장
@Index(['status', 'createdAt'])             // 상태별 조회 성능 최적화
export class RoomEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  status: RoomStatus;

  @Column()
  createdAt: Date;
}
```

### 2.3 소프트 딜리트 구현

데이터 무결성을 위한 소프트 딜리트 패턴:

```typescript
@Column({ nullable: true })
deletedAt: Date;

// 삭제 시 실제 삭제가 아닌 deletedAt 설정
await this.roomRepository.softDelete(id);
```

---

## 3. 유효성 검사 설정

### 3.1 DTO 검증 규칙

#### 방 생성 검증
```typescript
export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  title: string;

  @IsInt()
  @Min(2)
  @Max(10)
  minPlayers: number;

  @IsInt()
  @Min(2)
  @Max(10)
  maxPlayers: number;

  @IsEnum(RoomStatus)
  difficulty: RoomStatus;

  @IsBoolean()
  isPrivate: boolean;

  @IsOptional()
  @IsString()
  @Length(4, 20)
  password?: string;
}
```

### 3.2 커스텀 검증 규칙

#### 플레이어 수 검증
```typescript
static validatePlayerCount(min: number, max: number): {
  isValid: boolean;
  errors: string[];
} {
  if (min < 2) {
    errors.push('최소 인원은 2명 이상이어야 합니다.');
  }
  if (max > 10) {
    errors.push('최대 인원은 10명 이하여야 합니다.');
  }
  if (min > max) {
    errors.push('최소 인원은 최대 인원보다 작거나 같아야 합니다.');
  }
}
```

#### 비밀번호 복잡도 검증
```typescript
static validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  if (password.length < 4) {
    errors.push('비밀번호는 최소 4자 이상이어야 합니다.');
  }
  if (password.length > 20) {
    errors.push('비밀번호는 최대 20자 이하여야 합니다.');
  }
  if (/<script|javascript:|on\w+=/i.test(password)) {
    errors.push('비밀번호에 사용할 수 없는 문자가 포함되어 있습니다.');
  }
}
```

---

## 4. 로깅 설정

### 4.1 NestJS Logger

서비스 로깅을 위한 내장 Logger 사용:

```typescript
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  async createRoom(createRoomDto: CreateRoomDto, hostId?: number) {
    this.logger.log(`방 생성 시도 - 사용자: ${hostId}`);
    this.logger.error(`방 생성 실패`, error);
    this.logger.warn(`잘못된 비밀번호 시도 - roomId: ${roomId}`);
  }
}
```

### 4.2 로깅 레벨
- **log**: 일반 정보
- **warn**: 경고 및 보안 이벤트
- **error**: 오류 및 서버 문제
- **debug**: 디버깅 정보

---

## 5. 환경 변수 설정

### 5.1 필수 환경 변수

```bash
# 데이터베이스
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=liar_game

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION_TIME=3600

# 애플리케이션
NODE_ENV=development
PORT=3000
```

### 5.2 선택적 환경 변수

```bash
# 로깅
LOG_LEVEL=info

# 보안
ENABLE_SECURITY_FILTERS=true
```

---

## 6. 배포 구성

### 6.1 Docker 구성

```dockerfile
# API 서버
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### 6.2 NPM 스크립트

```json
{
  "scripts": {
    "build": "nest build",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "lint": "eslint . --ext .ts,.tsx",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand"
  }
}
```

---

## 7. 변경 이력

| 날짜 | 변경 내용 | 영향 범위 |
|------|----------|----------|
| 2024-01-16 | Redis 의존성 제거 | 데이터베이스 구성 |
| 2024-01-16 | 보안 입력값 정제 유틸리티 추가 | 모든 입력 처리 |
| 2024-01-16 | 보안 예외 필터 구현 | 오류 처리 및 로깅 |
| 2024-01-16 | 인증 및 권한 관리 강화 | 접근 제어 |
| 2024-01-16 | 유효성 검사 규칙 확장 | 데이터 검증 |

---

## 8. 모범 사례

### 8.1 보안 모범 사례

1. **입력값 정제**: 모든 사용자 입력은 필터링 필수
2. **최소 권한 원칙**: 최소한의 권한만 부여
3. **로그 유지**: 모든 보안 이벤트는 로깅
4. **오류 처리**: 사용자에게 노출되지 않는 안전한 오류 메시지

### 8.2 성능 모범 사례

1. **인덱싱**: 자주 조회되는 필드에 인덱스 설정
2. **소프트 딜리트**: 실제 삭제보다 상태 변경 우선
3. **연결 풀링**: 데이터베이스 연결 풀링 사용
4. **캐십**: 필요시 적절한 캐십 전략

### 8.3 유지보수 모범 사례

1. **모듈화**: 기능별 모듈 분리
2. **타입 안전성**: TypeScript 타입 활용
3. **테스트 커버리지**: 단위 테스트 및 통합 테스트
4. **문서화**: API 및 설정 문서 최신 유지