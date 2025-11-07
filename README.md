# 🎭 Liar Game

웹 기반 실시간 멀티플레이어 추리 게임 - Turborepo 기반 모노레포 프로젝트

## 📖 프로젝트 소개

Liar Game은 6명의 플레이어가 참여하는 실시간 추리 게임입니다. 한 명의 Liar를 제외한 모든 플레이어는 제시어를 받고, Liar는 제시어를 모르는 상태로 토론에 참여합니다. 플레이어들은 대화를 통해 Liar를 찾아내거나, Liar는 제시어를 추리하여 승리합니다.

## 🎯 현재 상태

**✅ 기반 기술 스택 완료**: Turborepo 기반 모노레포 구조, TypeScript 5.7.x, NestJS 11 + Fastify, React 18 + Compiler
**✅ 인증 시스템 명세화 완료**: Supabase 기반 인증 시스템 역설계 및 완전한 기술 명서 작성
**🔧 개발 준비 완료**: 70개 구체적인 개발 태스크로 즉시 개발 시작 가능

## 🛠️ 기술 스택

### 모노레포 구조 (Turborepo)
- **빌드 시스템**: Turborepo 2.x
- **패키지 매니저**: pnpm 10.x
- **워크스페이스**: apps (애플리케이션) + packages (공유 라이브러리)

### 프론트엔드 (apps/web)
- **프레임워크**: React 18 + Compiler ⚡
- **번들러**: Vite
- **런타임**: Node.js 25.1.0
- **스타일링**: CSS Modules / Tailwind CSS
- **상태 관리**: React Context API / Zustand

### 백엔드 (apps/api)
- **프레임워크**: NestJS 11.x + Fastify (고성능 HTTP 서버) 🚀
- **실시간 통신**: Socket.IO (WebSocket)
- **데이터베이스**: MySQL v8 LTS (영구 저장)
- **캐싱**: Redis v8 LTS (세션 관리)
- **인증**: Supabase Auth (OAuth + Email) + JWT Custom Claims

### 공유 패키지 (packages/*)
- **types**: TypeScript 타입 정의 (프론트-백엔드 공유)
- **config**: ESLint, TSConfig, Prettier 설정
- **ui**: 공유 React 컴포넌트
- **constants**: 게임 상수, Socket.IO 이벤트 정의

## 🚀 빠른 시작

### 사전 요구사항
- Node.js 25.1.0+
- pnpm 10.x+
- **Docker** (Kubernetes 클러스터)
- **kubectl** (Kubernetes CLI)
- Git 2.x

### 1. 인프라 시작 (Kubernetes)

Kubernetes로 전체 인프라를 배포합니다:

```bash
# 환경 변수 설정
cp .env.example .env
# → DB_PASSWORD, REDIS_PASSWORD, JWT_SECRET 변경 필수

# k8s 네임스페이스 생성
kubectl create namespace liar-game

# 데이터베이스 배포 (MySQL + Redis)
kubectl apply -f k8s/databases/

# 인프라 상태 확인
kubectl get pods -n liar-game
kubectl get services -n liar-game

# 데이터베이스 연결 테스트
kubectl port-forward -n liar-game svc/mysql 3306:3306
kubectl port-forward -n liar-game svc/redis 6379:6379

# 데이터베이스 마이그레이션
cd apps/api && pnpm migration:run && cd ../..
```

**인프라 구성**:
- **MySQL v8 LTS**: ClusterIP 서비스, `liar-game` 네임스페이스
- **Redis v8 LTS**: ClusterIP 서비스, `liar-game` 네임스페이스
- **PersistentVolume**: 데이터 영속성 보장 (MySQL 10Gi, Redis 5Gi)


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

# 인프라 중지
kubectl delete -f k8s/databases/

# 인프라 완전 삭제 (PVC 포함)
kubectl delete namespace liar-game --ignore-not-found=true
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
│   ├── web/                    # React 18 + Compiler 프론트엔드
│   │   ├── src/
│   │   │   ├── components/    # React 컴포넌트
│   │   │   ├── hooks/         # 커스텀 훅
│   │   │   ├── pages/         # 페이지 컴포넌트
│   │   │   └── lib/           # 유틸리티 함수
│   │   ├── index.html         # HTML 템플릿
│   │   ├── vite.config.ts     # Vite 설정
│   │   └── package.json
│   └── api/                    # NestJS 11 + Fastify 백엔드
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
├── docs/                       # 프로젝트 문서
│   └── architecture/           # 아키텍처 다이어그램
├── tests/                      # 통합 테스트
├── turbo.json                  # Turborepo 파이프라인
├── pnpm-workspace.yaml         # pnpm 워크스페이스
└── package.json                # 루트 패키지
```

## 📚 문서

### 🎯 개발 스펙 (最新)
- **[specs/](specs/)**: 현대적 스펙 관리 시스템
  - **001-project-foundation**: 프로젝트 기반 기술 명세
  - **001-supabase-auth**: Supabase 인증 시스템 완전 명세
    - 5개 사용자 스토리 (이메일, OAuth, 토큰 관리, 프로필, 검색)
    - 12개 API 엔드포인트 OpenAPI 명세
    - 70개 구체적인 개발 태스크

### 🏗️ 프로젝트 헌법
- **[CONSTITUTION.md](CONSTITUTION.md)**: 프로젝트 개발 원칙 및 기술 가이드라인
  - 한국어 우선 원칙
  - SOLID 원칙 준수
  - TypeORM 외키 제약 조건 및 마이그레이션 관리
  - 코드 품질 기준 (파일 ≤300 LOC, 함수 ≤50 LOC)

### 🔍 빠른 시작 가이드
- **[Quickstart Guide](specs/001-supabase-auth/quickstart.md)**: 개발자를 위한 상세 시작 가이드
- **[연구 보고서](specs/001-supabase-auth/research.md)**: Supabase 인증 Best Practices

## 🔐 인증 시스템

liar-game은 **Supabase Auth**를 사용한 안전하고 확장 가능한 인증 시스템을 제공합니다.

### 🚀 지원되는 인증 방식

**1. 소셜 로그인 (PKCE Flow 보안 강화)**:
- **Google OAuth 2.0**: Gmail 계정으로 빠른 로그인
- **GitHub OAuth 2.0**: 개발자 친화적 인증
- **Discord OAuth 2.0**: 게이머 커뮤니티 통합

**2. 이메일 로그인**:
- 이메일 + 비밀번호 전통 인증
- 안전한 비밀번호 해싱
- 이메일 인증 지원

**3. 자동 토큰 갱신**:
- Refresh Token Rotation 보안 강화
- 24시간 세션 자동 관리
- 다중 디바이스 지원

### 환경 변수 설정

.env 파일에 다음 변수를 추가하세요:

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=liaruser
DB_PASSWORD=change-this-password
DB_NAME=liardb

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=change-this-redis-password

# JWT
JWT_SECRET=your-jwt-secret

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 🚀 개발 시작하기

#### Supabase 프로젝트 설정 (5분)

1. [Supabase](https://supabase.com)에서 신규 프로젝트 생성
2. Authentication → Providers에서 Google/GitHub/Discord OAuth 설정
3. Project Settings → API에서 URL과 Keys 복사하여 .env에 추가

#### 1단계: 개발 환경 준비

```bash
# 환경 변수 설정
cp .env.example .env
# → DB_PASSWORD, REDIS_PASSWORD, JWT_SECRET 변경 필수

# 인프라 시작 (MySQL, Redis)
kubectl apply -f k8s/databases/

# 데이터베이스 마이그레이션
cd apps/api && pnpm migration:run && cd ../..
```

#### 2단계: 애플리케이션 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm turbo dev
# → 웹: http://localhost:3000
# → API: http://localhost:4000 (Swagger: /api/docs)
```

### 🔒 보안 특징

- **PKCE Flow**: OAuth 인증 시 중간자 공격 방어
- **Refresh Token Rotation**: 탈취된 토큰 자동 폐지
- **Custom JWT Claims**: Backend 사용자 정보 포함
- **Rate Limiting**: IP/사용자 기반 접근 제어
- **소프트 딜리트**: 데이터 보존을 위한 계정 비활성화

**자세한 내용**:
- [인증 시스템 명세](specs/001-supabase-auth/)
- [데이터 모델 정의](specs/001-supabase-auth/data-model.md)
- [API 명세서](specs/001-supabase-auth/contracts/openapi.yaml)

---

## 🧪 테스트 전략

### 단위 테스트 중심 (프로젝트 헌법)
- **백엔드**: Jest 단위 테스트만 허용 (통합 테스트는 WebSocket 시나리오로 제한)
- **프론트엔드**: Vitest 단위 테스트
- **커버리지 목표**: 85% 이상 (핵심 로직 집중)

### 테스트 실행

```bash
# 전체 테스트
pnpm turbo test

# 백엔드 테스트만
pnpm --filter @liar-game/api test

# 커버리지 포함
pnpm turbo test -- --coverage
```

## 🧑‍💻 개발 가이드

### 코드 품질 기준 (프로젝트 헌법)
- **파일 크기**: ≤300 LOC (단일 책임 원칙)
- **함수 크기**: ≤50 LOC (단일 기능 수행)
- **매개변수**: ≤5개 (인터페이스 분리 원칙)
- **복잡도**: ≤10 (제어 흐름 단순화)
- **테스트 커버리지**: ≥85% (핵심 로직)
- **의존성**: 최소화하고 인터페이스 기반 설계

### 🎯 개발 태스크 기반
- **70개 구체적인 태스크**: [specs/001-supabase-auth/tasks.md](specs/001-supabase-auth/tasks.md)
- **독립적 배포 가능**: 각 사용자 스토리별 MVP 제공
- **병렬 개발 지원**: Foundation 완료 후 여러 팀원 동시 작업
- **단위 테스트 우선**: RED-GREEN-REFACTOR 사이클 준수

## 🚀 배포

### 쿠버네티스 배포 준비

프로젝트는 쿠버네티스 배포를 위한 템플릿을 포함하고 있습니다:

```bash
# 전체 빌드
pnpm turbo build

# 배포 템플릿 확인
ls -la k8s/*.template
ls -la nginx/*.template
```

**보안 설정 (중요)**:
- `k8s/infra.yaml`와 `nginx/nginx.conf`는 민감 정보 포함
- `.gitignore`에 추가되어 Git에 올리지 않음
- 배포 시 템플릿 복사 후 실제 환경에 맞게 수정 필요

**배포 구성**:
- **k8s/infra.yaml.template**: MySQL v8 + Redis v8 쿠버네티스 설정
- **nginx/nginx.conf.template**: 리버스 프록시 설정 템플릿
- **권장 플랫폼**: AWS EKS, Google GKE, Azure AKS

**배포 절차**:
1. 템플릿 복사: `cp k8s/infra.yaml.template k8s/infra.yaml`
2. 비밀번호 설정: Base64 인코딩으로 비밀번호 업데이트
3. 환경별 설정 적용 후 배포

### 프로덕션 환경
- **프론트엔드**: Vite 빌드 결과물 (정적 파일)
- **백엔드**: Dockerized NestJS + Fastify API 서버
- **데이터베이스**: MySQL v8 LTS (영구 저장)
- **캐시**: Redis v8 LTS (세션 관리)

## 🎯 개발 로드맵

### 현재 상태 (2025-11)
- ✅ **기반 기술 스택**: Turborepo, TypeScript 5.7.x, NestJS 11 + Fastify, React 18 + Compiler
- ✅ **인증 시스템 명세**: Supabase 기반 완전한 기술 명서
- 🔄 **개발 준비**: 70개 실행 가능한 태스크

### 다음 단계
1. **이메일 인증 MVP** (User Story 1): 2주
2. **소셜 로그인** (User Story 2): 1주
3. **게임 방 생성** (차기 스펙): 3주
4. **실시간 게임 플레이** (차기 스펙): 4주

## 🤝 기여 가이드

### 개발 시작하기
1. [이슈 생성](https://github.com/m16khb/liar-game/issues) 또는 기능 제안
2. 브랜치 생성: `feature/feature-name`
3. **단위 테스트 우선**: RED → GREEN → REFACTOR 사이클
4. 프로젝트 헌법 준수 확인: [CONSTITUTION.md](CONSTITUTION.md)
5. Pull Request 생성

### 현재 기여 가능 영역
- **인증 시스템**: [tasks.md](specs/001-supabase-auth/tasks.md) 태스크 기반 기여
- **게임 로직**: 라이어 게임 규칙 구현
- **UI/UX**: 게임 인터페이스 설계
- **인프라**: 쿠버네티스 배포 최적화

## 📄 라이선스

MIT License (예정)

## 📞 문의

- **프로젝트 관리자**: @m16khb
- **이슈 트래커**: [GitHub Issues](https://github.com/m16khb/liar-game/issues)
- **개발 스펙**: [specs/](specs/) 디렉토리

---

**🚀 Built with TypeScript 5.7.x, React 18 + Compiler, NestJS 11 + Fastify, Supabase Auth**
**📝 Modern development with specs, tasks, and single-responsibility architecture**
