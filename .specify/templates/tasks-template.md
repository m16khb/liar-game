---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
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

<!-- 
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.
  
  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/
  
  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment
  
  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 모노레포 구조 생성 (Turborepo + pnpm 워크스페이스)
- [ ] T002 TypeScript 프로젝트 초기화 (React 18 + Compiler, NestJS 11 + Fastify)
- [ ] T003 [P] ESLint, Prettier, TypeScript 및 SOLID 원칙 기반 코드 품질 규칙 구성

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 MySQL 스키마 및 TypeORM 마이그레이션 설정 (헌법 제XI원칙: TypeORM 마이그레이션 관리 원칙 준수)
- [ ] T005 [P] Supabase Auth 인증 프레임워크 구현 (OAuth + Email)
- [ ] T006 [P] NestJS API 라우팅 및 Fastify 미들웨어 구조 설정
- [ ] T007 공유 엔티티 모델 생성 (packages/types/src/)
- [ ] T008 Redis v8 LTS 세션 관리 및 Promtail+Loki+Grafana 로깅 설정
- [ ] T009 dayjs 기반 시간대 처리 설정 (UTC/KST) 및 환경 설정 관리

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] 단위 테스트 for [service] in apps/api/test/**/*.test.ts
- [ ] T011 [P] [US1] 컴포넌트 테스트 for [component] in apps/web/tests/**/*.test.tsx

### Implementation for User Story 1

- [ ] T012 [P] [US1] [Entity] 타입 정의 in packages/types/src/
- [ ] T013 [P] [US1] [Entity] 엔티티 생성 in apps/api/src/auth/entities/
- [ ] T014 [US1] [Service] 서비스 구현 in apps/api/src/ (depends on T012, T013)
- [ ] T015 [US1] [Controller] API 엔드포인트 구현 in apps/api/src/
- [ ] T016 [US1] [Component] React 컴포넌트 구현 in apps/web/src/components/
- [ ] T017 [US1] DTO 유효성 검증 및 에러 핸들링 추가 (최소 구현 원칙 준수)
- [ ] T018 [US1] 핵심 비즈니스 로직에 상세한 한글 주석 작성
- [ ] T019 [US1] 기술 구현 시 참조한 공식 문서 URL을 주석에 명시 (공식 문서 참조 원칙)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T018 [P] [US2] 단위 테스트 for [service] in apps/api/test/**/*.test.ts
- [ ] T019 [P] [US2] 컴포넌트 테스트 for [component] in apps/web/tests/**/*.test.tsx

### Implementation for User Story 2

- [ ] T020 [P] [US2] [Entity] 타입 정의 in packages/types/src/
- [ ] T021 [US2] [Service] 서비스 구현 in apps/api/src/
- [ ] T022 [US2] [Gateway] WebSocket 게이트웨이 구현 in apps/api/src/
- [ ] T023 [US2] User Story 1 컴포넌트와 통합 (필요시)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T024 [P] [US3] 단위 테스트 for [game logic] in apps/api/test/**/*.test.ts
- [ ] T025 [P] [US3] WebSocket 시나리오 테스트 in apps/api/test/**/*.test.ts

### Implementation for User Story 3

- [ ] T026 [P] [US3] [Game] 게임 로직 엔티티 정의 in packages/types/src/
- [ ] T027 [US3] [GameService] 게임 서비스 구현 in apps/api/src/game/
- [ ] T028 [US3] [RoomService] 방 관리 서비스 구현 in apps/api/src/room/

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Additional unit tests (if requested) in tests/unit/
- [ ] TXXX Security hardening
- [ ] TXXX Run quickstart.md validation

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

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Contract test for [endpoint] in tests/contract/test_[name].py"
Task: "Integration test for [user journey] in tests/integration/test_[name].py"

# Launch all models for User Story 1 together:
Task: "Create [Entity1] model in src/models/[entity1].py"
Task: "Create [Entity2] model in src/models/[entity2].py"
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
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
