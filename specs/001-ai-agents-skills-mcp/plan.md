# Implementation Plan: 메인페이지 히어로 섹션 및 Supabase 로그인 기능

**Branch**: `001-ai-agents-skills-mcp` | **Date**: 2025-11-08 | **Spec**: [link](./spec.md)
**Input**: Feature specification from `/specs/001-ai-agents-skills-mcp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

라이어 게임 프로젝트의 메인페이지에 현대적인 히어로 섹션을 구현하고, Supabase 기반의 완전한 인증 시스템을 구축합니다. React 18 + TypeScript 환경에서 styled-components를 활용한 반응형 디자인과 OAuth 소셜 로그인(Google, GitHub, Discord) 및 Email 로그인을 모두 지원하는 사용자 친화적인 인증 경험을 제공합니다.

## Technical Context

**Language/Version**: TypeScript 5.7.x (Node.js 25.1.0)
**Primary Dependencies**: React 18 + Compiler, NestJS 11.x + Fastify, Socket.IO, Supabase Auth, TypeORM (FK 제약 조건 없음, 마이그레이션 필수)
**Storage**: MySQL v8 LTS (영구 저장), Redis v8 LTS (세션/캐싱)
**Testing**: Jest (백엔드), Vitest (프론트엔드), 단위 테스트만 허용
**Target Platform**: 웹 브라우저, Linux 서버 (Kubernetes)
**Project Type**: 웹 애플리케이션 (모노레포 - Turborepo)
**Performance Goals**: API 응답시간 <50ms, WebSocket 지연시간 <10ms
**Constraints**: 파일 ≤300 LOC, 함수 ≤50 LOC, 매개변수 ≤5개, 복잡도 ≤10, 테스트 커버리지 ≥85%
**Scale/Scope**: 6인실시간 멀티플레이어 게임, 동시 게임 세션 지원

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **한국어 우선 원칙**: 모든 문서, 주석, 커밋 메시지는 한국어로 작성
- **현대 기술 스택 원칙**: React 18 + Compiler, NestJS 11 + Fastify 사용
- **시간대 표준화 원칙**: 백엔드는 UTC, 프론트엔드는 KST 변환 표시, dayjs 사용
- **인프라 현대화 원칙**: MySQL v8 LTS (주 DB), Redis v8 LTS (캐싱/세션), Nginx LTS, Kubernetes, Promtail+Loki+Grafana
- **실시간 게임 서버 원칙**: 6인 멀티플레이어 라이어 게임 로직 구현
- **Supabase 인증 원칙**: OAuth 소셜 로그인 + Email 로그인
- **최소 구현 원칙**: YAGNI 원칙, 요구되지 않은 기능은 구현하지 않음
- **SOLID 원칙 준수**: 단일 책임, 개방/폐쇄, 리스코프 치환, 인터페이스 분리, 의존성 역전
- **코드 품질 및 주석 원칙**: 효율적 코드, 핵심 로직에 상세한 한글 주석
- **TypeORM 외키 제약 조건 원칙**: 개념적 관계만 정의하고 실제 DB에는 FK 제약 조건 생성 안 함
- **TypeORM 마이그레이션 관리 원칙**: 모든 스키마 변경은 TypeORM 마이그레이션으로 생성/적용, 비상 상황에서도 마이그레이션 파일 생성 필수
- **공식 문서 참조 원칙**: 모든 기술 구현과 의사결정은 최신 공식 문서를 우선적으로 참조

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-agents-skills-mcp/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api.yaml         # API 계약서
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Turborepo 모노레포 구조 (라이어 게임)
apps/
├── web/                        # React 18 + Compiler 프론트엔드
│   ├── src/
│   │   ├── components/        # React 컴포넌트
│   │   │   ├── hero/          # 히어로 섹션 컴포넌트
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   ├── CTAButton.tsx
│   │   │   │   └── GamePreview.tsx
│   │   │   ├── auth/          # 인증 관련 컴포넌트
│   │   │   │   ├── LoginModal.tsx
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── SocialButtons.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   └── layout/        # 레이아웃 컴포넌트
│   │   ├── contexts/          # React Context
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/             # 커스텀 훅
│   │   │   └── useAuth.ts
│   │   ├── pages/             # 페이지 컴포넌트
│   │   │   ├── HomePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── AuthCallbackPage.tsx
│   │   ├── types/             # 타입 정의
│   │   │   ├── auth.types.ts
│   │   │   └── hero.types.ts
│   │   ├── lib/               # 유틸리티 함수
│   │   │   └── supabase.ts    # Supabase 클라이언트 (기존)
│   │   ├── styles/            # 스타일 정의
│   │   │   └── theme.ts
│   │   └── App.tsx            # 메인 앱 컴포넌트
│   └── tests/                 # 프론트엔드 테스트 (Vitest)
└── api/                       # NestJS 11 + Fastify 백엔드
    ├── src/
    │   ├── auth/              # 인증 모듈 (기존 구현됨)
    │   ├── stats/             # 게임 통계 API (신규)
    │   │   ├── dto/
    │   │   ├── service/
    │   │   └── controller/
    │   └── users/             # 사용자 API (기존)
    └── test/                  # 백엔드 테스트 (Jest)

packages/
├── types/                     # 공유 타입 정의
├── config/                    # ESLint, TSConfig, Prettier
├── ui/                        # 공유 React 컴포넌트
└── constants/                 # 게임 상수, 이벤트 정의

docs/                          # 프로젝트 문서
└── architecture/              # 아키텍처 문서
```

**Structure Decision**: Turborepo 기반 모노레포 구조 선택 - apps/ (실행 가능한 애플리케이션) + packages/ (공유 라이브러리) 분리. 이 구조는 프론트엔드(React)와 백엔드(NestJS)의 독립적인 개발과 배포를 지원하며, 공유 타입과 컴포넌트 재사용성을 극대화합니다.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 추가 의존성 (styled-components, react-router-dom) | 현대적 UI 구현과 라우팅 기능 필요 | 기본 CSS와 hash router는 복잡한 인증 흐름 처리에 한계가 있음 |
| AuthContext 복잡성 | Supabase의 다양한 인증 방식과 상태 관리 필요 | 단순 state lifting은 컴포넌트 트리 복잡성 증가와 prop drilling 문제 발생 |

## Phase 0: Research & Clarification (완료)

### Research Results Summary
- **프로젝트 현황**: Supabase 백엔드 인프라 완벽하게 구축됨, 프론트엔드만 구현 필요
- **기술 결정**: Styled Components + React Router DOM + React Context API
- **필요 의존성**: styled-components, react-router-dom, framer-motion (선택)
- **예상 기간**: 6-9일 (MVP 4-5일)

### Key Findings
1. **Supabase 설정**: 모든 환경 변수와 클라이언트 함수가 준비됨
2. **백엔드 연동**: Custom Access Token Hook, JWT 검증, 웹훅 처리까지 완료
3. **보안 강화**: PKCE flow, CSRF 방지, 자동 토큰 갱신 지원
4. **기술적 리스크**: 낮음 - 모든 인프라가 준비됨

## Phase 1: Design & Contracts (완료)

### Data Model (data-model.md)
- 인증 상태 모델 정의 (AuthState, User, Session)
- 히어로 섹션 상태 모델 (HeroSectionState)
- 컴포넌트 Props 타입 정의
- 상태 전이 로직 설계
- 데이터 유효성 규칙 정의

### API Contracts (contracts/api.yaml)
- 게임 통계 API: GET /api/stats/game
- 사용자 프로필 API: GET /api/users/profile
- 인증 상태 확인 API: GET /api/auth/status
- 완전한 OpenAPI 3.0.3 명세

### Quickstart Guide (quickstart.md)
- 9단계 구현 가이드
- 코드 예시 포함
- 테스트 체크리스트
- 문제 해결 가이드

### Constitution Compliance Check
✅ **모든 헌법 원칙 준수 확인**
- 한국어 우선 원칙: 모든 문서와 주석 한글 작성
- 최소 구현 원칙: YAGNI 원칙에 따른 필수 기능만 구현
- SOLID 원칙: 컴포넌트 단일 책임, 의존성 주입 패턴
- Supabase 인증 원칙: OAuth + Email 지원 완전 준수

## Phase 2: Implementation Tasks (/speckit.tasks command required)

**다음 단계**: `/speckit.tasks` 명령어를 실행하여 구현 태스크 목록 생성

### Expected Task Categories
1. **프로젝트 설정** (의존성 설치, 기본 구조)
2. **인증 시스템** (AuthContext, 로그인 컴포넌트)
3. **히어로 섹션** (메인 컴포넌트, 스타일링)
4. **페이지 구현** (라우팅, 콜백 처리)
5. **테스트 및 최적화** (단위 테스트, 성능 최적화)

### Success Criteria
- [ ] 사용자가 메인페이지에서 소셜 로그인 가능
- [ ] 로그인 후 대시보드로 정상 리디렉션
- [ ] 히어로 섹션이 반응형으로 렌더링
- [ ] 게임 통계가 동적으로 표시
- [ ] 모바일 환경에서 완벽한 동작
- [ ] 접근성 가이드라인 준수

---

**상태**: Phase 1 완료 | **다음 액션**: `/speckit.tasks` 실행