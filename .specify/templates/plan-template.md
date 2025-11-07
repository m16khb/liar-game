# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

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

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# Turborepo 모노레포 구조 (라이어 게임)
apps/
├── web/                        # React 18 + Compiler 프론트엔드
│   ├── src/
│   │   ├── components/        # React 컴포넌트
│   │   ├── hooks/            # 커스텀 훅
│   │   ├── pages/            # 페이지 컴포넌트
│   │   └── lib/              # 유틸리티 함수
│   └── tests/                # 프론트엔드 테스트 (Vitest)
└── api/                       # NestJS 11 + Fastify 백엔드
    ├── src/
    │   ├── auth/             # 인증 모듈
    │   ├── room/             # 게임 방 관리
    │   ├── game/             # 게임 로직
    │   └── gateway/          # WebSocket Gateway
    └── test/                 # 백엔드 테스트 (Jest)

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
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
