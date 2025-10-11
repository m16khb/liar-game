---
id: STRUCTURE-001
version: 0.1.0
status: active
created: 2025-10-12
updated: 2025-10-12
authors: ["@project-manager"]
---

# liar-game Structure Design

## HISTORY

### v0.1.0 (2025-10-12)
- **INITIAL**: Monorepo 구조 및 완료된 SPEC 기반 시스템 아키텍처 정의
- **AUTHOR**: @project-manager
- **SCOPE**: Fullstack Monorepo, 실시간 통신, 모듈 분리
- **SOURCE**: 실제 코드베이스 + 기획서 기술 아키텍처

---

## @DOC:ARCHITECTURE-001 시스템 아키텍처

### 아키텍처 전략

**Fullstack TypeScript Monorepo with Real-time Communication**

```
liar-game/
├── apps/                      # 애플리케이션 계층
│   ├── web/                   # 프론트엔드 (Next.js 15)
│   └── api/                   # 백엔드 (NestJS 11 + Fastify)
├── packages/                  # 공유 패키지
│   ├── types/                 # TypeScript 타입 정의
│   ├── constants/             # 상수 및 설정
│   ├── ui/                    # 공통 UI 컴포넌트
│   └── config/                # 공유 설정
└── .moai/                     # MoAI-ADK 메타데이터
    ├── specs/                 # SPEC 문서
    ├── project/               # 프로젝트 문서
    └── memory/                # 개발 가이드
```

### 아키텍처 레이어

```
프레젠테이션 계층 (Next.js 15)
    ↓ HTTP/WebSocket
백엔드 계층 (NestJS 11 + Fastify)
    ↓ Query/Command
데이터 계층 (Redis + PostgreSQL)
    ↓
인프라 계층 (Kubernetes on Mac mini M4)
```

**선택 이유**:
1. **Monorepo**: 타입 안전성 공유, 일관된 의존성 관리 (pnpm workspace)
2. **Next.js 15**: SSR/CSR Hybrid로 SEO + 빠른 로딩 + 실시간 게임
3. **NestJS + Fastify**: Express 대비 2-3배 빠른 성능, WebSocket Gateway 지원
4. **TypeScript**: 전체 스택 타입 안전성, 런타임 에러 감소
5. **Redis + PostgreSQL**: Hot Data(세션, 게임 상태) + Cold Data(전적, 랭킹)

**트레이드오프**:
- ✅ 장점: 타입 안전성, 빠른 개발, 성능 최적화
- ⚠️ 단점: 초기 설정 복잡도, 빌드 시간 증가 (Turbo로 완화)

---

## @DOC:MODULES-001 모듈별 책임 구분

### 1. 인증 모듈 (✅ 구현 완료 - SPEC-AUTH-002, UI-001)

**책임**: 사용자 인증, 권한 관리, 세션 유지

**입력**:
- OAuth 인증 요청 (Google, GitHub, Discord)
- Anonymous Auth 요청
- JWT 토큰 검증 요청

**처리**:
- Supabase Auth SDK로 OAuth 플로우 처리
- JWT 자동 발급 및 갱신
- 세션 상태 관리 (쿠키 기반)
- Middleware 인증 가드

**출력**:
- 인증된 사용자 세션
- JWT Access Token (Supabase 발급)
- 사용자 프로필 정보

| 컴포넌트 | 역할 | 주요 기능 | 상태 |
|----------|------|-----------|------|
| **supabase-auth.service.ts** | OAuth 처리 | Supabase SDK 통합, JWT 검증 | ✅ 완료 |
| **supabase-jwt.guard.ts** | JWT 가드 | NestJS Guard, 인증 검증 | ✅ 완료 |
| **supabase.ts** (web) | 프론트 Auth | 클라이언트/서버 Supabase 초기화 | ✅ 완료 |
| **login/page.tsx** | 로그인 UI | OAuth 버튼, Anonymous 로그인 | ✅ 완료 |
| **middleware.ts** | 인증 가드 | 보호 경로 접근 제어 | ✅ 완료 |
| **auth/callback/route.ts** | OAuth 콜백 | 인증 코드 교환 | ✅ 완료 |

**파일 위치**:
- Backend: `apps/api/src/auth/`
- Frontend: `apps/web/src/lib/supabase.ts`, `apps/web/src/app/login/`, `apps/web/src/middleware.ts`
- Types: `packages/types/src/supabase-auth.ts`

---

### 2. 방 생성/관리 모듈 (⏳ TODO - SPEC-ROOM-001)

**책임**: 게임 방 생성, 참여, 설정 관리

**입력**:
- 방 생성 요청 (커스텀 설정)
- 방 참여 요청 (코드, URL, QR)
- 빠른 매칭 요청

**처리**:
- 6자리 고유 코드 생성 (ABC123)
- URL/QR 코드 생성
- 방 설정 저장 (Redis)
- 플레이어 입장/퇴장 관리

**출력**:
- 방 정보 (코드, 참여자 수, 설정)
- 공유 URL/QR 이미지
- 실시간 방 상태 업데이트

| 컴포넌트 | 역할 | 주요 기능 | 우선순위 |
|----------|------|-----------|----------|
| **room.service.ts** | 방 로직 | 생성/삭제/설정 | P0 |
| **room.gateway.ts** | 실시간 동기화 | WebSocket 방 이벤트 | P0 |
| **room-list/page.tsx** | 방 목록 UI | 공개 방 조회, 빠른 매칭 | P0 |
| **room/[id]/page.tsx** | 대기실 UI | 플레이어 목록, 준비 상태 | P0 |

**기획서 참조**: FR-001, FR-002

---

### 3. 실시간 게임 로직 모듈 (⏳ TODO - SPEC-GAME-001)

**책임**: 게임 룰 적용, 상태 동기화, 승패 판정

**입력**:
- 게임 시작 요청
- 플레이어 액션 (발언, 투표, 제시어 추측)
- 타이머 이벤트

**처리**:
- 역할 배정 (시민, 라이어)
- 토론/투표 페이즈 전환
- 득점 계산
- 게임 상태 Redis 저장

**출력**:
- 실시간 게임 상태 (Socket.IO 브로드캐스트)
- 라운드 결과
- 최종 승패 및 점수

| 컴포넌트 | 역할 | 주요 기능 | 우선순위 |
|----------|------|-----------|----------|
| **game.service.ts** | 게임 로직 | 역할 배정, 득점 계산 | P0 |
| **game.gateway.ts** | 실시간 동기화 | WebSocket 게임 이벤트 | P0 |
| **game-state.redis.ts** | 상태 저장 | Redis 게임 세션 관리 | P0 |
| **game/[roomId]/page.tsx** | 게임 화면 UI | 타이머, 플레이어 목록, 제시어 | P0 |

**기획서 참조**: 섹션 4.1-4.3 (게임 룰, 플로우, 득점)

---

### 4. 실시간 채팅/음성 모듈 (⏳ TODO - SPEC-CHAT-001, VOICE-001)

**책임**: 텍스트 채팅, 음성 채팅, 이모티콘

**입력**:
- 채팅 메시지
- 음성 스트림 (WebRTC)
- 이모티콘 선택

**처리**:
- 욕설 필터링 (한국어, 영어)
- Socket.IO 채팅 브로드캐스트
- WebRTC P2P 음성 연결 (STUN/TURN)
- 발언자 표시 (음성 활성화 감지)

**출력**:
- 실시간 채팅 로그
- 음성 스트림 (P2P)
- 이모티콘 애니메이션

| 컴포넌트 | 역할 | 주요 기능 | 우선순위 |
|----------|------|-----------|----------|
| **chat.service.ts** | 채팅 로직 | 욕설 필터링, 이모티콘 | P0 |
| **chat.gateway.ts** | 실시간 채팅 | Socket.IO 브로드캐스트 | P0 |
| **voice.service.ts** | 음성 관리 | WebRTC 시그널링, TURN | P1 |
| **ChatBox.tsx** | 채팅 UI | 메시지 표시, 입력창 | P0 |
| **VoiceChat.tsx** | 음성 UI | 음성 On/Off, 발언자 표시 | P1 |

**기획서 참조**: FR-003 (텍스트), FR-004 (음성)

---

### 5. 사용자 프로필/전적 모듈 (⏳ TODO - SPEC-PROFILE-001)

**책임**: 사용자 정보, 통계, 레벨 시스템

**입력**:
- OAuth 프로필 정보
- 게임 결과 데이터
- 레벨업 조건

**처리**:
- PostgreSQL 프로필 CRUD
- 경험치 계산, 레벨 업데이트
- 승률, MVP 횟수 집계
- 배지 및 업적 체크

**출력**:
- 사용자 프로필 페이지
- 전적 통계 (역할별 승률)
- 레벨 및 배지

| 컴포넌트 | 역할 | 주요 기능 | 우선순위 |
|----------|------|-----------|----------|
| **profile.service.ts** | 프로필 로직 | CRUD, 레벨 계산 | P1 |
| **statistics.service.ts** | 통계 집계 | 승률, 플레이 타임 | P1 |
| **profile/[id]/page.tsx** | 프로필 UI | 레벨, 통계, 배지 | P1 |

**기획서 참조**: FR-005

---

### 6. 랭킹 시스템 모듈 (⏳ TODO - SPEC-RANK-001)

**책임**: 글로벌 랭킹, 시즌 시스템, 티어 관리

**입력**:
- 랭크 게임 결과
- 시즌 초기화 이벤트

**처리**:
- Redis Sorted Set으로 리더보드 관리
- MMR(MatchMaking Rating) 계산
- 티어 승급/강등 판정
- 시즌별 데이터 분리

**출력**:
- 글로벌/친구 리더보드
- 사용자 티어 (브론즈~마스터)
- 시즌 보상

| 컴포넌트 | 역할 | 주요 기능 | 우선순위 |
|----------|------|-----------|----------|
| **ranking.service.ts** | 랭킹 로직 | MMR 계산, 티어 관리 | P1 |
| **leaderboard.redis.ts** | 리더보드 | Redis Sorted Set 관리 | P1 |
| **ranking/page.tsx** | 랭킹 UI | 글로벌/친구 리더보드 | P1 |

**기획서 참조**: FR-006

---

## @DOC:INTEGRATION-001 외부 시스템 통합

### Supabase Auth 연동 (✅ 완료)

- **인증 방식**: OAuth 2.0 (Google, GitHub, Discord)
- **데이터 교환**: Supabase SDK (REST API)
- **장애 시 대체**: 다른 OAuth 프로바이더 제안, Anonymous Auth
- **위험도**: Low (Supabase SLA 99.9%, 다중 프로바이더)

**설정**:
```typescript
// apps/web/src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

---

### Redis (세션/캐시) (✅ 설정 완료 - SPEC-INFRA-001)

- **용도**:
  - 게임 세션 상태 저장 (Hot Data)
  - 리더보드 (Sorted Set)
  - 매칭 큐 (List)
- **의존성 수준**: High (게임 중 필수)
- **성능 요구사항**: 레이턴시 <10ms, 99.9% 가용성

**데이터 구조**:
```
game:session:{roomId}       → Hash (게임 상태)
player:{userId}:status      → String (온라인/오프라인)
leaderboard:global          → Sorted Set (랭킹)
matchmaking:queue           → List (매칭 대기)
```

---

### PostgreSQL (영구 데이터) (✅ 설정 완료 - SPEC-INFRA-001)

- **용도**:
  - 사용자 프로필 (Supabase auth.users 연동)
  - 게임 히스토리
  - 랭킹 (시즌별)
- **의존성 수준**: Medium (게임 중 필수 아님)
- **성능 요구사항**: 응답 시간 <100ms

**주요 테이블**:
```sql
-- Supabase 제공
auth.users (id, email, created_at)

-- 커스텀 테이블
public.profiles (id, username, level, oauth_provider)
public.game_history (id, room_id, players, result)
public.rankings (user_id, season, rating_points, tier)
```

---

### Socket.IO (실시간 통신) (⏳ TODO)

- **용도**: 게임 상태 동기화, 채팅
- **프로토콜**: WebSocket (Fallback: Long Polling)
- **장애 시 대체**: 자동 재연결, 에러 메시지 표시
- **위험도**: Medium (연결 끊김 시 게임 중단)

**이벤트 설계**:
```typescript
// Client → Server
joinRoom, leaveRoom, chat, vote, guessKeyword

// Server → Client
playerJoined, gameStart, roleAssigned, turnChange, voteResult, gameEnd
```

---

### WebRTC (음성 채팅) (⏳ TODO)

- **용도**: P2P 음성 통신
- **프로토콜**: WebRTC (Opus 코덱, 32kbps)
- **장애 시 대체**: TURN 서버 중계, 텍스트 채팅
- **위험도**: Low (음성은 선택적 기능)

**STUN/TURN 서버**:
- STUN: 공용 IP 확인 (Google STUN)
- TURN: NAT 통과 실패 시 중계 (coturn 자체 호스팅)

---

## @DOC:TRACEABILITY-001 추적성 전략

### TAG 체계 적용

**TDD 완벽 정렬**: SPEC → 테스트 → 구현 → 문서
- `@SPEC:ID` (.moai/specs/) → `@TEST:ID` (tests/) → `@CODE:ID` (src/) → `@DOC:ID` (docs/)

**구현 세부사항**: @CODE:ID 내부 주석 레벨
- `@CODE:ID:API` - REST API, GraphQL 엔드포인트
- `@CODE:ID:UI` - 컴포넌트, 뷰, 화면
- `@CODE:ID:DATA` - 데이터 모델, 스키마, 타입
- `@CODE:ID:DOMAIN` - 비즈니스 로직, 도메인 규칙
- `@CODE:ID:INFRA` - 인프라, 데이터베이스, 외부 연동

### TAG 추적성 관리 (CODE-FIRST 방식)

- **검증 방법**: `/alfred:3-sync` 실행 시 `rg '@(SPEC|TEST|CODE|DOC):' -n`으로 코드 전체 스캔
- **추적 범위**: 프로젝트 전체 소스코드 (.moai/specs/, tests/, src/, docs/)
- **유지 주기**: 코드 변경 시점마다 실시간 검증
- **CODE-FIRST 원칙**: TAG의 진실은 코드 자체에만 존재 (중간 캐시 없음)

### 완료된 TAG 체인 예시

**AUTH-002 TAG 체인** (✅ 완료):
```
@SPEC:AUTH-002 (spec.md)
    ↓
@TEST:AUTH-002
    ├─ tests/auth/supabase-oauth.test.ts
    ├─ tests/auth/anonymous.test.ts
    ├─ tests/auth/jwt-validation.test.ts
    └─ tests/auth/profile-sync.test.ts
    ↓
@CODE:AUTH-002
    ├─ apps/api/src/auth/supabase-auth.service.ts
    ├─ apps/api/src/auth/supabase-jwt.guard.ts
    ├─ apps/web/src/lib/supabase.ts
    ├─ apps/web/src/app/login/page.tsx
    └─ apps/web/src/app/auth/callback/route.ts
```

---

## Legacy Context

### 기존 시스템 현황

**현재 프로젝트 상태** (2025-10-12 기준):

```
liar-game/
├── apps/
│   ├── web/                   # ✅ Next.js 15 설정 완료
│   │   ├── src/app/
│   │   │   ├── page.tsx       # ✅ 메인 페이지 (리다이렉트)
│   │   │   ├── login/         # ✅ 로그인 페이지 (OAuth)
│   │   │   ├── auth/callback/ # ✅ OAuth 콜백
│   │   │   └── game/          # ✅ 게임 페이지 (빈 템플릿)
│   │   ├── middleware.ts      # ✅ 인증 가드
│   │   └── lib/supabase.ts    # ✅ Supabase 클라이언트
│   └── api/                   # ✅ NestJS 11 설정 완료
│       └── src/auth/          # ✅ Supabase Auth 통합
├── packages/                  # ✅ 공유 패키지
│   ├── types/                 # ✅ TypeScript 타입
│   ├── constants/             # ✅ 상수
│   ├── ui/                    # ⏳ 공통 UI (TODO)
│   └── config/                # ✅ 설정
└── .moai/                     # ✅ MoAI-ADK 메타
    ├── specs/                 # ✅ 5개 SPEC 작성
    │   ├── SPEC-AUTH-002/     # ✅ 완료
    │   ├── SPEC-UI-001/       # ✅ 작성
    │   └── ...
    └── project/               # ✅ 프로젝트 문서
```

### 마이그레이션 고려사항

1. **기획서 → 실제 구현 차이점**
   - 기획서: "URL만으로 즉시 플레이"
   - 실제: OAuth 소셜 로그인 우선
   - 계획: Anonymous Auth 강화 (SPEC-AUTH-GUEST-001)

2. **기술 스택 일치**
   - ✅ Next.js 15, NestJS 11, Fastify 모두 기획서대로 채택
   - ✅ Supabase Auth로 JWT 시스템 간소화
   - ⏳ WebRTC 음성 채팅 미구현 (P1 우선순위)

3. **인프라 전환**
   - 기획서: Kubernetes on Mac mini M4
   - 현재: 로컬 개발 환경
   - 계획: Docker + K3s 배포 (SPEC-DEPLOY-001)

---

## TODO:STRUCTURE-001 구조 개선 계획

### 단기 (1개월)

1. **모듈 간 인터페이스 정의**
   - 공유 타입 정의 강화 (packages/types)
   - NestJS DTO 및 Validation 추가
   - Next.js API Routes 최소화 (NestJS 위임)

2. **의존성 관리 전략**
   - Turbo 원격 캐시 설정 (빌드 시간 단축)
   - pnpm dedupe 주기적 실행
   - 보안 취약점 자동 스캔 (Snyk)

3. **확장성 확보 방안**
   - Redis 클러스터 샤딩 계획
   - NestJS Microservices 전환 검토
   - CDN 도입 (정적 리소스)

### 중기 (3개월)

4. **성능 최적화**
   - Next.js ISR (Incremental Static Regeneration)
   - Database 인덱싱 최적화
   - Redis 캐싱 전략 고도화

5. **모니터링 강화**
   - Prometheus + Grafana 통합
   - 에러 추적 (Sentry)
   - 실시간 알림 (Slack/Discord)

6. **테스트 커버리지 확대**
   - 목표: 85% 이상
   - E2E 테스트 (Playwright)
   - 부하 테스트 (k6)

---

## EARS 아키텍처 요구사항 작성법

### 구조 설계에서의 EARS 활용

아키텍처와 모듈 설계 시 EARS 구문을 활용하여 명확한 요구사항을 정의하세요:

#### 시스템 아키텍처 EARS 예시
```markdown
### Ubiquitous Requirements (아키텍처 기본 요구사항)
- 시스템은 Monorepo 구조를 채택해야 한다
- 시스템은 모듈 간 타입 안전성을 보장해야 한다

### Event-driven Requirements (이벤트 기반 구조)
- WHEN 게임 상태 변경이 발생하면, 시스템은 Socket.IO로 모든 플레이어에게 브로드캐스트해야 한다
- WHEN 외부 API 호출이 실패하면, 시스템은 fallback 로직을 실행해야 한다

### State-driven Requirements (상태 기반 구조)
- WHILE 게임이 진행 중일 때, 시스템은 Redis에 게임 상태를 저장해야 한다
- WHILE 개발 모드일 때, 시스템은 hot-reload를 제공해야 한다

### Optional Features (선택적 구조)
- WHERE 고성능이 요구되면, 시스템은 Redis 캐싱을 적용할 수 있다
- WHERE Kubernetes 환경이면, 시스템은 HPA로 자동 확장할 수 있다

### Constraints (구조적 제약사항)
- IF 보안 레벨이 높으면, 시스템은 모든 모듈 간 통신을 암호화해야 한다
- 각 모듈의 복잡도는 15를 초과하지 않아야 한다
- API 응답 시간은 100ms를 초과하지 않아야 한다
```

---

_이 구조는 `/alfred:2-build` 실행 시 TDD 구현의 가이드라인이 됩니다._
