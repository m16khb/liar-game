---

description: "Task list for Supabase Authentication System Analysis implementation"
---

# Tasks: Supabase Authentication System Analysis

**Input**: Design documents from `/specs/001-supabase-auth/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - only included for core authentication flows to ensure reliability

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **모노레포**: `apps/web/src/`, `apps/api/src/`, `packages/*/src/`
- **프론트엔드**: `apps/web/src/`, `apps/web/tests/`
- **백엔드**: `apps/api/src/`, `apps/api/test/`
- **공유 패키지**: `packages/types/src/`, `packages/ui/src/`, `packages/constants/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 모노레포 구조 검증 및 Turborepo 워크스페이스 설정 확인
- [ ] T002 [P] TypeScript 5.7.x 프로젝트 설정 검증 (React 18 + Compiler, NestJS 11 + Fastify)
- [ ] T003 [P] ESLint, Prettier, TypeScript 및 SOLID 원칙 기반 코드 품질 규칙 구성

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 MySQL v8 LTS 연결 설정 및 TypeORM 구성 (외키 제약 조건 없음)
- [ ] T005 Redis v8 LTS 연결 설정 및 세션 관리 기반 구성
- [ ] T006 Supabase Auth 서비스 설정 및 OAuth 클라이언트 구성 (Google, GitHub, Discord)
- [ ] T007 [P] NestJS Fastify 기본 미들웨어 및 예외 핸들러 설정
- [ ] T008 [P] 공유 타입 패키지 설정 (packages/types/src/index.ts)
- [ ] T009 [P] JWT 미들웨어 및 인증 가드 구현 (apps/api/src/auth/guards/)
- [ ] T010 dayjs 기반 시간대 처리 설정 (UTC/KST 변환)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 이메일 가입 및 로그인 (Priority: P1) 🎯 MVP

**Goal**: 이메일과 비밀번호를 사용한 계정 생성 및 로그인 기능 제공

**Independent Test**: 이메일 가입/로그인 전체 흐름 테스트 - 계정 생성 후 즉시 로그인 가능한지 확인

### Tests for User Story 1 (Core Authentication)

- [ ] T011 [P] [US1] AuthController 단위 테스트 작성 (apps/api/test/auth/auth.controller.test.ts)
- [ ] T012 [P] [US1] UserService 단위 테스트 작성 (apps/api/test/auth/user.service.test.ts)
- [ ] T013 [P] [US1] JWT 전략 단위 테스트 작성 (apps/api/test/auth/strategies/supabase-jwt.strategy.test.ts)

### Implementation for User Story 1

- [ ] T014 [P] [US1] User 타입 정의 in packages/types/src/auth/index.ts
- [ ] T015 [P] [US1] User 엔티티 생성 in apps/api/src/auth/entities/user.entity.ts
- [ ] T016 [P] [US1] User 리포지토리 생성 in apps/api/src/auth/repositories/user.repository.ts
- [ ] T017 [US1] Auth 서비스 구현 (이메일 로그인/가입) in apps/api/src/auth/services/auth.service.ts
- [ ] T018 [US1] Auth 컨트롤러 구현 (/auth/login, /auth/signup) in apps/api/src/auth/controllers/auth.controller.ts
- [ ] T019 [P] [US1] 로그인/가입 DTO 생성 in apps/api/src/auth/dto/
- [ ] T020 [US1] Supabase 클라이언트 설정 in apps/web/src/lib/supabase.ts
- [ ] T021 [P] [US1] 로그인 폼 컴포넌트 in apps/web/src/components/auth/LoginForm.tsx
- [ ] T022 [P] [US1] 가입 폼 컴포넌트 in apps/web/src/components/auth/SignupForm.tsx
- [ ] T023 [US1] 인증 관련 훅 구현 in apps/web/src/hooks/useAuth.ts
- [ ] T024 [US1] JWT 토큰 관리 유틸리티 in apps/web/src/lib/token.ts

**Checkpoint**: User Story 1 완료 - 이메일 인증 기능 독립적으로 테스트 가능

---

## Phase 4: User Story 2 - 소셜 로그인 (OAuth) (Priority: P1)

**Goal**: Google, GitHub, Discord OAuth 소셜 로그인 기능 제공

**Independent Test**: OAuth 전체 흐름 테스트 - 각 소셜 로그인 버튼 클릭 후 인증 완료 및 자동 로그인 확인

### Implementation for User Story 2

- [ ] T025 [P] [US2] OAuth 서비스 구현 in apps/api/src/auth/services/oauth.service.ts
- [ ] T026 [P] [US2] OAuth 컨트롤러 구현 (/auth/oauth-url, /auth/oauth-callback) in apps/api/src/auth/controllers/oauth.controller.ts
- [ ] T027 [P] [US2] OAuth URL 생성 및 콜백 처리 로직
- [ ] T028 [P] [US2] 소셜 로그인 버튼 컴포넌트 in apps/web/src/components/auth/SocialLoginButtons.tsx
- [ ] T029 [P] [US2] OAuth 상태 관리 컴포넌트 in apps/web/src/components/auth/OAuthProvider.tsx
- [ ] T030 [US2] OAuth 콜백 페이지 in apps/web/src/pages/auth/oauth-callback.tsx
- [ ] T031 [US2] OAuth 관련 타입 정의 in packages/types/src/auth/oauth.ts

**Checkpoint**: User Story 2 완료 - 소셜 로그인 기능 독립적으로 테스트 가능

---

## Phase 5: User Story 3 - 토큰 갱신 및 세션 관리 (Priority: P1)

**Goal**: 자동 토큰 갱신 및 Redis 기반 세션 관리 기능 제공

**Independent Test**: 토큰 만료 후 자동 갱신 테스트 - 24시간 후 세션 만료 및 재로그인 요구 확인

### Implementation for User Story 3

- [ ] T032 [P] [US3] Redis 세션 서비스 구현 in apps/api/src/session/redis-session.service.ts
- [ ] T033 [P] [US3] 토큰 갱신 서비스 구현 in apps/api/src/auth/services/token-refresh.service.ts
- [ ] T034 [US3] 토큰 갱신 엔드포인트 (/auth/refresh) in apps/api/src/auth/controllers/auth.controller.ts
- [ ] T035 [P] [US3] 로그아웃 엔드포인트 (/auth/logout) in apps/api/src/auth/controllers/auth.controller.ts
- [ ] T036 [P] [US3] RefreshToken 엔티티 생성 in apps/api/src/auth/entities/refresh-token.entity.ts
- [ ] T037 [P] [US3] 자동 토큰 갱신 클라이언트 로직 in apps/web/src/lib/auto-refresh.ts
- [ ] T038 [P] [US3] 세션 관리 훅 구현 in apps/web/src/hooks/useSession.ts
- [ ] T039 [US3] 다중 디바이스 세션 관리 UI in apps/web/src/components/auth/DeviceManager.tsx

**Checkpoint**: User Story 3 완료 - 세션 관리 및 토큰 갱신 기능 독립적으로 테스트 가능

---

## Phase 6: User Story 4 - 사용자 프로필 관리 (Priority: P2)

**Goal**: 사용자 프로필 조회 및 수정, 계정 삭제 기능 제공

**Independent Test**: 프로필 전체 흐름 테스트 - 로그인 후 프로필 조회, 정보 수정, 계정 삭제 확인

### Implementation for User Story 4

- [ ] T040 [P] [US4] 프로필 서비스 구현 in apps/api/src/auth/services/profile.service.ts
- [ ] T041 [P] [US4] 프로필 컨트롤러 구현 (/auth/profile GET/PUT, /auth/account DELETE) in apps/api/src/auth/controllers/profile.controller.ts
- [ ] T042 [P] [US4] 프로필 DTO 생성 (조회, 수정) in apps/api/src/auth/dto/profile.dto.ts
- [ ] T043 [P] [US4] 소프트 딜리트 구현 in apps/api/src/auth/repositories/user.repository.ts
- [ ] T044 [P] [US4] 프로필 페이지 컴포넌트 in apps/web/src/components/profile/ProfilePage.tsx
- [ ] T045 [P] [US4] 프로필 수정 폼 컴포넌트 in apps/web/src/components/profile/ProfileForm.tsx
- [ ] T046 [P] [US4] 프로필 사진 업로드 컴포넌트 in apps/web/src/components/profile/AvatarUpload.tsx
- [ ] T047 [P] [US4] 계정 삭제 확인 모달 in apps/web/src/components/profile/AccountDeleteModal.tsx
- [ ] T048 [US4] 프로필 관련 훅 in apps/web/src/hooks/useProfile.ts

**Checkpoint**: User Story 4 완료 - 프로필 관리 기능 독립적으로 테스트 가능

---

## Phase 7: User Story 5 - 사용자 검색 및 관리 (Priority: P3)

**Goal**: 사용자 검색 및 관리자용 사용자 목록 조회 기능 제공

**Independent Test**: 사용자 검색 테스트 - 닉네임/이메일로 검색 및 관리자용 전체 목록 조회 확인

### Implementation for User Story 5

- [ ] T049 [P] [US5] 사용자 검색 서비스 구현 in apps/api/src/auth/services/user-search.service.ts
- [ ] T050 [P] [US5] 검색 컨트롤러 구현 (/auth/search) in apps/api/src/auth/controllers/user-search.controller.ts
- [ ] T051 [P] [US5] 검색 DTO 생성 (쿼리 파라미터) in apps/api/src/auth/dto/search.dto.ts
- [ ] T052 [P] [US5] 검색 쿼리 최적화 (인덱스 활용) in apps/api/src/auth/repositories/user.repository.ts
- [ ] T053 [P] [US5] 사용자 검색 컴포넌트 in apps/web/src/components/search/UserSearch.tsx
- [ ] T054 [P] [US5] 검색 결과 컴포넌트 in apps/web/src/components/search/SearchResults.tsx
- [ ] T055 [P] [US5] 관리자용 사용자 목록 페이지 in apps/web/src/pages/admin/UserManagement.tsx
- [ ] T056 [P] [US5] 검색 관련 훅 in apps/web/src/hooks/useUserSearch.ts

**Checkpoint**: User Story 5 완료 - 사용자 검색 및 관리 기능 독립적으로 테스트 가능

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: System-wide improvements and final touches

- [ ] T057 [P] 전역 에러 핸들러 및 사용자 친화적 한글 에러 메시지 구현
- [ ] T058 [P] Rate Limiting 미들웨어 구현 (IP/사용자 기반)
- [ ] T059 [P] 보안 이벤트 로깅 시스템 구현
- [ ] T060 [P] API 응답 시간 최적화 및 캐싱 전략 적용
- [ ] T061 [P] 네트워크 오류 자동 재시도 로직 구현
- [ ] T062 [P] 보안 헤더 및 CORS 설정 강화
- [ ] T063 [P] 접근 제어 및 권한 검증 로직 강화
- [ ] T064 [P] 성능 모니터링 및 헬스 체크 엔드포인트 추가
- [ ] T065 [P] 사용자 경험 개선 (로딩 상태, 에러 상태 UI)
- [ ] T066 [P] API 문서 생성 및 Swagger 통합
- [ ] T067 [P] 단위 테스트 커버리지 85% 이상 달성
- [ ] T068 [P] TypeScript 엄격 모드 설정 및 타입 안전성 확보
- [ ] T069 [P] 코드 품질 검증 (ESLint, Prettier) 자동화 설정
- [ ] T070 [P] 배포 준비 환경 설정 및 도커라이징

---

## Dependencies & Execution Order

### Critical Path (Must Complete Before Starting Parallel Work)
```
Phase 1 (T001-T003) → Phase 2 (T004-T010)
```

### User Story Dependencies (Mostly Independent)
```
Phase 3 (US1)      ← Foundation Complete
Phase 4 (US2)      ← Foundation Complete
Phase 5 (US3)      ← Foundation Complete
Phase 6 (US4)      ← Foundation Complete
Phase 7 (US5)      ← Foundation Complete
```

**Note**: User Stories are largely independent and can be developed in parallel after Foundation (Phase 2) is complete.

---

## Parallel Execution Opportunities

### Foundation Phase Parallel Tasks
- **T002-T003**: TypeScript and linting configuration can be done in parallel
- **T006-T009**: Middleware, types, and guards setup can be parallelized

### User Story 1 Parallel Tasks
- **T011-T013**: Tests can be written in parallel
- **T014-T016**: Types, entities, and repositories can be parallelized
- **T021-T024**: Frontend components can be developed in parallel

### User Story 2 Parallel Tasks
- **T025-T027**: Backend OAuth services can be parallelized
- **T028-T031**: Frontend OAuth components can be parallelized

### User Story 3 Parallel Tasks
- **T032-T036**: All backend session management can be parallelized
- **T037-T039**: Frontend session components can be parallelized

### User Story 4 Parallel Tasks
- **T040-T043**: Backend profile services can be parallelized
- **T044-T048**: Frontend profile components can be parallelized

### User Story 5 Parallel Tasks
- **T049-T052**: Backend search services can be parallelized
- **T053-T056**: Frontend search components can be parallelized

### Polish Phase Parallel Tasks
- **T057-T070**: Most cross-cutting concerns can be implemented in parallel

---

## Implementation Strategy

### MVP Scope (Phase 3 Only)
Complete **User Story 1** (이메일 가입 및 로그인) first as MVP:
- Functional email authentication system
- Basic profile management
- Session handling

### Incremental Delivery
1. **Week 1**: Foundation (Phase 1-2)
2. **Week 2**: User Story 1 (MVP delivery)
3. **Week 3**: User Story 2 + User Story 3 (parallel)
4. **Week 4**: User Story 4 + User Story 5 (parallel)
5. **Week 5**: Polish and deployment readiness

### Risk Mitigation
- **Foundation First**: Ensure Phase 2 is rock solid before parallel development
- **Test-Driven Core**: Critical authentication flows (US1) have comprehensive tests
- **Incremental Integration**: Each user story can be deployed independently
- **Rollback Strategy**: Each phase has clear rollback checkpoints

---

## Success Criteria

### Technical Metrics
- **Code Quality**: All files ≤300 LOC, functions ≤50 LOC
- **Test Coverage**: ≥85% for core authentication flows
- **Performance**: API response time <100ms, session operations <10ms
- **Security**: All authentication flows follow OWASP guidelines

### Business Metrics
- **User Story Independence**: Each story delivers standalone value
- **Completion Tracking**: 70 tasks total, clear checkpoint validation
- **MVP Timeline**: Email authentication (US1) ready in 2 weeks

**Total Tasks**: 70
**Core Authentication Tasks**: 36 (Phases 1-5)
**Polish Tasks**: 14 (Phase 8)