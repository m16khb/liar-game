---
id: TECH-001
version: 0.1.0
status: active
created: 2025-10-12
updated: 2025-10-12
authors: ["@project-manager"]
---

# liar-game Technology Stack

## HISTORY

### v0.1.0 (2025-10-12)
- **INITIAL**: 실제 package.json 기반 기술 스택 정의
- **AUTHOR**: @project-manager
- **SCOPE**: Monorepo 도구 체인, Frontend/Backend 스택, 품질 게이트
- **SOURCE**: 실제 코드베이스 + 기획서 기술 요구사항

---

## @DOC:STACK-001 언어 & 런타임

### 주 언어 선택

- **언어**: TypeScript 5.7.2
- **버전**: TypeScript 5.7+, Node.js 20+
- **선택 이유**:
  - 전체 스택 타입 안전성 (프론트엔드 + 백엔드)
  - 런타임 에러 감소, IDE 자동완성 지원
  - Monorepo에서 타입 공유 용이
- **패키지 매니저**: pnpm 10.17.1
  - 선택 이유: npm 대비 2-3배 빠른 설치 속도, 디스크 공간 절약
  - workspace 기능으로 Monorepo 지원

### 런타임 환경

- **Node.js**: 20.0.0 이상 (LTS)
- **pnpm**: 9.0.0 이상
- **Monorepo 도구**: Turbo 2.3.3
  - 병렬 빌드, 증분 빌드, 원격 캐시 지원
  - `turbo run build` → 변경된 패키지만 빌드

### 멀티 플랫폼 지원

| 플랫폼 | 지원 상태 | 검증 도구 | 주요 제약 |
|--------|-----------|-----------|-----------|
| **macOS** | ✅ 완전 지원 | Node.js 20, pnpm | 없음 |
| **Linux** | ✅ 완전 지원 | Node.js 20, pnpm | 없음 |
| **Windows** | ✅ 지원 | Node.js 20, pnpm (WSL 권장) | pnpm 경로 이슈 (WSL로 완화) |
| **Docker** | ✅ 지원 | multi-stage build | 이미지 크기 최적화 필요 |

---

## @DOC:FRAMEWORK-001 핵심 프레임워크 & 라이브러리

### Frontend 스택 (apps/web)

**핵심 프레임워크**:
```json
{
  "dependencies": {
    "next": "^15.3.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/ssr": "^0.7.0",
    "@supabase/supabase-js": "^2.75.0"
  }
}
```

**개발 도구**:
```json
{
  "devDependencies": {
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.9.1",
    "vitest": "^3.2.4",
    "@vitest/coverage-v8": "^3.2.4",
    "jsdom": "^27.0.0",
    "typescript": "^5.7.2"
  }
}
```

**특징**:
- **Next.js 15**: App Router, SSR/CSR Hybrid, Turbopack
- **React 19**: 최신 기능 (Server Components, use hook)
- **Supabase SSR**: 서버/클라이언트 인증 통합
- **Vitest**: Jest 대비 2-3배 빠른 테스트

### Backend 스택 (apps/api)

**핵심 프레임워크**:
```json
{
  "dependencies": {
    "@nestjs/common": "^11.0.11",
    "@nestjs/core": "^11.0.11",
    "@nestjs/platform-fastify": "^11.0.11",
    "fastify": "^5.2.1",
    "@nestjs/typeorm": "^11.0.0",
    "typeorm": "^0.3.27",
    "pg": "^8.16.3",
    "ioredis": "^5.8.1",
    "@supabase/supabase-js": "^2.75.0"
  }
}
```

**개발 도구**:
```json
{
  "devDependencies": {
    "@nestjs/testing": "^11.1.6",
    "jest": "^30.2.0",
    "ts-jest": "^29.4.5",
    "typescript": "^5.7.2"
  }
}
```

**특징**:
- **NestJS 11**: 모듈화, 의존성 주입, WebSocket Gateway
- **Fastify 5**: Express 대비 2-3배 빠른 성능 (~2ms vs ~30ms)
- **TypeORM 0.3**: PostgreSQL ORM, 마이그레이션 지원
- **ioredis 5**: Redis 클라이언트, 클러스터 지원
- **Jest**: NestJS 공식 권장 테스트 프레임워크

### 공유 패키지 (packages/)

**types** (TypeScript 타입 정의):
```typescript
// packages/types/src/supabase-auth.ts
export interface SupabaseUser {
  id: string;
  email: string;
  oauth_provider: 'google' | 'github' | 'discord';
}
```

**constants** (상수):
```typescript
// packages/constants/src/game.ts
export const MAX_PLAYERS = 10;
export const MIN_PLAYERS = 4;
export const DISCUSSION_TIME = 180; // 3분
```

**ui** (공통 컴포넌트, ⏳ TODO):
```typescript
// packages/ui/src/Button.tsx
export const Button = ({ children, onClick }: ButtonProps) => { ... }
```

**config** (공유 설정):
```typescript
// packages/config/src/eslint.config.js
export default { ... }
```

### 빌드 시스템

- **빌드 도구**: Turbo 2.3.3
- **번들링**:
  - Frontend: Next.js Turbopack (dev), Webpack (build)
  - Backend: NestJS Webpack
- **타겟**:
  - Frontend: ES2020, 브라우저 (Chrome 90+, Safari 14+)
  - Backend: ES2022, Node.js 20+
- **성능 목표**: 전체 빌드 <3분, 증분 빌드 <30초

**빌드 명령어**:
```bash
pnpm build         # Turbo로 전체 빌드
pnpm dev           # 전체 개발 서버
pnpm test          # 전체 테스트
pnpm lint          # 전체 린트
pnpm type-check    # 전체 타입 체크
```

---

## @DOC:QUALITY-001 품질 게이트 & 정책

### 테스트 커버리지

- **목표**: 85% 이상
- **측정 도구**:
  - Frontend: Vitest + @vitest/coverage-v8
  - Backend: Jest + --coverage
- **실패 시 대응**:
  - PR 머지 차단 (CI/CD에서 자동 검증)
  - 커버리지 부족 파일 리포트 생성

**현재 상태** (2025-10-12):
- ✅ AUTH-002: 테스트 4개 작성 (supabase-oauth, anonymous, jwt-validation, profile-sync)
- ⏳ 전체 커버리지 측정 필요 (예상: 40-50%)
- 🎯 목표: 12개월 내 85% 달성

### 정적 분석

| 도구 | 역할 | 설정 파일 | 실패 시 조치 |
|------|------|-----------|--------------|
| **ESLint** | 코드 품질 검사 | `eslint.config.js` | PR 머지 차단 |
| **TypeScript** | 타입 검증 | `tsconfig.json` | 빌드 실패 |
| **Prettier** | 코드 포매팅 | `.prettierrc` | Pre-commit hook 자동 수정 |

**ESLint 규칙** (주요):
```javascript
// eslint.config.js
export default {
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['error', 'warn'] }],
  }
}
```

**TypeScript 설정** (strict 모드):
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

### 자동화 스크립트

```bash
# 품질 검사 파이프라인
pnpm test                  # Vitest + Jest 테스트
pnpm lint                  # ESLint 검사
pnpm type-check            # TypeScript 타입 검증
pnpm build                 # 빌드 검증
```

**Pre-commit Hook** (Husky + lint-staged):
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "vitest related --run"
    ]
  }
}
```

---

## @DOC:SECURITY-001 보안 정책 & 운영

### 비밀 관리

- **정책**: 모든 비밀은 환경변수 또는 Supabase Vault
- **도구**:
  - 개발: `.env.local` (gitignore 필수)
  - 프로덕션: Kubernetes Secrets 또는 Supabase Vault
- **검증**: `git-secrets` 또는 `truffleHog` (CI/CD)

**환경변수 예시**:
```bash
# .env.local (절대 커밋 금지)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_KEY=eyJxxx

DATABASE_URL=postgresql://user:pass@localhost:5432/liar_game
REDIS_URL=redis://localhost:6379
```

### 의존성 보안

```json
{
  "security": {
    "audit_tool": "pnpm audit",
    "update_policy": "주간 dependabot PR 확인",
    "vulnerability_threshold": "high 이상 즉시 수정"
  }
}
```

**보안 점검 명령어**:
```bash
pnpm audit                 # 취약점 스캔
pnpm audit --fix           # 자동 수정 (가능한 경우)
pnpm outdated              # 오래된 패키지 확인
```

### 로깅 정책

- **로그 수준**:
  - 개발: DEBUG
  - 테스트: INFO
  - 프로덕션: WARN + ERROR
- **민감정보 마스킹**:
  - 이메일: `user@example.com` → `u***@example.com`
  - JWT 토큰: 전체 마스킹
  - 비밀번호: 절대 로깅 금지
- **보존 정책**:
  - 개발: 로컬만, 삭제 불필요
  - 프로덕션: 30일 보존 (Grafana Loki)

**로거 설정** (NestJS):
```typescript
// apps/api/src/logger.config.ts
export const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  maskFields: ['password', 'token', 'secret'],
};
```

---

## @DOC:DEPLOY-001 배포 채널 & 전략

### 1. 배포 채널

- **주 채널**: Vercel (Frontend) + Railway (Backend)
  - 대안: Kubernetes on Mac mini M4 (기획서 원본)
- **릴리스 절차**:
  1. `main` 브랜치에 PR 머지
  2. CI/CD 자동 빌드 + 테스트
  3. 통과 시 자동 배포 (Vercel + Railway)
- **버전 정책**: Semantic Versioning (0.x.y → 1.0.0)
  - v0.x.y: 개발 버전
  - v1.0.0: 정식 런칭 (사용자 승인 필수)
- **rollback 전략**: Vercel/Railway 대시보드에서 원클릭 롤백

### 2. 개발 설치

```bash
# 개발자 모드 설정
git clone https://github.com/your-org/liar-game.git
cd liar-game
pnpm install              # 의존성 설치
pnpm dev                  # 전체 개발 서버 실행
```

**개별 앱 실행**:
```bash
cd apps/web && pnpm dev   # Frontend only (포트 3000)
cd apps/api && pnpm dev   # Backend only (포트 3001)
```

### 3. CI/CD 파이프라인

| 단계 | 목적 | 사용 도구 | 성공 조건 |
|------|------|-----------|-----------|
| **Lint** | 코드 품질 | ESLint | 모든 린트 규칙 통과 |
| **Type Check** | 타입 검증 | TypeScript | 타입 에러 0개 |
| **Test** | 테스트 실행 | Vitest + Jest | 모든 테스트 통과, 커버리지 ≥85% |
| **Build** | 빌드 검증 | Turbo | 빌드 에러 0개 |
| **Deploy** | 배포 | Vercel + Railway | 배포 성공 |

**GitHub Actions 워크플로우** (⏳ TODO):
```yaml
# .github/workflows/ci.yml
name: CI/CD
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test
      - run: pnpm build
```

---

## 환경별 설정

### 개발 환경 (`dev`)

```bash
export NODE_ENV=development
export LOG_LEVEL=debug
pnpm dev                  # Hot-reload 활성화
```

**특징**:
- Hot-reload (Next.js Fast Refresh, NestJS Watch 모드)
- 상세한 에러 스택 표시
- Supabase Local 개발 환경 (선택)

### 테스트 환경 (`test`)

```bash
export NODE_ENV=test
export LOG_LEVEL=info
pnpm test                 # CI/CD에서 실행
```

**특징**:
- In-memory Database (SQLite) 또는 Test Container
- 모든 외부 API 모킹 (MSW)
- 결정적 테스트 (시간/랜덤 고정)

### 프로덕션 환경 (`production`)

```bash
export NODE_ENV=production
export LOG_LEVEL=warn
pnpm build && pnpm start  # 최적화 빌드
```

**특징**:
- 소스맵 제거, 코드 난독화
- Error Boundary로 에러 캡처
- 성능 모니터링 (Prometheus + Grafana)

---

## @CODE:TECH-DEBT-001 기술 부채 관리

### 현재 기술 부채 (2025-10-12)

1. **테스트 커버리지 목표 85% 미달** (우선순위: High)
   - 현재: 예상 40-50%
   - 목표: 85% 이상
   - 계획: 각 SPEC 구현 시 테스트 작성 (TDD)

2. **E2E 테스트 미비** (우선순위: Medium)
   - 현재: 단위 테스트만 존재
   - 목표: Playwright 기반 E2E 테스트
   - 계획: SPEC-TEST-E2E-001 작성

3. **API 문서 자동화 부재** (우선순위: Medium)
   - 현재: 수동 문서 작성
   - 목표: Swagger (NestJS) 자동 생성
   - 계획: @nestjs/swagger 통합

4. **모니터링 시스템 미구축** (우선순위: Low)
   - 현재: 로컬 로그만
   - 목표: Prometheus + Grafana
   - 계획: SPEC-INFRA-MONITOR-001

5. **의존성 버전 고정 미흡** (우선순위: Low)
   - 현재: `^` prefix 사용 (자동 마이너 업데이트)
   - 목표: `pnpm-lock.yaml` 엄격 관리
   - 계획: Renovate Bot 도입

### 개선 계획

**단기 (1개월)**:
- [ ] 테스트 커버리지 60% 달성 (AUTH, ROOM, GAME 모듈)
- [ ] Swagger API 문서 자동 생성
- [ ] Pre-commit Hook 설정 (Husky + lint-staged)

**중기 (3개월)**:
- [ ] 테스트 커버리지 85% 달성
- [ ] E2E 테스트 10개 작성 (핵심 플로우)
- [ ] Prometheus + Grafana 통합

**장기 (6개월+)**:
- [ ] 부하 테스트 (k6) 기반 성능 벤치마크
- [ ] 보안 감사 (Snyk, SonarQube)
- [ ] Kubernetes 배포 (Mac mini M4)

---

## EARS 기술 요구사항 작성법

### 기술 스택에서의 EARS 활용

기술적 의사결정과 품질 게이트 설정 시 EARS 구문을 활용하여 명확한 기술 요구사항을 정의하세요:

#### 기술 스택 EARS 예시
```markdown
### Ubiquitous Requirements (기본 기술 요구사항)
- 시스템은 TypeScript 타입 안전성을 보장해야 한다
- 시스템은 크로스 플랫폼 호환성을 제공해야 한다

### Event-driven Requirements (이벤트 기반 기술)
- WHEN 코드가 커밋되면, 시스템은 자동으로 테스트를 실행해야 한다
- WHEN 빌드가 실패하면, 시스템은 개발자에게 즉시 알림을 보내야 한다

### State-driven Requirements (상태 기반 기술)
- WHILE 개발 모드일 때, 시스템은 hot-reload를 제공해야 한다
- WHILE 프로덕션 모드일 때, 시스템은 최적화된 빌드를 생성해야 한다

### Optional Features (선택적 기술)
- WHERE Docker 환경이면, 시스템은 컨테이너 기반 배포를 지원할 수 있다
- WHERE CI/CD가 구성되면, 시스템은 자동 배포를 수행할 수 있다

### Constraints (기술적 제약사항)
- IF 의존성에 보안 취약점이 발견되면, 시스템은 빌드를 중단해야 한다
- 테스트 커버리지는 85% 이상을 유지해야 한다
- 빌드 시간은 5분을 초과하지 않아야 한다
```

### 실제 적용 예시 (AUTH-002 기반)

```markdown
### Ubiquitous Requirements
- 시스템은 Supabase Auth SDK를 사용해야 한다 (NestJS + Next.js)

### Event-driven Requirements
- WHEN OAuth 콜백이 수신되면, 시스템은 Supabase로 토큰을 교환해야 한다

### State-driven Requirements
- WHILE 세션이 유효할 때, 시스템은 자동으로 토큰을 갱신해야 한다

### Constraints
- IF 세션 검증이 실패하면, 시스템은 로그인 페이지로 리다이렉트해야 한다
- OAuth 로그인 성공률은 95% 이상을 유지해야 한다
```

---

_이 기술 스택은 `/alfred:2-build` 실행 시 TDD 도구 선택과 품질 게이트 적용의 기준이 됩니다._
