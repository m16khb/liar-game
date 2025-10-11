# 🎭 Liar Game

웹 기반 실시간 멀티플레이어 추리 게임 - MoAI-ADK로 구축된 모노레포 프로젝트

## 📖 프로젝트 소개

Liar Game은 6명의 플레이어가 참여하는 실시간 추리 게임입니다. 한 명의 Liar를 제외한 모든 플레이어는 제시어를 받고, Liar는 제시어를 모르는 상태로 토론에 참여합니다. 플레이어들은 대화를 통해 Liar를 찾아내거나, Liar는 제시어를 추리하여 승리합니다.

## 🛠️ 기술 스택

### 모노레포 구조 (Turborepo)
- **빌드 시스템**: Turborepo 2.x
- **패키지 매니저**: pnpm 9.x
- **워크스페이스**: apps (애플리케이션) + packages (공유 라이브러리)

### 프론트엔드 (apps/web)
- **프레임워크**: Next.js 15.5 (App Router)
- **런타임**: Node.js 20.x LTS
- **스타일링**: CSS Modules / Tailwind CSS (예정)
- **상태 관리**: React Context API / Zustand (예정)

### 백엔드 (apps/api)
- **프레임워크**: NestJS 11.x
- **HTTP 어댑터**: Fastify (고성능)
- **실시간 통신**: Socket.IO (WebSocket)
- **데이터베이스**: PostgreSQL 16.x (영구 저장)
- **캐싱**: Redis 7.x (세션 관리)
- **인증**: JWT + bcrypt (게스트/회원 2단계)

### 공유 패키지 (packages/*)
- **types**: TypeScript 타입 정의 (프론트-백엔드 공유)
- **config**: ESLint, TSConfig, Prettier 설정
- **ui**: 공유 React 컴포넌트
- **constants**: 게임 상수, Socket.IO 이벤트 정의

## 🚀 빠른 시작

### 사전 요구사항
- Node.js 20.x LTS
- pnpm 9.x
- **Docker 24.x+ & Docker Compose V2** (인프라 자동 구성)
- Git 2.x

### 1. 인프라 시작 (Docker Compose)

Docker Compose로 전체 인프라를 한 번에 시작합니다:

```bash
# 환경 변수 설정 (.env.example 복사)
cp .env.example .env
# → POSTGRES_PASSWORD, REDIS_PASSWORD, MINIO_ROOT_PASSWORD 변경 필수

# 전체 인프라 시작 (PostgreSQL, Redis, Nginx, MinIO)
docker compose up -d

# 인프라 상태 확인
docker compose ps

# 서비스별 로그 확인
docker compose logs -f postgres
docker compose logs -f redis
```

**인프라 구성**:
- **PostgreSQL 16**: `localhost:5432` (게임 데이터, 사용자 정보)
- **Redis 7**: `localhost:6379` (세션 관리, 캐싱)
- **Nginx 1.25**: `localhost:80/443` (리버스 프록시, API 라우팅)
- **MinIO**: `localhost:9000` (S3 스토리지), `localhost:9001` (콘솔)

**데이터 영속성**: `docker/volumes/` 디렉토리에 모든 데이터 저장

### 2. 애플리케이션 실행

```bash
# 의존성 설치
pnpm install

# 데이터베이스 마이그레이션 (PostgreSQL 준비 완료 후)
cd apps/api
pnpm migration:run

# 개발 서버 실행 (병렬)
cd ../..
pnpm turbo dev
# → web: http://localhost:3000
# → api: http://localhost:4000 (Nginx를 통해 http://localhost/api로도 접근 가능)
```

### 3. 개발 워크플로우

```bash
# 프로덕션 빌드
pnpm turbo build

# 테스트 실행
pnpm test

# 린트 및 타입 체크
pnpm turbo lint
pnpm turbo type-check

# 인프라 종료 (데이터 유지)
docker compose stop

# 인프라 완전 삭제 (볼륨 포함)
docker compose down -v
```

### 개별 앱 실행

```bash
# 프론트엔드만 실행
cd apps/web
pnpm dev

# 백엔드만 실행
cd apps/api
pnpm start:dev
```

## 📁 디렉토리 구조

```
liar-game/
├── apps/
│   ├── web/                    # Next.js 15 프론트엔드
│   │   ├── src/
│   │   │   ├── app/           # App Router (페이지)
│   │   │   ├── components/    # React 컴포넌트
│   │   │   ├── hooks/         # 커스텀 훅
│   │   │   └── lib/           # 유틸리티 함수
│   │   └── package.json
│   └── api/                    # NestJS 11 백엔드
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── game/          # 게임 로직 모듈
│       │   ├── match/         # 매칭 시스템
│       │   ├── user/          # 사용자 관리
│       │   └── gateway/       # WebSocket Gateway
│       └── package.json
├── packages/
│   ├── types/                  # 공유 타입 정의
│   ├── config/                 # ESLint, TSConfig, Prettier
│   ├── ui/                     # 공유 React 컴포넌트
│   └── constants/              # 게임 상수, 이벤트 정의
├── .moai/                      # MoAI-ADK 설정 및 문서
│   ├── specs/                  # SPEC 문서 (EARS 방식)
│   ├── memory/                 # 개발 가이드, TRUST 원칙
│   ├── project/                # 프로젝트 메타 정보
│   ├── indexes/                # TAG 인덱스
│   └── reports/                # 동기화 보고서
├── docs/                       # 프로젝트 문서
│   └── architecture/           # 아키텍처 다이어그램
├── tests/                      # 통합 테스트
├── turbo.json                  # Turborepo 파이프라인
├── pnpm-workspace.yaml         # pnpm 워크스페이스
└── package.json                # 루트 패키지
```

## 📚 문서

### 개발 문서
- **[개발 가이드](.moai/memory/development-guide.md)**: TRUST 원칙, TDD 워크플로우, @TAG 시스템
- **[아키텍처 문서](docs/architecture/)**:
  - [모노레포 아키텍처](docs/architecture/monorepo.md)
  - [인증 시스템 아키텍처](docs/architecture/authentication.md)
  - [인프라 아키텍처](docs/infrastructure.md): Docker Compose 기반 인프라 통합 (PostgreSQL, Redis, Nginx, MinIO)
- **[API 문서](docs/api/)**:
  - [인증 API](docs/api/auth.md): 게스트/회원 인증, JWT 토큰 관리
- **[SPEC 문서](.moai/specs/)**:
  - [SPEC-SETUP-001](.moai/specs/SPEC-SETUP-001/spec.md): 모노레포 기반 구조
  - [SPEC-AUTH-001](.moai/specs/SPEC-AUTH-001/spec.md): 사용자 인증 및 세션 관리
  - [SPEC-INFRA-001](.moai/specs/SPEC-INFRA-001/spec.md): Docker Compose 기반 인프라 통합

### 프로젝트 관리
- **[프로젝트 정의](.moai/project/product.md)**: 제품 미션, 사용자, 문제 정의
- **[기술 스택](.moai/project/tech.md)**: 언어, 프레임워크, 품질 게이트, 배포 전략
- **[프로젝트 구조](.moai/project/structure.md)**: 디렉토리 구조, 모듈 의존성

## 🔐 인증 시스템

liar-game은 **Supabase Auth**를 사용한 안전하고 확장 가능한 인증 시스템을 제공합니다.

### 지원되는 인증 방식

**1. 소셜 로그인 (추천)**:
- **Google OAuth 2.0**: Gmail 계정으로 빠른 로그인
- **GitHub OAuth 2.0**: 개발자 친화적 인증
- **Discord OAuth 2.0**: 게이머 커뮤니티 통합

**2. Anonymous 인증 (게스트 플레이)**:
- 닉네임 입력 없이 즉시 게임 시작
- 게임 종료 후 소셜 계정 연동 옵션
- 진행 상황 100% 유지

**3. 기존 JWT 인증 (레거시)**:
- 이메일 + 비밀번호 로그인
- 게스트 → 회원 전환 지원
- 마이그레이션 가이드: [auth-v1-to-v2.md](docs/migration/auth-v1-to-v2.md)

### 환경 변수 설정

.env 파일에 다음 변수를 추가하세요:

```bash
# Supabase 설정
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Next.js 프론트엔드용
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 빠른 시작

#### Supabase 프로젝트 생성

1. https://supabase.com 접속
2. "New Project" 클릭
3. 프로젝트 이름 및 데이터베이스 비밀번호 설정
4. API Settings에서 URL과 Key 복사

#### OAuth 프로바이더 설정

**Google OAuth**:
1. Google Cloud Console에서 OAuth Client ID 생성
2. Supabase 대시보드 → Authentication → Providers → Google
3. Client ID와 Secret 입력

**GitHub/Discord**:
- 동일한 방식으로 Supabase 대시보드에서 설정

#### 애플리케이션 실행

```bash
# 환경 변수 설정
cp .env.example .env
# → SUPABASE_URL, SUPABASE_ANON_KEY 입력

# 인프라 시작 (Docker Compose)
docker compose up -d

# 애플리케이션 실행
pnpm install
pnpm turbo dev
```

### 보안 특징

- **RLS (Row Level Security)**: PostgreSQL 레벨에서 자동 권한 제어
- **자동 토큰 갱신**: Supabase SDK가 만료 전 자동 갱신
- **PKCE 플로우**: 중간자 공격 방어 (OAuth)
- **감사 로그**: Supabase 대시보드에서 모든 인증 이벤트 확인

**자세한 내용**:
- [인증 API 문서](docs/api/auth.md)
- [아키텍처 설계](docs/architecture/authentication.md)
- [마이그레이션 가이드](docs/migration/auth-v1-to-v2.md)

---

## 🧪 테스트

### 테스트 전략
- **단위 테스트**: Vitest (프론트엔드), Jest (백엔드)
- **통합 테스트**: 모노레포 루트 `tests/` 디렉토리
- **커버리지 목표**: 85% 이상

### 테스트 실행

```bash
# 전체 테스트
pnpm test

# 특정 패키지 테스트
pnpm --filter @liar-game/types test

# 커버리지 포함
pnpm turbo test -- --coverage
```

## 🔄 MoAI-ADK 워크플로우

본 프로젝트는 **MoAI-Agentic Development Kit (MoAI-ADK)**를 사용하여 개발됩니다.

### 3단계 개발 사이클

```bash
# 1단계: SPEC 작성 (EARS 방식)
/alfred:1-spec "새로운 기능"

# 2단계: TDD 구현 (RED → GREEN → REFACTOR)
/alfred:2-build SPEC-{ID}

# 3단계: 문서 동기화 (Living Document)
/alfred:3-sync
```

### @TAG 추적 시스템
- **@SPEC**: 요구사항 명세
- **@TEST**: 테스트 케이스
- **@CODE**: 구현 코드
- **@DOC**: 문서화

**예시**:
```
@SPEC:SETUP-001 → @TEST:SETUP-001 → @CODE:SETUP-001 → @DOC:SETUP-001
```

## 🧑‍💻 개발 가이드

### TRUST 5원칙
- **T**est First: 테스트 우선 개발 (TDD)
- **R**eadable: 읽기 쉬운 코드 (린터 적용)
- **U**nified: 통합된 타입 시스템 (TypeScript strict mode)
- **S**ecured: 보안 취약점 제로
- **T**rackable: @TAG 기반 추적성

### 코드 규칙
- 파일 ≤300 LOC
- 함수 ≤50 LOC
- 매개변수 ≤5개
- 복잡도 ≤10
- 테스트 커버리지 ≥85%

### Git 커밋 메시지
```bash
🔴 RED: [테스트 설명]
🟢 GREEN: [구현 설명]
♻️ REFACTOR: [개선 설명]
📝 DOCS: [문서 설명]
```

## 📦 배포

### 프로덕션 빌드

```bash
# 전체 빌드
pnpm turbo build

# 빌드 결과 확인
ls -la apps/web/.next/
ls -la apps/api/dist/
```

### 배포 환경
- **프론트엔드**: Custom Node.js 서버 (Vercel 불가 - WebSocket 제약)
- **백엔드**: Dockerized NestJS + Fastify
- **권장 플랫폼**: AWS Fargate, Railway, Fly.io

## 🤝 기여 가이드

1. 이슈 생성 또는 SPEC 문서 작성
2. 브랜치 생성: `feature/SPEC-{ID}`
3. TDD 구현 (RED → GREEN → REFACTOR)
4. 문서 동기화 (`/alfred:3-sync`)
5. Pull Request 생성

## 📄 라이선스

(라이선스 정보 추가 예정)

## 📞 문의

- **프로젝트 관리자**: @Goos
- **이슈 트래커**: GitHub Issues
- **문서 기여**: Pull Request 환영

---

**Built with MoAI-ADK** 🚀 | SPEC-First TDD Development
