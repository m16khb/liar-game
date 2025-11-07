---

description: "Task list template for feature implementation"
---

# Tasks: 프로젝트 기초 생성

**Input**: Design documents from `/specs/001-project-foundation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **모노레포**: `apps/web/src/`, `apps/api/src/`, `packages/*/src/`
- **프론트엔드**: `apps/web/src/`, `apps/web/tests/`
- **백엔드**: `apps/api/src/`, `apps/api/test/`
- **공유 패키지**: `packages/types/src/`, `packages/ui/src/`, `packages/constants/src/`
- Paths shown below assume monorepo structure - adjust based on plan.md structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 모노레포 구조 생성 (Turborepo + pnpm 워크스페이스)
- [ ] T002 TypeScript 프로젝트 초기화 (React 18 + Compiler, NestJS 11 + Fastify)
- [ ] T003 [P] ESLint, Prettier, TypeScript 및 SOLID 원칙 기반 코드 품질 규칙 구성

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 MySQL v8 LTS 스키마 및 TypeORM 마이그레이션 설정 (Auto Increment Unsigned Integer ID)
- [ ] T005 [P] Supabase Auth 인증 프레임워크 구현 (OAuth + Email, Auth Hooks 제외)
- [ ] T006 [P] NestJS API 라우팅 및 Fastify 미들웨어 구조 설정
- [ ] T007 [P] 공유 엔티티 타입 정의 (packages/types/src/)
- [ ] T008 Redis v8 LTS 세션 관리 및 Promtail+Loki+Grafana 로깅 설정
- [ ] T009 dayjs 기반 시간대 처리 설정 (UTC/KST) 및 환경 설정 관리

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 기본 프로젝트 구조 생성 (Priority: P1) 🎯 MVP

**Goal**: 헌법 기반 기술 스택으로 최소한의 프로젝트 기초 구조 생성

**Independent Test**: 프로젝트 생성 후 개발 서버 실행(pnpm turbo dev)이 정상적으로 동작하고, 브라우저에서 프론트엔드(localhost:3000)와 API(localhost:4000)가 모두 접속 가능한지 확인

### Implementation for User Story 1

- [ ] T010 [P] [US1] User 타입 정의 in packages/types/src/index.ts
- [ ] T011 [P] [US1] User 엔티티 생성 in apps/api/src/auth/entities/user.entity.ts
- [ ] T012 [US1] UserRepository 인터페이스 정의 in apps/api/src/auth/interfaces/user-repository.interface.ts
- [ ] T013 [US1] UserRepository 구현 in apps/api/src/auth/repositories/user.repository.ts
- [ ] T014 [US1] UserService 서비스 구현 in apps/api/src/auth/services/user.service.ts
- [ ] T015 [US1] UserController API 엔드포인트 구현 in apps/api/src/auth/auth.controller.ts
- [ ] T016 [US1] AuthModule 모듈 설정 in apps/api/src/auth/auth.module.ts
- [ ] T017 [P] [US1] React 기본 앱 컴포넌트 구현 in apps/web/src/App.tsx
- [ ] T018 [P] [US1] Vite 설정 파일 생성 in apps/web/vite.config.ts
- [ ] T019 [US1] 환경 변수 설정 파일 생성 in apps/api/.env
- [ ] T020 [US1] 데이터베이스 연결 설정 in apps/api/src/config/database.config.ts
- [ ] T021 [US1] 최소 구현 원칙 준수 - 불필요한 추상화 계층 제거
- [ ] T022 [US1] 핵심 비즈니스 로직에 상세한 한글 주석 작성

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 인증 시스템 기반 구현 (Priority: P1)

**Goal**: Supabase Auth를 중심으로 최소한의 인증 기능 구현 (OAuth + Email)

**Independent Test**: Supabase 콘솔에서 OAuth 프로바이더 설정 후, 브라우저에서 Google/GitHub/Discord 로그인과 이메일 로그인이 각각 독립적으로 동작하는지 확인

### Implementation for User Story 2

- [ ] T023 [P] [US2] Supabase 클라이언트 설정 in apps/web/src/lib/supabase.ts
- [ ] T024 [P] [US2] Supabase Auth Provider 설정 in apps/web/src/components/AuthProvider.tsx
- [ ] T025 [P] [US2] 로그인 컴포넌트 구현 in apps/web/src/components/Login.tsx
- [ ] T026 [P] [US2] 소셜 로그인 버튼 컴포넌트 구현 in apps/web/src/components/SocialLogin.tsx
- [ ] T027 [P] [US2] 로그아웃 기능 구현 in apps/web/src/components/Logout.tsx
- [ ] T028 [P] [US2] 인증 관련 타입 정의 in packages/types/src/auth.types.ts
- [ ] T029 [P] [US2] JWT 미들웨어 구현 in apps/api/src/auth/middleware/jwt.middleware.ts
- [ ] T030 [P] [US2] Supabase 서비스 구현 in apps/api/src/auth/services/supabase.service.ts
- [ ] T031 [P] [US2] OAuth 콜백엔트 핸들러 구현 in apps/api/src/auth/controllers/oauth.controller.ts
- [ ] T032 [US2] 인증 상태 관리 Hook 구현 in apps/web/src/hooks/useAuth.ts
- [ ] T033 [US2] 최소 구현 원칙 준수 - 복잡한 Auth Hooks 기능 제외

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - 게임 방 기능 최소 구현 (Priority: P2)

**Goal**: 실시간 멀티플레이어 게임의 핵심인 방 생성과 관리 기능 최소 구현

**Independent Test**: 방 생성, 입장, 퇴장 기능이 WebSocket을 통해 정상적으로 동작하는지 확인 (브라우저 개발자 도구의 Network 탭에서 Socket.IO 메시지 확인)

### Implementation for User Story 3

- [ ] T034 [P] [US3] GameRoom 타입 정의 in packages/types/src/game.types.ts
- [ ] T035 [P] [US3] RoomPlayer 타입 정의 in packages/types/src/game.types.ts
- [ ] T036 [P] [US3] Socket.IO 이벤트 타입 정의 in packages/types/src/socket.types.ts
- [ ] T037 [P] [US3] GameRoom 엔티티 생성 in apps/api/src/room/entities/game-room.entity.ts
- [ ] T038 [P] [US3] RoomPlayer 엔티티 생성 in apps/api/src/room/entities/room-player.entity.ts
- [ ] T039 [P] [US3] 방 코드 생성기 구현 in apps/api/src/room/utils/room-code.generator.ts
- [ ] T040 [P] [US3] RoomRepository 인터페이스 정의 in apps/api/src/room/interfaces/room-repository.interface.ts
- [ ] T041 [P] [US3] RoomRepository 구현 in apps/api/src/room/repositories/room.repository.ts
- [ ] T042 [P] [US3] RoomService 서비스 구현 in apps/api/src/room/services/room.service.ts
- [ ] T043 [P] [US3] RoomController API 엔드포인트 구현 in apps/api/src/room/room.controller.ts
- [ ] T044 [P] [US3] RoomGateway WebSocket 게이트웨이 구현 in apps/api/src/room/room.gateway.ts
- [ ] T045 [P] [US3] 방 목록 컴포넌트 구현 in apps/web/src/components/RoomList.tsx
- [ ] T046 [P] [US3] 방 생성 컴포넌트 구현 in apps/web/src/components/CreateRoom.tsx
- [ ] T047 [P] [US3] 방 입장 컴포넌트 구현 in apps/web/src/components/JoinRoom.tsx
- [ ] T048 [P] [US3] 게임 방 관리 Hook 구현 in apps/web/src/hooks/useRoom.ts
- [ ] T049 [P] [US3] 최소 구현 원칙 준수 - 복잡한 게임 로직 제외

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T050 [P] 공유 React 컴포넌트 개발 in packages/ui/src/
- [ ] T051 [P] 게임 상수 정의 in packages/constants/src/
- [ ] T052 [P] TypeScript 공유 설정 업데이트 in packages/config/src/
- [ ] T053 Kubernetes 배포 설정 in k8s/
- [ ] T054 [P] Docker 설정 파일 생성 in Dockerfile
- [ ] T055 [P] README.md 작성 (quickstart.md 기반)
- [ ] T056 코드 품질 검증 - SOLID 원칙 준수 여부 확인
- [ ] T057 [P] 성능 최적화 - API 응답시간 <50ms, WebSocket 지연시간 <10ms
- [ ] T058 [P] 보안 강화 - SQL Injection 방어, 입력값 검증
- [ ] T059 quickstart.md 가이드 검증 및 실행 테스트

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task: "User 타입 정의 in packages/types/src/index.ts"
Task: "User 엔티티 생성 in apps/api/src/auth/entities/user.entity.ts"

# Launch all React components for User Story 1 together:
Task: "React 기본 앱 컴포넌트 구현 in apps/web/src/App.tsx"
Task: "Vite 설정 파일 생성 in apps/web/vite.config.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- YAGNI 원칙 엄격 준수 - 명시적으로 요구된 기능만 구현
- SOLID 원칙 준수 - 단일 책임, 개방/폐쇄, 리스코프 치환, 인터페이스 분리, 의존성 역전
- 한글 주석 작성 - 핵심 비즈니스 로직과 복잡한 알고리즘에 상세한 설명