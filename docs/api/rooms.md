# 방(Room) API 문서

## 개요

게임 로비 시스템을 위한 RESTful API로, 방 생성, 참가, 조회 기능을 제공합니다.

## 인증

- **JWT 토큰 필수**: 대부분의 엔드포인트는 인증이 필요합니다 (`@ApiBearerAuth()`)
- **역할 기반 접근 제어**: USER, ADMIN 역할만 방 생성 및 참가 가능
- **오픈 엔드포인트**: 방 목록 조회, 검색, 상세 조회는 인증 불필요

---

## 엔드포인트 요약

| 메소드 | 엔드포인트 | 인증 | 설명 |
|--------|------------|------|------|
| `GET` | `/api/rooms` | ❌ | 대기 중인 방 목록 조회 |
| `GET` | `/api/rooms/search` | ❌ | 방 제목으로 검색 |
| `GET` | `/api/rooms/:code` | ❌ | 방 코드로 상세 조회 |
| `POST` | `/api/rooms` | ✅ | 방 생성 |
| `POST` | `/api/rooms/:code/join` | ✅ | 방 참가 |

---

## 세부 엔드포인트

### 1. 방 생성

**POST** `/api/rooms`

- **인증**: 필수 (JWT Bearer Token)
- **역할**: USER, ADMIN
- **설명**: 새로운 게임 방 생성

#### 요청 바디 (CreateRoomDto)
```typescript
{
  "title": "방 제목 (1-100자)",
  "minPlayers": 4,                    // 최소 플레이어 수 (2-10)
  "maxPlayers": 8,                    // 최대 플레이어 수 (2-10)
  "difficulty": "easy",               // 게임 난이도: "easy" | "normal" | "hard"
  "isPrivate": false,                  // 비공개 방 여부
  "password": "비밀번호",              // 비공개 방 시 필수 (4-20자)
  "description": "방 설명",            // 선택 (최대 500자)
  "timeLimit": 3600,                   // 선택: 게임 시간 제한 (초)
  "gameSettings": {}                   // 선택: 게임 설정 JSON (최대 1KB)
}
```

#### 응답 (RoomResponseDto)
```typescript
{
  "id": 1,
  "code": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
  "title": "방 제목",
  "status": "waiting",
  "difficulty": "easy",
  "minPlayers": 4,
  "maxPlayers": 8,
  "currentPlayers": 0,
  "isPrivate": false,
  "timeLimit": 3600,
  "description": "방 설명",
  "gameSettings": {},
  "host": {
    "id": 1,
    "nickname": "플레이어",
    "avatar": null
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### 유효성 검사 규칙
- **제목**: 1-100자, XSS 방지 필터링 적용
- **플레이어 수**: 최소 2명, 최대 10명, 최소 ≤ 최대
- **비밀번호**: 비공개 방 시 필수, 4-20자, XSS 방지 필터링
- **설명**: 최대 500자, HTML 태그 제거
- **게임 설정**: 최대 1KB, JSON 형식, 위험한 키값 제거

#### 오류 응답
- `400 Bad Request`: 유효성 검사 실패
- `401 Unauthorized`: 인증 필요
- `403 Forbidden`: 권한 부족

---

### 2. 방 참가

**POST** `/api/rooms/:code/join`

- **인증**: 필수 (JWT Bearer Token)
- **역할**: USER, ADMIN
- **설명**: 방 코드로 게임 방에 참가

#### 경로 매개변수
- `code`: 방 코드 (32자리, 16진수)

#### 요청 바디
```typescript
{
  "password": "비밀번호"  // 비공개 방 시 필수
}
```

#### 응답 (RoomResponseDto)
방 생성 응답과 동일한 형식

#### 참가 조건
- 방 상태가 "waiting" 여야 함
- 방이 최대 인원에 도달하지 않음
- 비공개 방의 경우 비밀번호 일치
- 인증된 사용자만 참가 가능

#### 오류 응답
- `400 Bad Request`: 방 가득 참, 잘못된 비밀번호
- `401 Unauthorized`: 인증 필요
- `404 Not Found`: 존재하지 않는 방

---

### 3. 방 목록 조회

**GET** `/api/rooms`

- **인증**: 불필요
- **쿼리 파라미터**:
  - `status?: "waiting" | "playing" | "finished"` - 방 상태 필터
- **응답**: RoomResponseDto 배열
- **설명**: 대기 중인 방 목록을 반환

---

### 4. 방 검색

**GET** `/api/rooms/search`

- **인증**: 불필요
- **쿼리 파라미터**:
  - `q: string` - 검색어 (최소 2자)
- **응답**: RoomResponseDto 배열
- **설명**: 공개 방 제목으로 검색

#### 검색 규칙
- 최소 2자 이상 검색어 필요
- XSS 방지 필터링 적용
- 비공개 방은 검색 결과에 포함되지 않음

---

### 5. 방 상세 조회

**GET** `/api/rooms/:code`

- **인증**: 불필요
- **경로 매개변수**:
  - `code: string` - 방 코드
- **응답**: RoomResponseDto
- **설명**: 방 코드로 특정 방의 상세 정보 조회

---

## 보안 기능

### 1. 입력값 정제 (Sanitization)
모든 사용자 입력값에 대해 XSS 및 SQL Injection 방지 필터링 적용:

- **HTML 태그 제거**: `<script>`, `<iframe>` 등 위험한 태그 제거
- **SQL 주석/명령어 패턴 제거**: SQL 주입 방지
- **이벤트 핸들러 제거**: `onclick`, `onload` 등 제거
- **특수문자 필터링**: 허용된 문자 범위로 제한

### 2. 보안 예외 필터 (SecurityExceptionFilter)
모든 요청에 보안 예외 필터 적용:
- 에러 로깅 및 모니터링
- 보안 이벤트 추적
- 프로덕션 환경에서 오류 메시지 마스킹

### 3. 인증 및 권한 관리
- **JWT 인증**: `@UseGuards(JwtAuthGuard)`
- **역할 기반 접근 제어**: `@UseGuards(RolesGuard)` + `@Roles()`
- **퍼블릱 접근 지원**: `@Public()` 데코레이터

### 4. 데이터 검증
- **TypeORM**: SQL Injection 자동 방지
- **class-validator**: 입력값 형식 검증
- **커스텀 검증**: 플레이어 수, 비밀번호 복잡도 등

---

## 성능 요구사항

- **방 목록 로딩**: < 500ms
- **방 생성**: < 1000ms
- **방 검색**: < 300ms
- **방 상세 조회**: < 200ms

---

## 예제

### 방 생성 예제
```bash
curl -X POST "http://localhost:3000/api/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "새 게임 방",
    "minPlayers": 4,
    "maxPlayers": 6,
    "difficulty": "normal",
    "isPrivate": false,
    "description": "즐거운 게임을 위한 방입니다"
  }'
```

### 방 참가 예제
```bash
curl -X POST "http://localhost:3000/api/rooms/a1b2c3d4e5f6/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "password": "비밀번호"
  }'
```

### 방 목록 조회 예제
```bash
curl "http://localhost:3000/api/rooms?status=waiting"
```

---

## 상태 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 201 | 방 생성 성공 |
| 400 | 잘못된 요청 (유효성 검사 실패) |
| 401 | 인증 필요 |
| 403 | 권한 부족 |
| 404 | 존재하지 않는 방 |
| 500 | 내부 서버 오류 |

---

## 변경 이력

- **2024-01-16**: 보안 강화 및 새로운 join endpoint 추가
- **보안 개선**: XSS/SQL Injection 방지 필터링 적용
- **유효성 검사 강화**: 입력값 정제 및 검증 규칙 확장
- **기능 추가**: 방 참가 전용 엔드포인트 구현