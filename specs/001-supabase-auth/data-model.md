# Data Model Specification: Supabase Authentication

**생성일**: 2025-11-08
**버전**: 1.0.0
**기반**: spec.md 기능 요구사항, research.md Best Practices

## Entity 정의

### 1. User Entity

**테이블명**: `users`
**설명**: 시스템의 사용자 정보를 저장하는 핵심 엔티티

```typescript
@Entity('users')
@Index(['email'])                    // 이메일 검색 최적화
@Index(['oauthId'])                  // OAuth ID 검색 최적화
@Index(['role'])                     // 역할 기반 쿼리 최적화
@Index(['deletedAt'])                // 소프트 딜리트 쿼리 최적화
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // OAuth 제공업체 구분
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'OAuth 제공업체 (google, github, discord)',
  })
  oauthProvider?: string;

  // Supabase OAuth 고유 ID
  @Column({
    type: 'varchar',
    length: 36,
    unique: true,
    comment: 'Supabase OAuth 고유 식별자',
  })
  oauthId: string;

  // 사용자 등급
  @Column({
    type: 'enum',
    enum: ['MEMBER', 'PREMIUM', 'VIP'],
    default: 'MEMBER',
    comment: '사용자 등급',
  })
  tier: UserTier;

  // 사용자 역할
  @Column({
    type: 'enum',
    enum: ['USER', 'ADMIN'],
    default: 'USER',
    comment: '사용자 역할',
  })
  role: UserRole;

  // 이메일 (고유)
  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    comment: '사용자 이메일',
  })
  email: string;

  // 닉네임 (고유)
  @Column({
    type: 'varchar',
    length: 20,
    comment: '사용자 닉네임',
  })
  nickname: string;

  // 프로필 이미지 URL
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '프로필 이미지 URL',
  })
  avatarUrl?: string;

  // Soft Delete
  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true,
    comment: '계정 삭제일 (소프트 딜리트)',
  })
  deletedAt?: Date;

  // 생성일시 (UTC)
  @CreateDateColumn({
    type: 'timestamp',
    comment: '생성일시 (UTC)',
  })
  createdAt: Date;

  // 수정일시 (UTC)
  @UpdateDateColumn({
    type: 'timestamp',
    comment: '수정일시 (UTC)',
  })
  updatedAt: Date;
}
```

### 2. RefreshToken Entity (권장)

**테이블명**: `refresh_tokens`
**설명**: Refresh Token Rotation 관리를 위한 토큰 저장소

```typescript
@Entity('refresh_tokens')
@Index(['userId'])                   // 사용자 기반 토큰 조회 최적화
@Index(['isRevoked'])                // 폐지된 토큰 필터링 최적화
export class RefreshToken {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // 연결된 사용자
  @ManyToOne(() => User, {
    createForeignKeyConstraints: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @RelationId((token: RefreshToken) => token.user)
  @Column({ name: 'user_id' })
  userId: number;

  // Refresh Token 해시
  @Column({
    type: 'varchar',
    length: 255,
    comment: '해시된 Refresh Token',
  })
  tokenHash: string;

  // 토큰 식별자
  @Column({
    type: 'varchar',
    length: 36,
    unique: true,
    comment: '토큰 고유 식별자 (JTI)',
  })
  jti: string;

  // 디바이스 정보
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '디바이스 식별자',
  })
  deviceId?: string;

  // 만료일시 (UTC)
  @Column({
    type: 'timestamp',
    comment: '토큰 만료일시 (UTC)',
  })
  expiresAt: Date;

  // 폐지 여부
  @Column({
    type: 'boolean',
    default: false,
    comment: '토큰 폐지 여부',
  })
  isRevoked: boolean;

  // 생성일시 (UTC)
  @CreateDateColumn({
    type: 'timestamp',
    comment: '생성일시 (UTC)',
  })
  createdAt: Date;
}
```

## Enum 정의

```typescript
export enum UserTier {
  MEMBER = 'MEMBER',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum OAuthProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
  DISCORD = 'discord',
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  TOKEN_REFRESH = 'token_refresh',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  ROLE_CHANGE = 'role_change',
  MULTIPLE_DEVICES = 'multiple_devices',
  SECURITY_SETTING_CHANGE = 'security_setting_change',
}
```

## 데이터 검증 규칙

### User Entity 검증

```typescript
export const CreateUserDto = {
  email: {
    type: 'email',
    required: true,
    maxLength: 255,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  nickname: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 20,
    pattern: /^[가-힣a-zA-Z0-9_-]+$/,
  },
  avatarUrl: {
    type: 'url',
    required: false,
    maxLength: 500,
  },
};

export const UpdateUserDto = {
  nickname: {
    type: 'string',
    required: false,
    minLength: 2,
    maxLength: 20,
    pattern: /^[가-힣a-zA-Z0-9_-]+$/,
  },
  avatarUrl: {
    type: 'url',
    required: false,
    maxLength: 500,
  },
};
```

### 비즈니스 규칙

1. **이메일 고유성**: 중복된 이메일 허용 안 함
2. **닉네임 고유성**: 중복된 닉네임 허용 안 함 (소프트 딜리트 제외)
3. **OAuth ID 고유성**: 동일 OAuth 제공업체 내에서 고유해야 함
4. **Soft Delete 규칙**: 삭제된 사용자는 `deletedAt`이 `NOT NULL`이어야 함
5. **관리자 권한**: ADMIN 역할 사용자는 최소 1명 이상 유지 필요

## 관계 정의

### User ↔ RefreshToken (1:N)
- 하나의 사용자는 여러 개의 RefreshToken을 가질 수 있음 (다중 디바이스)
- RefreshToken은 반드시 하나의 사용자에 속해야 함
- 사용자 삭제 시 관련 RefreshToken 자동 삭제

### 데이터베이스 제약 조건

```sql
-- users 테이블
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  oauthProvider VARCHAR(50) NULL,
  oauthId VARCHAR(36) NOT NULL UNIQUE,
  tier ENUM('MEMBER', 'PREMIUM', 'VIP') DEFAULT 'MEMBER',
  role ENUM('USER', 'ADMIN') DEFAULT 'USER',
  email VARCHAR(255) NOT NULL UNIQUE,
  nickname VARCHAR(20) NOT NULL,
  avatarUrl VARCHAR(500) NULL,
  deletedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_oauth_id (oauthId),
  INDEX idx_role (role),
  INDEX idx_deleted_at (deletedAt),
  INDEX idx_nickname_deleted (nickname, deletedAt)
);

-- refresh_tokens 테이블
CREATE TABLE refresh_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  userId INT UNSIGNED NOT NULL,
  tokenHash VARCHAR(255) NOT NULL,
  jti VARCHAR(36) NOT NULL UNIQUE,
  deviceId VARCHAR(100) NULL,
  expiresAt TIMESTAMP NOT NULL,
  isRevoked BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (userId),
  INDEX idx_is_revoked (isRevoked),
  INDEX idx_expires_at (expiresAt),

  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

## 성능 최적화 전략

### 인덱스 설계
1. **단일 컬럼 인덱스**: email, oauthId, role, deletedAt
2. **복합 인덱스**: (nickname, deletedAt) - 활성 사용자 닉네임 검색 최적화
3. **Functional Index**: (LOWER(email)) - 대소문자 구분 없는 이메일 검색

### 쿼리 최적화
```typescript
// 활성 사용자 조회 (소프트 딜리트 고려)
@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async findActiveByEmail(email: string): Promise<User | null> {
    return this.findOne({
      where: {
        email: email.toLowerCase(),
        deletedAt: IsNull(),
      },
    });
  }

  // 닉네임 검색 (소프트 딜리트 제외)
  async findActiveByNickname(nickname: string): Promise<User | null> {
    return this.findOne({
      where: {
        nickname,
        deletedAt: IsNull(),
      },
    });
  }
}
```

## 데이터 마이그레이션

### TypeORM Migration 파일 구조
```typescript
// Migration20250101000000CreateUsersTable.ts
export class Migration20250101000000CreateUsersTable1640995200000
  implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    // users 테이블 생성
    await queryRunner.createTable(new Table({
      name: 'users',
      columns: [
        // 컬럼 정의
      ],
      indices: [
        // 인덱스 정의
      ],
    }), true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

## 보안 고려사항

### 민감 정보 처리
1. **비밀번호**: Supabase에서 관리하므로 직접 저장하지 않음
2. **OAuth 토큰**: 필요시 암호화하여 저장
3. **개인정보**: 닉네임 외 개인정보는 최소화

### 데이터 접근 제어
- **이메일 검색**: 인증된 사용자만 가능
- **사용자 검색**: 관리자 또는 친구 관계 있는 경우만 가능
- **프로필 수정**: 본인 또는 관리자만 가능

## 감사 및 로깅

### 중요 데이터 변경 이력
- 사용자 등급 변경 (tier)
- 역할 변경 (role)
- 계정 활성화/비활성화
- 개인정보 수정

### 감사 로그 형식
```typescript
interface AuditLog {
  userId: number;
  action: string;
  tableName: 'users' | 'refresh_tokens';
  recordId: number;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  timestamp: Date;
  ipAddress: string;
}
```