# 프로젝트 헌법 (Project Constitution)

## 인프라 운영 원칙

### Kubernetes 기반 인프라
- **데이터베이스**: MySQL v8 LTS, Redis v8 LTS는 Kubernetes ClusterIP로 운영
- **포트 포워딩**: 개발 환경에서는 `kubectl port-forward` 사용
  - MySQL: `kubectl port-forward svc/mysql 3306:3306`
  - Redis: `kubectl port-forward svc/redis 6379:6379`
- **저장소**: 영구 데이터는 TypeORM + MySQL, 세션/캐시는 Redis 사용
- **로컬 Docker**: Docker Compose는 PostgreSQL, Nginx, MinIO 전용으로만 사용

### 개발 환경 설정
```bash
# K8s 인프라 연결 (별개 터미널에서 실행)
kubectl port-forward svc/mysql 3306:3306 &
kubectl port-forward svc/redis 6379:6379 &

# 애플리케이션 실행
npm run start  # API 서버 (포트 4000)
npm run dev    # 전체 개발 환경
```

## 기술 스택

### 활성 기술 (Active Technologies)
- **Backend**: TypeScript 5.7.x + NestJS 11.x + Fastify
- **Database**: MySQL v8 LTS (K8s), Redis v8 LTS (K8s)
- **Authentication**: Supabase Auth (OAuth + Email)
- **Frontend**: React 18 + Vite
- **Infrastructure**: Kubernetes (Production/Development)

### 비활성 기술 (Docker Compose 전용)
- PostgreSQL, Nginx, MinIO: Docker Compose에서만 사용
- MySQL, Redis: 반드시 K8s 클러스터 사용

## 의무사항

1. **인프라 일관성**: 모든 환경에서 K8s 기반 MySQL/Redis 사용
2. **포트 관리**: 개발 시 포트 포워딩 필수 적용
3. **데이터 동기화**: K8s와 로컬 데이터베이스 동기화 금지
4. **배포 준비**: 모든 개발은 K8s 배포 환경 가정 하에 진행

## AI 에이전트 및 스킬 통합

### Sub-agents (전문 분석 에이전트)
프로젝트별 전문화된 sub-agents를 `.claude/agents/`에 관리합니다. Claude가 자동으로 적절한 에이전트를 호출하여 전문적인 분석을 수행합니다.

#### 활성 Sub-agents
- **game-logic-analyzer**: 게임 로직 분석 및 최적화 전문가
  - NestJS Service/Controller/Gateway 계층 분석
  - WebSocket 통신 패턴 검토
  - 플레이어 관리 및 게임 진행 로직 검증

- **database-architect**: 데이터베이스 아키텍처 전문가
  - TypeORM 엔티티 설계 및 최적화
  - MySQL/Redis 성능 분석
  - K8s 환경 데이터베이스 운영 가이드

- **auth-security-specialist**: 인증 및 보안 전문가
  - Supabase Auth 통합 보안 검토
  - JWT 토큰 관리 및 검증
  - OAuth 보안 취약점 분석

- **kubernetes-deployment-expert**: Kubernetes 배포 전문가
  - K8s 매니페스트 파일 검토 및 최적화
  - 인프라 구성 상태 분석
  - CI/CD 배포 전략 수립

### Skills (자동 호출 기능)
프로젝트별 특화된 기능 스킬을 `.claude/skills/`에 관리합니다. Claude가 사용자 요청에 따라 자동으로 적절한 스킬을 활용합니다.

#### 활성 Skills
- **api-endpoint-generator**: NestJS API 엔드포인트 생성
  - Controller, Service, DTO, Entity 완전한 CRUD 구조 생성
  - 일관된 API 패턴과 타입 안전성 확보

- **websocket-gateway-builder**: Socket.IO Gateway 구축
  - 실시간 통신을 위한 WebSocket Gateway 생성
  - 방 관리, 게임 상태 동기화, 이벤트 처리 구현

- **typeorm-migration-generator**: TypeORM 마이그레이션 생성
  - Entity 변경 사항을 안전한 마이그레이션으로 변환
  - 롤백 가능한 MySQL v8 LTS 기반 데이터베이스 스키마 관리

- **docker-k8s-optimizer**: Docker 및 Kubernetes 최적화
  - 컨테이너화 및 K8s 배포 전략 수립
  - 개발/운영 환경의 효율성과 안정성 확보

- **nestjs-test-specialist**: NestJS 단위 테스트 전문가
  - Service/Controller/Gateway 테스트 작성
  - Jest 모킹 및 커버리지 최적화
  - 테스트 커버리지 85% 목표 달성

### 사용 원칙
- **자동 호출**: Claude가 작업 내용에 맞는 적절한 sub-agent나 skill을 자동 선택
- **프로젝트 공유**: 모든 sub-agents와 skills는 git에 체크인되어 팀과 공유
- **한글 우선**: 모든 분석 결과와 출력은 한글로 작성
- **기술 준수**: 프로젝트 기술 스택과 헌법 원칙 준수

## 금지사항

- Docker Compose에서 MySQL/Redis 실행 금지
- 로컬 데이터베이스와 K8s 데이터베이스 혼용 금지
- K8s 없이 애플리케이션 단독 실행 금지 (인프라 의존성)
- 개인 sub-agents/skills를 프로젝트에 무단으로 추가 금지 (팀 표준 준수)

---
**최종 수정일**: 2025-11-08
**적용 버전**: v2.0 (AI 에이전트 통합)