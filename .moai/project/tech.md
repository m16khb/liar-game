# Liar Game - 기술 문서

## 기술 스택

### 언어 및 프레임워크

#### 백엔드
- **언어**: TypeScript 5.7.2
- **프레임워크**: NestJS 10.x (Fastify 기반)
- **실시간 통신**: Socket.IO 4.8.1
- **인증**: Supabase Auth
- **데이터베이스**: PostgreSQL (Supabase 호스팅)
- **ORM**: TypeORM 0.3.x
- **캐시**: Redis 7.x

#### 프론트엔드
- **언어**: TypeScript 5.7.2
- **프레임워크**: React 19
- **컴파일러**: React Compiler
- **번들러**: Vite
- **상태 관리**: React Context + useReducer
- **스타일링**: Tailwind CSS
- **HTTP 클라이언트**: Axios

#### 개발 도구
- **패키지 매니저**: pnpm 10.17.1
- **모노레포**: Turborepo 2.6.1
- **Node.js**: 24.x 이상
- **타입 검사**: TypeScript 5.7.2
- **코드 포맷팅**: Prettier
- **린팅**: ESLint

### 라이브러리 버전 상세

#### 백엔드 주요 라이브러리
```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "@nestjs/platform-fastify": "^10.0.0",
  "@nestjs/websockets": "^10.0.0",
  "@nestjs/typeorm": "^10.0.0",
  "@nestjs/config": "^3.0.0",
  "@supabase/supabase-js": "^2.39.0",
  "socket.io": "^4.8.1",
  "typeorm": "^0.3.20",
  "fastify": "^4.24.3",
  "redis": "^4.6.10",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.1"
}
```

#### 프론트엔드 주요 라이브러리
```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "@vitejs/plugin-react": "^4.2.0",
  "vite": "^5.0.0",
  "tailwindcss": "^3.4.0",
  "autoprefixer": "^10.4.16",
  "postcss": "^8.4.32",
  "socket.io-client": "^4.8.1",
  "@supabase/supabase-js": "^2.39.0",
  "axios": "^1.6.2",
  "dayjs": "^1.11.10",
  "zustand": "^4.4.7",
  "react-hot-toast": "^2.4.1"
}
```

## 개발 환경 및 빌드 도구

### 개발 환경 설정
- **IDE**: VS Code (추천 확장: TypeScript, NestJS, ESLint, Prettier)
- **환경 변수 관리**: `.env` 파일 (로컬), 시크릿 매니저 (프로덕션)
- **Docker**: 개발 환경 컨테이너화
- **포트配置**: API (3001), Web (3000), Redis (6379)

### 빌드 프로세스
```bash
# 개발 서버
pnpm dev               # 전체 앱 개발 모드
pnpm web:dev           # 프론트엔드만 개발 모드
pnpm api:dev           # 백엔드만 개발 모드

# 빌드
pnpm build             # 전체 앱 빌드
pnpm test              # 전체 테스트 실행
pnpm lint              # 코드 검사
pnpm type-check        # 타입 검사
```

### 테스트 환경
- **단위 테스트**: Jest 30.x
- **E2E 테스트**: Playwright
- **API 테스트**: Supertest
- **커버리지 목표**: 90%

## CI/CD 및 배포 환경

### CI/CD 파이프라인
- **CI**: GitHub Actions
- **CD**: ArgoCD 또는 GitHub Actions
- **컨테이너 레지스트리**: Docker Hub 또는 GitHub Container Registry
- **환경**: 개발, 스테이징, 프로덕션

### 배포 환경
- **인프라**: 쿠버네티스 (EKS 또는 GKE)
- **오케스트레이션**: Docker + Kubernetes
- **로드 밸런서**: Nginx Ingress Controller
- **모니터링**: Prometheus + Grafana
- **로그**: ELK Stack (Elasticsearch, Logstash, Kibana)

### 배포 전략
1. **롤링 업데이트**: 무중단 배포
2. **블루-그린 배포**: 안정성 요구 시
3. **카나리 배포**: 신규 기능 점진적 롤아웃

## 성능 및 보안 요구사항

### 성능 요구사항
- **API 응답시간**: P95 < 200ms
- **WebSocket 지연**: P95 < 100ms
- **동시 접속자**: 1000+ concurrent users
- **메모리 사용**: < 512MB per instance
- **CPU 사용**: < 70% 평균 부하

### 보안 정책
1. **인증**
   - JWT 토큰 만료: 15분 (access token)
   - Refresh 토큰: 7일
   - 최소 비밀번호 길이: 8자
   - 비밀번호 해싱: bcrypt (cost 12)

2. **통신 보안**
   - HTTPS/WSS 강제
   - TLS 1.3 이상
   - HSTS 활성화
   - CORS 정책 엄격 적용

3. **데이터 보호**
   - PII 데이터 암호화
   - SQL Injection 방지
   - XSS 방지 (CSP)
   - CSRF 토큰 사용

## 테스트 전략

### 단위 테스트
- **범위**: 모든 서비스, 유틸리티, 컴포넌트
- **도구**: Jest + Testing Library
- **목 객체**: 모든 외부 의존성 mock
- **커버리지**: 90% 이상 목표

### 통합 테스트
- **범위**: API 엔드포인트, 데이터베이스 연동
- **도구**: Jest + Supertest
- **테스트 데이터**: 테스트 전용 데이터베이스
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
// 로그 형식
{
  "timestamp": "2025-11-16T10:00:00.000Z",
  "level": "info",
  "service": "room-gateway",
  "message": "Player joined room",
  "userId": 12345,
  "roomId": "ABC123",
  "duration": 15
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
   - 테스트 커버리지 점진적 향상

3. **규제 요구사항**
   - 개인정보보호법 (PIPA) 준수
   - GDPR (글로벌 확장 시)

### 고려사항
1. **확장성**
   - 초기에는 단일 리전, 향후 멀티 리전 확장
   - 데이터베이스 샤딩 전략 고려

2. **호환성**
   - 모바일 웹 브라우저 지원
   - 낮은 사양 디바이스에서의 성능 보장

3. **유지보수성**
   - 명확한 문서화
   - 표준화된 코딩 컨벤션
   - 자동화된 테스트 및 배포

## 향후 기술 로드맵

### 1분기 (2025 Q1)
- [ ] GraphQL 도입 고려
- [ ] 메시지 큐 (RabbitMQ/Redis Streams) 도입
- [ ] 분산 추적 시스템 구축

### 2분기 (2025 Q2)
- [ ] gRPC 도입 (서비스 간 통신)
- [ ] CQRS 패턴 적용
- [ ] 이벤트 소싱 아키텍처 검토

### 3-4분기 (2025 H2)
- [ ] Edge Computing 도입 (CDN)
- [ ] AI 기능 통합 (플레이어 행동 분석)
- [ ] WebRTC 도입 (음성/영상 통신)

## 개발자 경험 향상

### 로컬 개발
- **Hot Reload**: 모든 변경 사항 즉시 반영
- **개발 컨테이너**: Docker Compose로 일관된 환경
- **디버깅**: VS Code 디버거 연동

### 코드 품질
- **Pre-commit hooks**: Husky를 통한 자동 검사
- **코드 리뷰**: PR 템플릿 및 체크리스트
- **자동화**: 린트, 테스트, 빌드 자동 실행

### 문서화
- **API 문서**: OpenAPI/Swagger 자동 생성
- **코드 문서**: JSDoc 주석
- **아키텍처**: C4 모델 기반 다이어그램