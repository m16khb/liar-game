# Quickstart Guide: AI 에이전트 및 스킬 시스템 문서화

**버전**: 1.0.0
**작성일**: 2025-11-08
**대상**: liar-game 프로젝트 개발자 및 시스템 문서화 담당자

## 1. 개요

이 가이드는 liar-game 프로젝트에 이미 구현된 AI 에이전트 및 스킬 시스템을 이해하고 활용하는 방법을 안내합니다. 기존에 만들어진 6개 전문 에이전트와 8개 자동화 스킬의 기능을 파악하고, 이를 바탕으로 공식 스펙 문서를 작성하는 과정을 설명합니다.

## 2. 시스템 구성 요소

### 2.1 AI 에이전트 (6개 전문 분야)

| 에이전트 | 전문 분야 | 주요 역할 | 파일 위치 |
|---------|-----------|-----------|-----------|
| **Database Architect** | 데이터베이스 | 스키마 설계, 성능 최적화, 쿼리 분석 | `.claude/agents/database-architect.md` |
| **Auth Security Specialist** | 인증/보안 | Supabase Auth, OAuth, 보안 취약점 분석 | `.claude/agents/auth-security-specialist.md` |
| **Game Logic Analyzer** | 게임 로직 | NestJS 서비스, WebSocket, 상태 관리 | `.claude/agents/game-logic-analyzer.md` |
| **Kubernetes Deployment Expert** | 인프라 | K8s 배포, CI/CD, 모니터링 | `.claude/agents/kubernetes-deployment-expert.md` |
| **React Frontend Developer** | 프론트엔드 | React 18+, TypeScript, 컴포넌트 | `.claude/agents/react-frontend-developer.md` |
| **UI/UX Designer** | 디자인 | 반응형 디자인, 접근성, 사용자 경험 | `.claude/agents/ui-ux-designer.md` |

### 2.2 자동화 스킬 (8개 개발 영역)

| 스킬 | 영역 | 생성 결과물 | 파일 위치 |
|------|------|-------------|-----------|
| **API Endpoint Generator** | API 생성 | Controller, Service, DTO, Entity | `.claude/skills/api-endpoint-generator/SKILL.md` |
| **WebSocket Gateway Builder** | 실시간 통신 | Gateway, 이벤트 처리, 방 관리 | `.claude/skills/websocket-gateway-builder/SKILL.md` |
| **TypeORM Migration Generator** | 데이터베이스 | Migration 파일 (up/down) | `.claude/skills/typeorm-migration-generator/SKILL.md` |
| **Docker K8s Optimizer** | 인프라 | Dockerfile, K8s 매니페스트 | `.claude/skills/docker-k8s-optimizer/SKILL.md` |
| **NestJS Test Specialist** | 테스트 | 단위 테스트 (85%+ 커버리지) | `.claude/skills/nestjs-test-specialist/SKILL.md` |
| **React Component Generator** | 프론트엔드 | TypeScript 컴포넌트, 스타일 | `.claude/skills/react-component-generator/SKILL.md` |
| **Supabase Auth Integrator** | 인증 | OAuth 설정, 인증 컴포넌트 | `.claude/skills/supabase-auth-integrator/SKILL.md` |
| **Responsive Page Builder** | 디자인 | 반응형 페이지, 애니메이션 | `.claude/skills/responsive-page-builder/SKILL.md` |

## 3. 빠른 시작

### 3.1 에이전트 활용 방법

#### 단일 에이전트 호출

Claude가 작업 내용을 분석하여 가장 적합한 에이전트를 자동으로 선택합니다:

```
# 데이터베이스 관련 질문
"데이터베이스 아키텍트에게 게임 방 테이블 설계를 검토해줘"
→ [Database Architect 에이전트 자동 호출]

# 보안 관련 질문
"Auth Security Specialist에게 로그인 보안을 검토해달라고 해"
→ [Auth Security Specialist 에이전트 자동 호출]
```

#### 에이전트 전문 분야별 사용법

```bash
# 데이터베이스 설계 및 최적화
"데이터베이스 아키텍트에게 성능 문제 분석 요청"

# 인증 및 보안 검토
"인증 보안 전문가에게 보안 취약점 검토 요청"

# 게임 로직 분석
"게임 로직 분석가에게 상태 동기화 문제 확인 요청"

# 인프라 및 배포
"Kubernetes 전문가에게 배포 설정 검토 요청"

# 프론트엔드 개발
"React 프론트엔드 개발자에게 컴포넌트 설계 요청"

# UI/UX 디자인
"UI/UX 디자이너에게 사용자 인터페이스 개선 요청"
```

### 3.2 스킬 활용 방법

#### 스킬 실행 요청

```bash
# API 엔드포인트 생성
"API 엔드포인트 생성 스킬로 User 엔티티용 CRUD API 만들어줘"
# 생성됨: Controller.ts, Service.ts, DTO.ts, Entity.ts

# React 컴포넌트 생성
"React 컴포넌트 생성 스킬로 게임 카드 컴포넌트 만들어줘"
# 생성됨: GameCard.tsx, GameCard.test.tsx, GameCard.stories.tsx

# 데이터베이스 마이그레이션
"TypeORM 마이그레이션 스킬로 새로운 테이블 추가 마이그레이션 만들어줘"
# 생성됨: Migration_YYYYMMDDHHMMSS_add_table.ts

# Supabase 인증 연동
"Supabase 인증 스킬로 소셜 로그인 설정해줘"
# 생성됨: 인증 컴포넌트, Provider 설정
```

#### 스킬별 상세 사용법

| 스킬 | 입력 요구사항 | 생성 결과물 | 사용 시점 |
|------|-------------|-------------|-----------|
| API Generator | entityName, fields | Controller, Service, DTO, Entity | 새로운 API 개발 시 |
| React Component | componentName, props | Component, Test, Storybook | UI 컴포넌트 개발 시 |
| TypeORM Migration | tableName, columns | up()/down() 메서드 | 데이터베이스 스키마 변경 시 |
| Supabase Auth | auth providers | Auth components, providers | 인증 기능 개발 시 |
| WebSocket Gateway | events, rooms | Gateway, event handlers | 실시간 기능 개발 시 |
| NestJS Test | service, test cases | Unit test files | 테스트 코드 작성 시 |
| Docker K8s | app details | Dockerfile, K8s manifests | 배포 환경 구축 시 |
| Responsive Page | page structure | Page components, layout | 페이지 개발 시 |

## 4. 문서화 작업 흐름

### 4.1 현재 상태 분석

이미 구현된 시스템을 분석하여 문서화할 내용을 파악합니다:

```bash
# 1. 기존 에이전트 파일들 분석
.claude/agents/ 디렉토리의 6개 에이전트 파일

# 2. 기존 스킬 파일들 분석
.claude/skills/ 디렉토리의 8개 스킬 디렉토리

# 3. 아키텍처 패턴 추출
에이전트 정의 형식, 스킬 템플릿 구조, 통합 방식

# 4. 프로젝트 헌법 준수 방식 분석
한국어 우선, 기술 스택, 코드 품질 기준
```

### 4.2 문서화 우선순위

#### MVP (필수 문서)
1. **에이전트 시스템 기술 명세** - 6개 에이전트 기능 상세 설명
2. **스킬 시스템 기술 명세** - 8개 스킬 기능 상세 설명
3. **통합 명세** - 에이전트-스킬 협업 방식

#### 확장 (권장 문서)
1. **아키텍처 가이드** - 시스템 설계 원칙
2. **사용자 매뉴얼** - 실제 사용 방법
3. **개발자 가이드** - 새로운 기능 추가 방법

### 4.3 문서화 절차

```bash
# Phase 1: 기존 기능 분석
- 에이전트/스킬 파일 상세 분석
- 아키텍처 패턴 추출
- 프로젝트 통합 방식 분석

# Phase 2: 기술 명세 작성
- 에이전트 시스템 명세화
- 스킬 시스템 명세화
- 통합 메커니즘 명세화

# Phase 3: 아키텍처 문서화
- 시스템 설계 원칙 정리
- 확장 가능한 구조 정의
- 품질 관리 메커니즘 문서화

# Phase 4: 사용 가이드 작성
- 실제 사용 방법 안내
- 일반적인 시나리오별 가이드
- 문제 해결 방법 제공

# Phase 5: 개발자 가이드 작성
- 새로운 에이전트 개발 방법
- 새로운 스킬 개발 방법
- 코드 품질 기준 제공
```

## 5. 실제 사용 예시

### 5.1 신규 기능 개발 시나리오

```bash
# Step 1: 기능 분석
"게임 토론 기능 개발이 필요해"

# Step 2: 관련 에이전트 호출
"게임 로직 분석가에게 토론 게임 로직 설계를 요청해줘"
"UI/UX 디자이너에게 토론 인터페이스 디자인을 요청해줘"

# Step 3: 스킬로 코드 생성
"API 엔드포인트 생성 스킬로 토론방 API 만들어줘"
"React 컴포넌트 생성 스킬로 토론 UI 컴포넌트 만들어줘"
"WebSocket Gateway Builder 스킬로 실시간 토론 통신 구축해줘"

# Step 4: 검토 및 개선
"게임 로직 분석가에게 구현된 토론 기능 검토해줘"
"인증 보안 전문가에게 토론방 보안 검토해줘"
```

### 5.2 문서화 작업 시나리오

```bash
# Step 1: 기존 기능 분석
"Database Architect 에이전트의 기능과 패턴을 분석해줘"

# Step 2: 기술 명세 작성
"분석된 내용을 바탕으로 에이전트 시스템 기술 명세를 작성해줘"

# Step 3: 사용 가이드 작성
"에이전트 사용법을 실용적인 예시와 함께 설명해줘"

# Step 4: 개발자 가이드 작성
"새로운 에이전트를 개발하는 방법을 상세히 안내해줘"
```

## 6. 주의사항 및 제약사항

### 6.1 사용 시 주의사항

- **명확한 요청**: 구체적인 작업 내용을 명시해야 함
- **컨텍스트 제공**: 프로젝트 상태와 관련 정보를 제공해야 함
- **단계적 접근**: 복잡한 작업은 작은 단위로 분리하여 요청
- **결과 검증**: 생성된 결과물을 직접 확인하고 피드백 제공

### 6.2 문서화 시 주의사항

- **실제 기능 기반**: 이론적이 아닌 실제 구현된 기능만 문서화
- **정확성 확보**: 문서 내용이 실제 동작과 100% 일치해야 함
- **일관성 유지**: 모든 문서가 통일된 형식과 용어 사용
- **프로젝트 헌법 준수**: 모든 문서가 헌법 원칙 반영

### 6.3 제약사항

- **기존 기능 한정**: 이미 구현된 기능만 문서화 대상
- **형식 준수**: 프로젝트 문서 표준 형식 따라야 함
- **한국어 우선**: 모든 문서가 한국어 작성 원칙 준수
- **품질 기준**: 코드 품질, 문서 완성도 기준 충족

## 7. 다음 단계

### 7.1 즉시 시작할 수 있는 작업

1. **기존 에이전트/스킬 탐색** - `.claude/` 디렉토리 내용 확인
2. **기능 분석 시작** - 각 에이전트/스킬의 상세 기능 파악
3. **문서화 계획 수립** - 우선순위별 문서화 계획 수립

### 7.2 중장간 계획

1. **MVP 문서 완성** - 핵심 기술 명세 3개 작성
2. **전체 문서 완성** - 아키텍처, 사용 가이드, 개발자 가이드
3. **지속적 유지보수** - 시스템 변경 시 문서 동기화

## 8. 지원 및 참고 자료

### 8.1 관련 문서
- [프로젝트 헌법](../../../.specify/memory/constitution.md)
- [기술 연구 보고서](./research.md)
- [데이터 모델](./data-model.md)
- [API 명세](./contracts/api.yaml)

### 8.2 도움말 요청
```bash
# 시스템 사용법 문의
"AI 에이전트 및 스킬 시스템 사용법을 알려줘"

# 문서화 방법 문의
"에이전트/스킬 문서화 방법을 안내해줘"

# 특정 기능 문의
"Database Architect 에이전트의 사용법을 설명해줘"
```

---

**참고**: 이 가이드는 liar-game 프로젝트의 AI 에이전트 및 스킬 시스템을 이해하고 활용하기 위한 빠른 시작 안내서입니다. 더 상세한 내용은 각 전문 문서를 참고하시기 바랍니다.