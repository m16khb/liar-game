# AI 에이전트 및 스킬 시스템 명세

## 📋 개요

본 스펙은 라이어 게임 프로젝트의 AI 기반 개발 도우미 시스템에 대한 상세한 기술 명세입니다. Claude AI를 활용한 전문 에이전트와 자동화 스킬을 통해 개발 생산성을 극대화하고 일관된 코드 품질을 유지합니다.

## 🎯 시스템 목표

### 1. 개발 생산성 향상
- **코드 생성 자동화**: 반복적인 코드 작업 자동화
- **패턴 기반 개발**: 프로젝트 아키텍처 패턴 자동 적용
- **실시간 지원**: 개발 중 즉각적인 도움 제공

### 2. 코드 품질 보장
- **일관성 유지**: 프로젝트 전체의 일관된 코딩 스타일
- **베스트 프랙티스**: 업계 표준 패턴과 관례 적용
- **타입 안전성**: TypeScript 기반의 안전한 코드 생성

### 3. 지식 공유 및 전달
- **전문 분야 커버리지**: 6개 주요 분야별 전문 에이전트
- **재사용 가능한 스킬**: 8개 자동화 개발 스킬
- **학습 효과**: 개발자와 AI의 상호작용을 통한 지식 전달

## 🏗️ 시스템 아키텍처

### 에이전트 계층 (Agent Layer)
```
┌─────────────────────────────────────────────────────────────┐
│                    Claude AI Platform                       │
├─────────────────────────────────────────────────────────────┤
│  React Frontend  │   UI/UX   │  Database   │  Auth Security │
│     Developer        Designer    Architect      Specialist    │
├─────────────────────────────────────────────────────────────┤
│  Game Logic      │  Kubernetes   │     Future Expansion     │
│    Analyzer        Deployment        Agents...              │
└─────────────────────────────────────────────────────────────┘
```

### 스킬 계층 (Skill Layer)
```
┌─────────────────────────────────────────────────────────────┐
│                  Skills Registry                           │
├─────────────────────────────────────────────────────────────┤
│ React Component │ Supabase Auth │ Responsive Page │ API     │
│   Generator        Integrator        Builder        Endpoint │
├─────────────────────────────────────────────────────────────┤
│ WebSocket   │ TypeORM  │ NestJS   │ Docker & K8s │ Future   │
│  Gateway      Migration   Test       Optimizer      Skills... │
└─────────────────────────────────────────────────────────────┘
```

## 👥 전문 에이전트 명세

### 1. React Frontend Developer
- **전문 분야**: React 18+, TypeScript, 프론트엔드 아키텍처
- **핵심 역량**:
  - React 18+ 최신 기능 및 패턴
  - TypeScript 기반 타입 안전 개발
  - Supabase Auth 연동
  - 히어로 섹션 및 랜딩 페이지 구현
  - 실시간 게임 UI/UX 개발
  - 상태 관리 (Context API, Zustand)
  - 애니메이션 (Framer Motion)

### 2. UI/UX Designer
- **전문 분야**: 디자인 시스템, 사용자 경험, 반응형 디자인
- **핵심 역량**:
  - 일관된 디자인 언어 설계
  - 모바일 퍼스트 반응형 디자인
  - 히어로 섹션 시각 디자인
  - Supabase 로그인 화면 UI/UX
  - 게임 인터페이스 설계
  - 접근성 (WCAG 2.1 AA)
  - 컴포넌트 디자인 시스템 구축

### 3. Database Architect
- **전문 분야**: 데이터베이스 설계, TypeORM, 성능 최적화
- **핵심 역량**:
  - MySQL v8 LTS 데이터베이스 설계
  - TypeORM Entity 및 Relationship 설계
  - 마이그레이션 전략 수립
  - 성능 최적화 (인덱싱, 쿼리 튜닝)
  - 데이터 모델링 및 정규화
  - 외래 키 제약 조건 관리

### 4. Auth Security Specialist
- **전문 분야**: 인증 시스템, 보안, Supabase Auth
- **핵심 역량**:
  - Supabase Auth 시스템 통합
  - OAuth 2.0 (Google, GitHub, Discord)
  - JWT 토큰 관리 및 보안
  - PKCE 흐름 보안 강화
  - 세션 관리 및 보안 정책
  - Row Level Security (RLS)
  - 보안 취약점 분석 및 대응

### 5. Game Logic Analyzer
- **전문 분야**: 게임 비즈니스 로직, 실시간 상태 관리
- **핵심 역량**:
  - 라이어 게임 규칙 구현
  - 실시간 게임 상태 관리
  - 비즈니스 로직 분리 및 모듈화
  - 게임 세션 관리
  - 플레이어 상태 추적
  - 게임 결과 계산 및 검증

### 6. Kubernetes Deployment Expert
- **전문 분야**: 컨테이너 오케스트레이션, 배포 자동화
- **핵심 역량**:
  - Kubernetes 클러스터 설계
  - Docker 이미지 최적화
  - CI/CD 파이프라인 구축
  - 프로덕션 배포 전략
  - 모니터링 및 로깅
  - 오토스케일링 설정
  - 보안 및 네트워크 정책

## 🛠️ 자동화 스킬 명세

### 1. React Component Generator
- **기능**: React 및 TypeScript로 재사용 가능한 컴포넌트 생성
- **생성 파일**:
  - ComponentName.tsx (메인 컴포넌트)
  - ComponentName.test.tsx (Vitest 테스트)
  - ComponentName.stories.tsx (Storybook)
  - types.ts (컴포넌트 타입)
- **지원 컴포넌트**: LoginForm, HeroSection, GameCard, Button 등
- **특징**: Tailwind CSS, 접근성, 애니메이션 지원

### 2. Supabase Auth Integrator
- **기능**: Supabase 인증 시스템을 React 앱에 완전 통합
- **생성 파일**:
  - lib/supabase.ts (클라이언트 설정)
  - context/AuthContext.tsx (인증 컨텍스트)
  - components/auth/ (로그인, 회원가입 폼)
  - components/layout/ProtectedRoute.tsx
- **지원 인증**: Google, GitHub, Discord, Email/Password
- **특징**: PKCE 흐름, 자동 토큰 갱신, 세션 관리

### 3. Responsive Page Builder
- **기능**: 모바일 퍼스트 반응형 페이지 생성
- **생성 파일**:
  - pages/HomePage.tsx (메인 페이지)
  - components/sections/ (히어로, 피처, CTA 섹션)
  - components/layout/ (네비게이션, 푸터)
- **지원 페이지**: 랜딩 페이지, 대시보드, 게임 페이지
- **특징**: Framer Motion, Tailwind CSS, 접근성

### 4. API Endpoint Generator
- **기능**: NestJS API 엔드포인트 전체 구조 생성
- **생성 파일**:
  - controller/[name].controller.ts
  - service/[name].service.ts
  - dto/[name].dto.ts
  - entity/[name].entity.ts
  - [name].module.ts
- **지원 기능**: CRUD, 검증, Swagger 문서화, 에러 처리

### 5. WebSocket Gateway Builder
- **기능**: Socket.IO 기반 실시 통신 게이트웨이 구축
- **생성 파일**:
  - gateway/[name].gateway.ts
  - service/[name].service.ts
  - dto/[name].dto.ts
- **지원 기능**: 방 관리, 실시간 메시징, 이벤트 핸들링

### 6. TypeORM Migration Generator
- **기능**: TypeORM 마이그레이션 자동 생성
- **생성 파일**:
  - migrations/[timestamp]-[name].ts
  - entities/[name].entity.ts (필요시)
- **지원 기능**: 스키마 변경, 인덱스 추가, 데이터 마이그레이션

### 7. NestJS Test Specialist
- **기능**: NestJS 단위 테스트 자동 생성
- **생성 파일**:
  - [name].controller.spec.ts
  - [name].service.spec.ts
  - [name].gateway.spec.ts
- **지원 기능**: Mock 설정, Given-When-Then 패턴, 커버리지

### 8. Docker & K8s Optimizer
- **기능**: Docker 및 쿠버네티스 배포 설정 최적화
- **생성 파일**:
  - Dockerfile (다단계 빌드)
  - k8s/[app].yaml (Deployment, Service, ConfigMap)
  - nginx/nginx.conf (리버스 프록시)
- **지원 기능**: 이미지 최적화, 헬스체크, 오토스케일링

## 🔧 구현 세부사항

### 에이전트 호출 방식
```bash
# Claude Code에서 에이전트에게 작업 요청
@react-frontend-developer 히어로 섹션을 만들어주세요
@ui-ux-designer 로그인 UI를 디자인해주세요
@auth-security-specialist Supabase OAuth 설정을 도와주세요
```

### 스킬 실행 방식
```bash
# Claude Code에서 스킬 실행
/skill react-component-generator
/skill supabase-auth-integrator
/skill responsive-page-builder
```

### 파일 구조 규칙
```
.claude/
├── agents/                 # 에이전트 정의 파일
│   └── [agent-name].md    # 전문 분야, 역량, 작업 원칙
├── skills/                 # 스킬 정의 디렉토리
│   └── [skill-name]/
│       └── SKILL.md       # YAML frontmatter + 마크다운
├── commands/               # 커스텀 슬래시 명령어
└── templates/              # 코드 생성 템플릿
```

## 🎯 성공 지표

### 1. 개발 생산성
- **코드 생성 속도**: 스킬을 통한 코드 생성 시간 50% 단축
- **반복 작업 감소**: 일반적인 개발 작업 80% 자동화
- **학습 곡선 단축**: 신규 개발자 적응 기간 60% 감소

### 2. 코드 품질
- **일관성**: 프로젝트 전체 코드 스타일 일관성 95%
- **타입 안전성**: TypeScript 적용률 100%
- **테스트 커버리지**: 핵심 로직 커버리지 85%+

### 3. 개발자 경험
- **만족도**: 개발자 도구 만족도 4.5/5.0
- **지식 전달**: 에이전트를 통한 학습 효과 측정
- **협업 효율**: 팀원 간 협업 효율성 향상

## 🔮 확장 계획

### 단기 계획 (1-2개월)
1. **스킬 확장**: 2-3개 추가 스킬 개발
   - Test Data Generator
   - Performance Monitor
   - Error Boundary Generator

2. **에이전트 개선**: 기존 에이전트 성능 최적화
   - 더 구체적인 코드 예시 추가
   - 에러 처리 및 디버깅 기능 강화

### 중기 계획 (3-6개월)
1. **새로운 에이전트 추가**:
   - DevOps Specialist
   - Security Analyst
   - Performance Optimization Expert

2. **스킬 마켓플레이스**: 재사용 가능한 스킬 라이브러리 구축

### 장기 계획 (6개월+)
1. **자동화 파이프라인**: CI/CD와의 통합
2. **머신러닝 기반**: 코드 패턴 학습 및 추천
3. **팀 협업 기능**: 여러 개발자와의 협업 지원

## 📋 요구사항

### 기술적 요구사항
- **Claude Code**: 최신 버전의 Claude AI 플랫폼
- **Node.js**: 25.1.0+
- **TypeScript**: 5.7+
- **Git**: 버전 관리 시스템

### 환경 요구사항
- **개발 환경**: 로컬 개발 환경 설정
- **프로젝트 구조**: Turborepo 모노레포 구조
- **의존성 관리**: pnpm 패키지 매니저

### 보안 요구사항
- **민감 정보**: API 키, 비밀번호 등의 안전한 관리
- **접근 제어**: 에이전트 및 스킬 접근 권한 관리
- **코드 검토**: 생성된 코드의 보안 검토 프로세스

## ✅ 검수 기준

### 에이전트 품질 기준
- [ ] 전문 분야에 대한 명확한 정의
- [ ] 구체적인 역량 및 기술 스택 명시
- [ ] 실제 프로젝트에 적용 가능한 예시
- [ ] 일관된 형식 및 문서화

### 스킬 품질 기준
- [ ] 정확한 YAML frontmatter 형식
- [ ] 상세한 사용 지침 및 예시 코드
- [ ] 실제 동작하는 완전한 코드 생성
- [ ] 프로젝트 아키텍처와의 호환성

### 시스템 통합 기준
- [ ] README 문서화 완료
- [ ] 개발자 가이드 제공
- [ ] 사용 예시 및 튜토리얼
- [ ] 확장성 및 유지보수성 고려

---

**본 스펙은 라이어 게임 프로젝트의 AI 기반 개발 도우미 시스템에 대한 포괄적인 기술 명세입니다. 시스템은 지속적으로 개선되고 확장될 것입니다.**