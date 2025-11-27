# Liar Game - 기술 문서

## 기술 스택

### 언어 및 프레임워크

#### 백엔드
- **언어**: TypeScript 5.7.2
- **프레임워크**: NestJS 11.x
- **플랫폼**: Fastify 5.x (고성능 HTTP 서버)
- **실시간 통신**: Socket.IO 4.8.1
- **인증**: Supabase Auth + JWT
- **데이터베이스**: MySQL (TypeORM 0.3.20)
- **캐시**: Redis 7.x

#### 프론트엔드
- **언어**: TypeScript 5.7.2
- **프레임워크**: React 19
- **컴파일러**: React Compiler (babel-plugin-react-compiler 1.0.0)
- **번들러**: Vite 6.x
- **상태 관리**: React Context + useReducer
- **스타일링**: Tailwind CSS 3.4.x
- **라우팅**: React Router v7.9.5
- **HTTP 클라이언트**: Socket.IO Client 4.8.1

#### 개발 도구
- **패키지 매니저**: pnpm 10.17.1
- **모노레포**: Turborepo 2.6.1
- **Node.js**: 24.x 이상
- **타입 검사**: TypeScript 5.7.2
- **코드 포맷팅**: Prettier
- **린팅**: ESLint 9.x

### 라이브러리 버전 상세

#### 백엔드 주요 라이브러리
```json
{
  "@nestjs/common": "^11.0.10",
  "@nestjs/core": "^11.0.10",
  "@nestjs/platform-fastify": "^11.0.10",
  "@nestjs/websockets": "^11.1.6",
  "@nestjs/platform-socket.io": "^11.1.8",
  "@nestjs/typeorm": "^11.0.0",
  "@nestjs/config": "^4.0.0",
  "@nestjs/jwt": "^11.0.1",
  "@nestjs/passport": "^11.0.5",
  "@nestjs/swagger": "^11.2.1",
  "@supabase/supabase-js": "^2.45.7",
  "@fastify/cors": "^11.1.0",
  "@fastify/helmet": "^13.0.2",
  "@fastify/swagger": "^9.5.2",
  "socket.io": "^4.8.1",
  "typeorm": "^0.3.20",
  "mysql2": "^3.11.5",
  "fastify": "^5.6.1",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^6.0.0",
  "class-validator": "^0.14.1",
  "class-transformer": "^0.5.1"
}
```

#### 프론트엔드 주요 라이브러리
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.9.5",
  "@vitejs/plugin-react": "^4.3.4",
  "vite": "^6.0.3",
  "tailwindcss": "^3.4.18",
  "autoprefixer": "^10.4.21",
  "postcss": "^8.5.6",
  "socket.io-client": "^4.8.1",
  "@supabase/supabase-js": "^2.45.7",
  "dayjs": "^1.11.13",
  "babel-plugin-react-compiler": "^1.0.0"
}
```

#### 테스트 라이브러리
```json
{
  "jest": "^30.2.0",
  "ts-jest": "^29.4.5",
  "vitest": "^2.1.8",
  "@nestjs/testing": "^11.0.10",
  "supertest": "^7.0.0"
}
```

## 개발 환경 및 빌드 도구

### 개발 환경 설정
- **IDE**: VS Code (추천 확장: TypeScript, NestJS, ESLint, Prettier)
- **환경 변수 관리**: `.env` 파일 (로컬), 시크릿 매니저 (프로덕션)
- **Docker**: 개발 환경 컨테이너화
- **포트 설정**: API (3001), Web (3000), MySQL (3306), Redis (6379)

### 빌드 프로세스
```bash
# 개발 서버
pnpm dev               # 전체 앱 개발 모드 (Turborepo)
pnpm web:dev           # 프론트엔드만 개발 모드
pnpm api:dev           # 백엔드만 개발 모드

# 빌드
pnpm build             # 전체 앱 빌드
pnpm test              # 전체 테스트 실행
pnpm lint              # 코드 검사
pnpm type-check        # 타입 검사

# 백엔드 전용
pnpm api:test:cov      # 백엔드 테스트 커버리지
pnpm api:test:e2e      # E2E 테스트
```

### 테스트 환경
- **단위 테스트**: Jest 30.x (백엔드), Vitest 2.x (프론트엔드)
- **E2E 테스트**: Supertest (API), Playwright (웹)
- **API 테스트**: Supertest
- **커버리지 목표**: 90%

## CI/CD 및 배포 환경

### CI/CD 파이프라인
- **CI**: GitHub Actions
- **CD**: ArgoCD 또는 GitHub Actions
- **컨테이너 레지스트리**: Docker Hub 또는 GitHub Container Registry
- **환경**: 개발, 스테이징, 프로덕션

### 배포 환경
- **인프라**: k3s (Lightweight Kubernetes)
- **오케스트레이션**: Docker + k3s
- **로드 밸런서**: Traefik (k3s 기본 내장) 또는 Nginx Ingress Controller
- **모니터링**: Prometheus + Grafana
- **로그**: Loki (k3s 경량 로깅 솔루션)

### k3s 선택 이유
1. **경량화**: 단일 바이너리 (약 40MB), Kubernetes 대비 빠른 설치 및 구동
2. **리소스 효율성**: 최소 512MB 메모리로 실행 가능 (Kubernetes 대비 50% 감소)
3. **완전한 호환성**: CNCF 인증 Kubernetes 배포판, 모든 kubectl 명령 지원
4. **Edge/IoT 최적화**: ARM 아키텍처 네이티브 지원, 저사양 환경에 적합
5. **간소화된 운영**: 자동 TLS 인증서 관리, 기본 Ingress 컨트롤러 내장

### k3s 특징
- **내장 컴포넌트**: Traefik Ingress, CoreDNS, Local Path Provisioner
- **제거된 레거시**: 클라우드 프로바이더 종속 기능 제거 (경량화)
- **SQLite 기본 지원**: etcd 대신 SQLite 사용 가능 (단일 노드 시)
- **자동 매니페스트 배포**: `/var/lib/rancher/k3s/server/manifests/` 자동 적용

### 배포 전략
1. **롤링 업데이트**: 무중단 배포 (기본)
2. **블루-그린 배포**: 안정성 요구 시
3. **카나리 배포**: 신규 기능 점진적 롤아웃

### k3s 구성 예시
```yaml
# k3s deployment 구성 (Kubernetes와 100% 호환)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: liar-game-api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
      - name: api
        image: liar-game/api:latest
        resources:
          requests:
            memory: "128Mi"  # k3s 경량화로 리소스 최적화
            cpu: "100m"
          limits:
            memory: "256Mi"  # Kubernetes 대비 50% 감소
            cpu: "250m"
---
# k3s Ingress (Traefik 기본 사용)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: liar-game-ingress
spec:
  rules:
  - host: liar-game.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: liar-game-api
            port:
              number: 3001
```

### k3s 설치 및 관리
```bash
# k3s 설치 (단일 명령)
curl -sfL https://get.k3s.io | sh -

# k3s 상태 확인
sudo systemctl status k3s

# kubectl 사용 (k3s 내장)
sudo k3s kubectl get nodes
sudo k3s kubectl get pods --all-namespaces

# kubeconfig 설정 (로컬 kubectl 사용 시)
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
```

## 성능 및 보안 요구사항

### 성능 요구사항
- **API 응답시간**: P95 < 200ms
- **WebSocket 지연**: P95 < 100ms (최우선 목표)
- **동시 접속자**: 1000+ concurrent users
- **메모리 사용**: < 512MB per instance
- **CPU 사용**: < 70% 평균 부하

### 성능 최적화 전략
1. **Redis 캐싱**:
   - 게임 상태 캐싱 (TTL: 30분)
   - 세션 데이터 캐싱
   - 자주 조회되는 데이터 캐싱
2. **데이터베이스 최적화**:
   - 인덱스 최적화
   - 쿼리 최적화 (TypeORM)
   - 연결 풀 관리
3. **WebSocket 최적화**:
   - 메시지 배칭
   - 압축 활성화
   - 재연결 로직 최적화

### 보안 정책
1. **인증**
   - JWT 토큰 만료: 15분 (access token)
   - Refresh 토큰: 7일
   - 최소 비밀번호 길이: 8자
   - 비밀번호 해싱: bcrypt (cost 10)

2. **통신 보안**
   - HTTPS/WSS 강제
   - TLS 1.3 이상
   - HSTS 활성화
   - CORS 정책 엄격 적용

3. **데이터 보호**
   - PII 데이터 암호화
   - SQL Injection 방지 (TypeORM Parameterized Queries)
   - XSS 방지 (CSP)
   - CSRF 토큰 사용

4. **치팅 방지** (중기 목표)
   - 서버 측 게임 로직 검증
   - 클라이언트 요청 검증
   - 이상 행동 탐지 시스템

## 테스트 전략

### 단위 테스트
- **범위**: 모든 서비스, 유틸리티, 컴포넌트
- **도구**: Jest (백엔드), Vitest (프론트엔드)
- **목 객체**: 모든 외부 의존성 mock
- **커버리지**: 90% 이상 목표

### 통합 테스트
- **범위**: API 엔드포인트, 데이터베이스 연동, WebSocket 통신
- **도구**: Jest + Supertest
- **테스트 데이터**: 테스트 전용 데이터베이스 (Docker)
- **정리**: 각 테스트 후 데이터 정리

### E2E 테스트
- **범위**: 주요 사용자 시나리오
- **도구**: Playwright
- **시나리오**:
  - 사용자 등록/로그인
  - 방 생성/참여
  - 게임 진행 완료
- **병렬 실행**: 4개 브라우저 동시 테스트

### 성능 테스트
- **부하 테스트**: K6 또는 Artillery
- **목표**: 1000 concurrent users
- **지표**: 응답시간, 에러율, 처리량
- **모니터링**: 실시간 성능 메트릭 수집

## 운영 및 모니터링

### 로깅
```typescript
// 로그 형식 (JSON)
{
  "timestamp": "2025-11-27T10:00:00.000Z",
  "level": "info",
  "service": "room-gateway",
  "message": "Player joined room",
  "context": {
    "userId": 12345,
    "roomId": "ABC123",
    "duration": 15
  }
}
```

### 메트릭 수집
- **애플리케이션 메트릭**:
  - HTTP 요청 수/응답시간
  - WebSocket 연결 수/메시지 수
  - 에러율/예외 발생 횟수
  - 메모리/CPU 사용률

- **비즈니스 메트릭**:
  - 활성 게임 방 수
  - 동시 접속자 수
  - 평균 게임 시간
  - 사용자 유지율

### 알림 전략
- **즉시 알림**: 서버 다운, 에러율 5% 이상
- **5분 내 알림**: 응답시간 500ms 이상
- **1시간 내 알림**: 리소스 사용률 80% 이상
- **채널**: Slack, 이메일, SMS (긴급)

### 장애 대응
- **MTTA (Mean Time to Acknowledge)**: < 5분
- **MTTR (Mean Time to Resolve)**: < 30분
- **실행 매뉴얼**: 장애 상황별 대응 프로시저
- **포스트모템**: 모든 장애 후 분석 및 개선

## 기술적 제약 및 고려사항

### 제약 조건
1. **리소스 제약**
   - 1인 개발으로 인한 개발 속도 한계
   - 클라우드 인프라 비용 최적화 필요

2. **기술적 부채**
   - 빠른 프로토타이핑으로 인한 리팩토링 필요
   - 테스트 커버리지 점진적 향상 (현재 → 90%)

3. **규제 요구사항**
   - 개인정보보호법 (PIPA) 준수
   - GDPR (글로벌 확장 시)

### 고려사항
1. **확장성**
   - 초기에는 단일 리전, 향후 멀티 리전 확장
   - 데이터베이스 샤딩 전략 고려 (게임 방별)

2. **호환성**
   - 모바일 웹 브라우저 지원 (iOS Safari, Chrome)
   - 낮은 사양 디바이스에서의 성능 보장

3. **유지보수성**
   - 명확한 문서화 (API 문서, 아키텍처 다이어그램)
   - 표준화된 코딩 컨벤션 (ESLint, Prettier)
   - 자동화된 테스트 및 배포

## 향후 기술 로드맵

### 1분기 (2025 Q1)
- [x] TypeScript 5.7.2 + NestJS 11.x 스택 구축
- [x] MySQL + TypeORM 구성
- [x] React 19 + React Compiler 적용
- [ ] **WebSocket 최적화** (P95 < 100ms 달성)
- [ ] **모바일 반응형 UI 최적화**
- [ ] 테스트 커버리지 90% 달성

### 2분기 (2025 Q2)
- [ ] GraphQL 도입 고려 (REST API 대체)
- [ ] 메시지 큐 (RabbitMQ/Redis Streams) 도입
- [ ] 분산 추적 시스템 구축 (OpenTelemetry)
- [ ] 치팅 방지 메커니즘 구현

### 3-4분기 (2025 H2)
- [ ] gRPC 도입 (서비스 간 통신)
- [ ] CQRS 패턴 적용
- [ ] Edge Computing 도입 (CDN)
- [ ] AI 기능 통합 (플레이어 행동 분석)
- [ ] WebRTC 도입 (음성/영상 통신)

## 개발자 경험 향상

### 로컬 개발
- **Hot Reload**: 모든 변경 사항 즉시 반영 (Vite, NestJS watch mode)
- **개발 컨테이너**: Docker Compose로 일관된 환경
- **디버깅**: VS Code 디버거 연동

### 코드 품질
- **Pre-commit hooks**: Husky를 통한 자동 검사
- **코드 리뷰**: PR 템플릿 및 체크리스트
- **자동화**: 린트, 테스트, 빌드 자동 실행

### 문서화
- **API 문서**: Swagger (Fastify Swagger UI)
- **코드 문서**: JSDoc/TSDoc 주석
- **아키텍처**: C4 모델 기반 다이어그램

## 변경 이력

### 2025-11-27 (재초기화)
- 프로젝트 언어 확정: TypeScript 5.7.2
- 데이터베이스 변경: Supabase PostgreSQL → MySQL + TypeORM
- 프론트엔드 업그레이드: React 19 + React Compiler
- 배포 환경 확정: Kubernetes 기반 컨테이너 오케스트레이션
- 성능 목표 설정: WebSocket P95 < 100ms (최우선)
- 모바일 최적화 로드맵 추가
- 테스트 커버리지 목표: 90%

### 2025-11-27 (배포 환경 변경)
- 배포 환경 변경: Kubernetes → k3s (Lightweight Kubernetes)
- 리소스 최적화: 메모리 요구사항 50% 감소 (256Mi → 128Mi 요청, 512Mi → 256Mi 제한)
- Ingress Controller 변경: Nginx → Traefik (k3s 기본 내장)
- 로깅 솔루션 최적화: ELK Stack → Loki (경량화)
- k3s 장점: 경량화, 리소스 효율성, Edge/IoT 배포 적합, ARM 지원
