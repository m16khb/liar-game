# @SPEC:AUTH-001 인수 기준

## Given-When-Then 시나리오

### 시나리오 1: 게스트 인증

**Given**: 새로운 유저가 게임에 접속한다
**When**: 닉네임을 입력하고 "게스트로 시작" 버튼을 클릭한다
**Then**:
- ✅ 임시 세션 ID가 생성된다 (UUID v4 형식)
- ✅ 게스트 JWT 토큰이 발급된다 (액세스 15분, 리프레시 7일)
- ✅ Redis에 세션이 저장된다 (TTL: 7일)
- ✅ 게임 플레이가 가능하다 (대기실 진입 성공)
- ✅ 응답 시간 <50ms (P95)

**실패 시나리오**:
- ❌ 닉네임이 2자 이하 → 400 Bad Request
- ❌ 닉네임에 특수문자 포함 → 400 Bad Request
- ❌ Redis 연결 실패 → 503 Service Unavailable

---

### 시나리오 2: 회원가입

**Given**: 게스트로 5판 이상 플레이한 유저가 회원가입을 원한다
**When**: 이메일, 비밀번호, 닉네임을 입력하고 "회원가입" 버튼을 클릭한다
**Then**:
- ✅ PostgreSQL `users` 테이블에 레코드가 생성된다
- ✅ 비밀번호가 bcrypt로 해싱된다 (saltRounds=12)
- ✅ JWT 토큰 쌍이 발급된다 (등록 유저 토큰)
- ✅ 기존 게스트 세션 ID가 `users.guest_session_id`에 매핑된다
- ✅ Redis 게스트 세션이 삭제되고 등록 유저 세션이 생성된다
- ✅ 게임 히스토리가 유지된다 (프로그레스 100% 유지)

**실패 시나리오**:
- ❌ 중복 이메일 → 409 Conflict "이미 사용 중인 이메일입니다"
- ❌ 비밀번호 8자 미만 → 400 Bad Request "비밀번호는 8자 이상이어야 합니다"
- ❌ 유효하지 않은 이메일 형식 → 400 Bad Request

---

### 시나리오 3: 로그인

**Given**: 등록된 사용자가 로그인하려 한다
**When**: 유효한 이메일과 비밀번호를 입력한다
**Then**:
- ✅ bcrypt로 비밀번호가 검증된다
- ✅ PostgreSQL에서 사용자 정보를 조회한다
- ✅ JWT 토큰 쌍이 발급된다
- ✅ Redis에 세션이 생성된다 (TTL: 30일)
- ✅ 리프레시 토큰이 PostgreSQL `refresh_tokens`에 저장된다
- ✅ 응답 시간 <100ms (P95, bcrypt 검증 포함)

**실패 시나리오**:
- ❌ 존재하지 않는 이메일 → 401 Unauthorized "이메일 또는 비밀번호가 잘못되었습니다"
- ❌ 잘못된 비밀번호 → 401 Unauthorized (동일 메시지, 보안상 이유)
- ❌ 1분에 5회 초과 로그인 시도 → 429 Too Many Requests

---

### 시나리오 4: 토큰 갱신

**Given**: 액세스 토큰이 만료된 사용자가 API를 호출한다
**When**: 클라이언트가 리프레시 토큰으로 `/api/auth/refresh`를 호출한다
**Then**:
- ✅ 리프레시 토큰의 유효성이 검증된다
- ✅ PostgreSQL에서 리프레시 토큰 존재 확인
- ✅ 새로운 액세스 토큰이 발급된다 (15분 TTL)
- ✅ 새로운 리프레시 토큰이 발급된다 (일회용, 7일 TTL)
- ✅ 기존 리프레시 토큰이 무효화된다 (PostgreSQL `refresh_tokens` 삭제)
- ✅ 응답 시간 <50ms (P95)

**실패 시나리오**:
- ❌ 만료된 리프레시 토큰 → 401 Unauthorized "토큰이 만료되었습니다"
- ❌ 이미 사용된 리프레시 토큰 → 401 Unauthorized "유효하지 않은 토큰입니다"
- ❌ 서명 불일치 → 403 Forbidden "잘못된 토큰 서명입니다"

---

### 시나리오 5: 게스트 전환

**Given**: 게스트로 10판 플레이한 유저가 데이터를 보존하고 싶다
**When**: 게스트 상태에서 "회원가입" 화면으로 이동하여 등록한다
**Then**:
- ✅ `guestSessionId`가 요청에 포함된다
- ✅ PostgreSQL `users` 테이블에 `guest_session_id` 필드가 업데이트된다
- ✅ Redis 게스트 세션 데이터가 등록 유저 세션으로 이관된다
- ✅ 게임 히스토리가 등록 유저 ID로 연결된다 (PostgreSQL `game_history` 업데이트)
- ✅ 레벨, 코인, 배지 등 모든 프로그레스가 유지된다
- ✅ 클라이언트는 새로운 JWT 토큰을 받는다 (등록 유저 토큰)

**검증 방법**:
```sql
-- PostgreSQL 확인
SELECT id, email, guest_session_id FROM users WHERE email = 'test@example.com';

-- Redis 확인
redis-cli GET session:{userId}
redis-cli GET guest:session:{guestSessionId}  -- 존재하지 않아야 함

-- 게임 히스토리 확인
SELECT COUNT(*) FROM game_history WHERE user_id = {userId};
```

---

### 시나리오 6: 로그아웃

**Given**: 로그인한 사용자가 로그아웃하려 한다
**When**: `/api/auth/logout` 엔드포인트를 호출한다
**Then**:
- ✅ Redis 세션이 삭제된다 (`session:{userId}`)
- ✅ PostgreSQL `refresh_tokens`에서 토큰이 삭제된다
- ✅ 클라이언트는 토큰을 로컬에서 삭제한다
- ✅ 후속 API 요청 시 401 Unauthorized 응답

---

### 시나리오 7: WebSocket 연결 시 인증

**Given**: 사용자가 게임 플레이를 위해 WebSocket 연결을 시도한다
**When**: Socket.IO 클라이언트가 JWT를 `auth.token`으로 전달한다
**Then**:
- ✅ 서버가 JWT를 검증한다 (만료, 서명 확인)
- ✅ 유효한 토큰 → `socket.data.user`에 사용자 정보 저장
- ✅ 유효하지 않은 토큰 → 연결 거부 (`socket.disconnect()`)
- ✅ WebSocket 메시지에 사용자 정보 첨부

**실패 시나리오**:
- ❌ 토큰 없음 → 연결 거부
- ❌ 만료된 토큰 → 연결 거부, 클라이언트는 리프레시 후 재연결

---

### 시나리오 8: 동시 세션 제한

**Given**: 사용자가 5개 디바이스에서 이미 로그인된 상태
**When**: 6번째 디바이스에서 로그인을 시도한다
**Then**:
- ✅ Redis에서 기존 세션 개수를 확인한다 (`session:{userId}:*`)
- ✅ 가장 오래된 세션을 삭제한다 (LRU 정책)
- ✅ 새 세션을 생성한다
- ✅ 삭제된 세션의 디바이스는 401 Unauthorized 수신

**검증 방법**:
```bash
# Redis 세션 개수 확인
redis-cli KEYS "session:user123:*" | wc -l  # 최대 5개
```

---

## 품질 게이트 기준

### 기능 완성도
- ✅ 게스트 인증 성공률 ≥99% (1,000회 테스트)
- ✅ 회원가입 성공률 ≥95% (유효한 입력 기준)
- ✅ 로그인 성공률 ≥95% (유효한 자격증명 기준)
- ✅ 토큰 갱신 성공률 ≥99% (유효한 리프레시 토큰 기준)
- ✅ 게스트 전환 시 프로그레스 100% 유지

### 성능 기준
- ✅ 세션 생성 응답 시간 <50ms (P95)
- ✅ JWT 검증 <10ms (P95)
- ✅ bcrypt 해싱 <200ms (P95, saltRounds=12)
- ✅ Redis 세션 조회 <10ms (P95)
- ✅ 동시 로그인 처리 1,000 req/s (부하 테스트)

### 보안 기준
- ✅ 비밀번호 평문 저장 0건 (PostgreSQL 감사)
- ✅ HTTPS 전송률 100% (프로덕션)
- ✅ JWT 액세스 토큰 TTL ≤15분
- ✅ JWT 리프레시 토큰 일회용 처리 100%
- ✅ bcrypt Salt rounds ≥12
- ✅ Rate Limiting 적용 (로그인: 1분 5회, 회원가입: 1분 3회)

### 신뢰성 기준
- ✅ Redis 가용성 ≥99.9% (Sentinel 또는 클러스터)
- ✅ PostgreSQL 가용성 ≥99.95%
- ✅ JWT 검증 실패율 <0.1% (유효한 토큰 기준)
- ✅ 세션 유실률 <0.01% (Redis 장애 시)

---

## 검증 방법 및 도구

### 단위 테스트 (Vitest)
```bash
# 모든 인증 테스트 실행
pnpm test:auth

# 커버리지 확인 (목표: 85% 이상)
pnpm test:coverage
```

**테스트 파일 구조**:
```
tests/auth/
├── guest.test.ts        # 게스트 인증
├── register.test.ts     # 회원가입
├── login.test.ts        # 로그인
├── jwt.test.ts          # JWT 토큰 갱신
└── session.test.ts      # Redis 세션 관리
```

### 통합 테스트 (Postman/Insomnia)
**시나리오 순서**:
1. POST `/api/auth/guest` → 게스트 JWT 획득
2. POST `/api/auth/register` (guestSessionId 포함) → 등록 유저 JWT 획득
3. GET `/api/auth/me` → 사용자 정보 확인
4. POST `/api/auth/logout` → 로그아웃
5. POST `/api/auth/login` → 재로그인
6. POST `/api/auth/refresh` → 토큰 갱신

### 부하 테스트 (k6)
```javascript
// k6-load-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 100, // 100명 동시 사용자
  duration: '30s',
};

export default function () {
  const loginRes = http.post('http://localhost:4000/api/auth/login', JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'status is 200': (r) => r.status === 200,
    'response time < 100ms': (r) => r.timings.duration < 100,
  });
}
```

**실행**:
```bash
k6 run k6-load-test.js
```

**목표**:
- 평균 응답 시간: <100ms
- 처리량: 1,000 req/s
- 실패율: <1%

### 보안 테스트
**1. 비밀번호 해싱 검증**:
```sql
-- PostgreSQL에서 평문 비밀번호 검색 (0건이어야 함)
SELECT * FROM users WHERE password_hash NOT LIKE '$2b$%';
```

**2. JWT 서명 검증**:
```bash
# 잘못된 시크릿으로 서명된 토큰 → 403 응답 확인
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <fake_token>"
```

**3. Rate Limiting 테스트**:
```bash
# 1분에 6회 로그인 시도 → 6번째는 429 응답
for i in {1..6}; do
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  sleep 1
done
```

---

## Definition of Done (완료 조건)

### 코드 완성도
- [ ] ✅ 모든 TDD 테스트 통과 (26개 이상)
- [ ] ✅ 테스트 커버리지 ≥85%
- [ ] ✅ ESLint 경고 0건
- [ ] ✅ TypeScript strict mode 통과
- [ ] ✅ @CODE:AUTH-001 TAG 모든 파일에 추가

### 기능 완성도
- [ ] ✅ 7개 API 엔드포인트 구현 완료
- [ ] ✅ WebSocket JWT 인증 구현
- [ ] ✅ 게스트 전환 플로우 동작
- [ ] ✅ Redis 세션 관리 동작
- [ ] ✅ PostgreSQL 데이터 영속성 확인

### 문서화
- [ ] ✅ API 문서 작성 (`docs/api/auth.md`)
- [ ] ✅ 인증 아키텍처 다이어그램 작성
- [ ] ✅ Living Document 업데이트 (`/alfred:3-sync`)
- [ ] ✅ TAG 체인 검증 완료

### 배포 준비
- [ ] ✅ 환경 변수 `.env.example` 작성
- [ ] ✅ Dockerfile 작성 (선택적)
- [ ] ✅ Kubernetes ConfigMap 작성 (선택적)
- [ ] ✅ 프로덕션 HTTPS 설정 확인

---

**작성일**: 2025-10-11
**작성자**: @Goos (via spec-builder 🏗️)
