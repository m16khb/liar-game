---
name: nestjs-test-specialist
description: NestJS 단위 테스트 전문가. Service, Controller, Gateway 계층의 테스트 코드를 작성하고 개선합니다.
---

# NestJS Test Specialist Skill

## 목적
liar-game 프로젝트의 NestJS 애플리케이션에 대한 전문적인 단위 테스트를 작성하고 기존 테스트를 개선합니다.

## 사용 시기
- 새로운 Service/Controller/Gateway 구현 후 테스트 작성 시
- 기존 테스트 코드의 품질 개선이 필요한 시점
- 테스트 커버리지 85% 목표 달성 시
- Jest와 ts-jest 설정 최적화 시

## 테스트 계층별 가이드

### 1. Service Layer 테스트
```typescript
// 테스트 패턴: RED → GREEN → REFACTOR
describe('AuthService', () => {
  let service: AuthService;
  let mockRepository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockRepository }
      ]
    }).compile();

    service = module.get(AuthService);
  });

  it('유효한 자격증명 시 JWT 토큰 반환', async () => {
    // 🔴 RED: 실패하는 테스트
    // 🟢 GREEN: 최소한의 통과 코드
    // ♻️ REFACTOR: 코드 품질 개선
  });
});
```

### 2. Controller Layer 테스트 (Fastify)
```typescript
describe('AuthController', () => {
  let controller: AuthController;
  let mockService: jest.Mocked<AuthService>;

  it('POST /auth/login - JWT 반환', async () => {
    const mockReply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn()
    } as any;

    await controller.login(mockLoginDto, mockReply);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({ access_token: expect.any(String) })
    );
  });
});
```

### 3. Gateway Layer 테스트
```typescript
describe('RoomGateway', () => {
  let gateway: RoomGateway;
  let mockService: jest.Mocked<RoomService>;

  it('handleJoinRoom - 방 참가 처리', async () => {
    const mockClient = {
      join: jest.fn(),
      emit: jest.fn()
    } as any;

    await gateway.handleJoinRoom(mockClient, { roomCode: 'ABC123' });
    expect(mockClient.join).toHaveBeenCalledWith('ABC123');
  });
});
```

## 모킹 전략

### Repository 모킹
```typescript
const mockUserRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
} as jest.Mocked<Repository<User>>;
```

### 외부 서비스 모킹
```typescript
const mockSupabaseService = {
  authenticate: jest.fn(),
  getUser: jest.fn(),
  refreshToken: jest.fn(),
} as jest.Mocked<SupabaseService>;
```

### Redis 모킹
```typescript
const mockRedisSessionService = {
  setSession: jest.fn(),
  getSession: jest.fn(),
  deleteSession: jest.fn(),
} as jest.Mocked<RedisSessionService>;
```

## 테스트 데이터 관리

### Test Fixtures
```typescript
export const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  supabaseId: 'supabase-123',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockGameRoom: GameRoom = {
  id: 1,
  roomCode: 'ABC123',
  status: RoomStatus.WAITING,
  maxPlayers: 6,
  currentPlayers: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

## 커버리지 최적화

### 커버리지 목표
- **Service Layer**: 90% 이상
- **Controller Layer**: 85% 이상
- **Gateway Layer**: 80% 이상
- **전체 평균**: 85% 이상

### 엣지 케이스 테스트
- 예외 상황 처리 (error handling)
- 경계값 테스트 (boundary values)
- null/undefined 입력 처리
- 비동기 작업 타임아웃

## Jest 설정 최적화
```json
{
  "testEnvironment": "node",
  "preset": "ts-jest",
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/main.ts"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 85,
      "lines": 85,
      "statements": 85
    }
  }
}
```

## 출력 형식
- **테스트 코드**: 완전한 테스트 구현
- **모킹 설정**: 필요한 모든 모크 객체
- **커버리지 리포트**: 현재 커버리지 및 개선안
- **리팩토링 제언**: 코드 품질 개선 제안