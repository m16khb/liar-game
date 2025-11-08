# Implementation Plan: AI 에이전트 및 스킬 시스템

**Branch**: `001-ai-agents-skills` | **Date**: 2025-11-08 | **Spec**: [link](spec.md)
**Input**: Feature specification from `/specs/001-ai-agents-skills/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

AI 기반 개발 도우미 시스템 구축으로 6개 전문 에이전트와 8개 자동화 스킬을 통해 개발 생산성을 70% 향상시키고, 반복 작업 시간을 50% 단축하며, 프로젝트 헌법 준수율 100%를 달성하는 시스템을 구현합니다. 에이전트 협업을 통해 복잡한 기능 개발 시간을 40% 단축하고, 실시간 코드 생성 및 피드백 루프를 제공합니다.

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
**Project Type**: AI 개발 도우미 시스템 (모노레포 - Turborepo)
**Performance Goals**: 코드 생성 속도 <5초, 에이전트 응답 지연시간 <2초
**Constraints**: 파일 ≤300 LOC, 함수 ≤50 LOC, 매개변수 ≤5개, 복잡도 ≤10, 테스트 커버리지 ≥85%
**Scale/Scope**: 6개 전문 에이전트, 8개 자동화 스킬, 동시 에이전트 협업 지원

### AI Agent Technology Stack
- **AI Platform**: Claude Code API (NEEDS CLARIFICATION: 실제 AI 통합 방식)
- **Agent Orchestration**: NEEDS CLARIFICATION (에이전트 조율 아키텍처)
- **Skill Registry**: YAML 기반 스킬 정의 시스템
- **Knowledge Base**: 벡터 데이터베이스 (NEEDS CLARIFICATION: 기술 선택)
- **Collaboration Protocol**: WebSocket 기반 에이전트 통신

### Integration Points
- **IDE Integration**: VS Code 확장 (NEEDS CLARIFICATION: IDE 지원 범위)
- **CI/CD Integration**: GitHub Actions 워크플로우 통합
- **Documentation**: 자동 생성 기술 문서 시스템
- **Metrics**: 생산성 지표 수집 및 대시보드

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **한국어 우선 원칙**: 모든 문서, 주석, 커밋 메시지는 한국어로 작성
- **현대 기술 스택 원칙**: React 18 + Compiler, NestJS 11 + Fastify 사용
- **시간대 표준화 원칙**: 백엔드는 UTC, 프론트엔드는 KST 변환 표시, dayjs 사용
- **인프라 현대화 원칙**: MySQL v8 LTS (주 DB), Redis v8 LTS (캐싱/세션), Nginx LTS, Kubernetes, Promtail+Loki+Grafana
- **실시간 게임 서버 원칙**: 6인 멀티플레이어 라이어 게임 로직 구현 ⚠️ (본 기능은 게임 로직이 아닌 개발 도우미)
- **Supabase 인증 원칙**: OAuth 소셜 로그인 + Email 로그인
- **최소 구현 원칙**: YAGNI 원칙, 요구되지 않은 기능은 구현하지 않음
- **SOLID 원칙 준수**: 단일 책임, 개방/폐쇄, 리스코프 치환, 인터페이스 분리, 의존성 역전
- **코드 품질 및 주석 원칙**: 효율적 코드, 핵심 로직에 상세한 한글 주석
- **TypeORM 외키 제약 조건 원칙**: 개념적 관계만 정의하고 실제 DB에는 FK 제약 조건 생성 안 함
- **TypeORM 마이그레이션 관리 원칙**: 모든 스키마 변경은 TypeORM 마이그레이션으로 생성/적용, 비상 상황에서도 마이그레이션 파일 생성 필수
- **공식 문서 참조 원칙**: 모든 기술 구현과 의사결정은 최신 공식 문서를 우선적으로 참조

**GATE STATUS**: ⚠️ WARNING - Constitution Check needs clarification on "실시간 게임 서버 원칙" applicability to AI development tools.

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-agents-skills/
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
# Turborepo 모노레포 구조 (라이어 게임 + AI 에이전트 시스템)
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

# AI 에이전트 시스템 구조 (新增)
.claude/
├── agents/                    # 전문 에이전트 정의
│   ├── react-frontend-developer.md
│   ├── ui-ux-designer.md
│   ├── database-architect.md
│   ├── auth-security-specialist.md
│   ├── game-logic-analyzer.md
│   └── kubernetes-deployment-expert.md
├── skills/                    # 자동화 스킬 정의
│   ├── react-component-generator/
│   ├── supabase-auth-integrator/
│   ├── responsive-page-builder/
│   ├── api-endpoint-generator/
│   ├── websocket-gateway-builder/
│   ├── typeorm-migration-generator/
│   ├── nestjs-test-specialist/
│   └── docker-k8s-optimizer/
├── commands/                  # 커스텀 슬래시 명령어
├── templates/                 # 코드 생성 템플릿
└── memory/                    # 에이전트 지식 베이스

docs/                          # 프로젝트 문서
├── architecture/              # 아키텍처 문서
└── ai-agents/                 # AI 에이전트 시스템 문서
```

**Structure Decision**: Turborepo 기반 모노레포 구조 선택 - apps/ (실행 가능한 애플리케이션) + packages/ (공유 라이브러리) + .claude/ (AI 에이전트 시스템) 분리. 이 구조는 기존 프로젝트 구조를 유지하면서 AI 에이전트 시스템을 독립적으로 통합하여 개발 생산성을 극대화합니다.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| AI 에이전트 시스템 추가 | 개발 생산성 극대화를 위한 전문 에이전트 및 자동화 스킬 필요 | 단순 코드 템플릿만으로는 실시간 협업과 지능형 코드 생성 불가 |
| 벡터 데이터베이스 (예상) | 에이전트 지식 베이스와 의미적 검색 필요 | 전통적 DB로는 AI 에이전트의 효율적 지식 관리 부족 |
| 에이전트 조율 아키텍처 | 복잡한 기능 개발을 위한 에이전트 간 협업 필요 | 단일 에이전트로는 전문 분야 시너지 창출 불가 |
