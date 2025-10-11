---
# 필수 필드 (7개)
id: INFRA-001
version: 0.1.0
status: completed
created: 2025-10-11
updated: 2025-10-11
author: m16khb
priority: critical

# 선택 필드 - 분류/메타
category: feature
labels:
  - infrastructure
  - docker
  - postgres
  - redis
  - nginx
  - minio

# 선택 필드 - 관계
depends_on:
  - SETUP-001

# 선택 필드 - 범위
scope:
  packages:
    - apps/api
    - docker-compose.yml
  files:
    - docker-compose.yml
    - .env
    - nginx/nginx.conf
---

# @SPEC:INFRA-001: Docker Compose 기반 인프라 통합

## HISTORY

### v0.1.0 (2025-10-11)
- **COMPLETED**: TDD 구현 완료 (RED → GREEN → REFACTOR)
- **AUTHOR**: m16khb
- **TESTS**: Docker Compose 통합 테스트 완료
  - 8개 테스트 그룹, 모든 서비스 검증
  - Health Check 동작 확인 (PostgreSQL, Redis, Nginx, MinIO)
- **SCOPE**: PostgreSQL, Redis, Nginx, MinIO 컨테이너화
- **TAG CHAIN**:
  - @SPEC:INFRA-001 (1) → @TEST:INFRA-001 (1) → @CODE:INFRA-001 (3) → @DOC:INFRA-001 (1)
- **IMPLEMENTATION**:
  - docker-compose.yml: Compose V2 사양 준수
  - nginx/nginx.conf: 리버스 프록시 설정
  - .env.example: 환경 변수 템플릿
  - docs/infrastructure.md: 아키텍처 문서
- **NOTES**:
  - Health Check 통합 (PostgreSQL, Redis, Nginx, MinIO)
  - 리소스 제한 설정 (메모리, CPU)
  - Named Volumes로 데이터 영속성 보장

### v0.0.1 (2025-10-11)
- **INITIAL**: Docker Compose 기반 인프라 통합 명세 작성
- **AUTHOR**: m16khb
- **SCOPE**: PostgreSQL, Redis, Nginx, MinIO 컨테이너화
- **CONTEXT**: 개발 환경 표준화 및 재현 가능한 인프라 구성

## Environment (환경 및 제약사항)

### 기술 스택
- **Docker**: 24.0+
- **Docker Compose**: v2.20+
- **PostgreSQL**: 16 (공식 이미지)
- **Redis**: 7 (공식 이미지)
- **Nginx**: 1.25 (공식 이미지)
- **MinIO**: RELEASE.2024-01-01

### 네트워크 구성
- **브릿지 네트워크**: liar-game-network
- **포트 매핑**:
  - PostgreSQL: 5432:5432
  - Redis: 6379:6379
  - Nginx: 80:80, 443:443
  - MinIO: 9000:9000 (API), 9001:9001 (Console)

### 데이터 영속성
- **PostgreSQL**: `./docker/volumes/postgres` → `/var/lib/postgresql/data`
- **Redis**: `./docker/volumes/redis` → `/data`
- **MinIO**: `./docker/volumes/minio` → `/data`

## Assumptions (전제 조건)

1. **개발 환경**: Docker Desktop 또는 Docker Engine이 설치되어 있음
2. **호스트 OS**: macOS, Linux, Windows (WSL2) 지원
3. **포트 충돌**: 5432, 6379, 80, 443, 9000, 9001 포트가 사용 가능함
4. **디스크 공간**: 최소 5GB의 여유 공간
5. **네트워크**: 인터넷 연결 (Docker 이미지 다운로드)

## Requirements (기능 요구사항)

### Ubiquitous Requirements (보편적 요구사항)

**REQ-001**: 시스템은 Docker Compose로 전체 인프라를 관리해야 한다
- **설명**: 단일 `docker compose up` 명령으로 모든 서비스 시작
- **검증**: `docker compose ps` 결과 모든 서비스가 `running` 상태

**REQ-002**: 시스템은 PostgreSQL 16 컨테이너를 제공해야 한다
- **설명**: 게임 데이터, 사용자 정보 저장용 관계형 DB
- **검증**: `psql -h localhost -U liaruser -d liardb -c '\dt'` 연결 성공

**REQ-003**: 시스템은 Redis 7 컨테이너를 제공해야 한다
- **설명**: 세션 관리, 게임 상태 캐싱, Pub/Sub
- **검증**: `redis-cli ping` 응답 `PONG`

**REQ-004**: 시스템은 Nginx 리버스 프록시를 제공해야 한다
- **설명**: API 라우팅, 정적 파일 서빙, SSL 터미네이션
- **검증**: `curl http://localhost/api/health` 응답 200

**REQ-005**: 시스템은 MinIO S3 스토리지를 제공해야 한다
- **설명**: 게임 로그, 사용자 업로드 파일 저장
- **검증**: MinIO Console 접속 (`http://localhost:9001`) 성공

### Event-driven Requirements (이벤트 기반 요구사항)

**REQ-006**: WHEN `docker compose up`을 실행하면, 모든 컨테이너가 정상 구동되어야 한다
- **조건**: `docker compose up -d` 실행
- **동작**: postgres, redis, nginx, minio 컨테이너 시작
- **검증**: `docker compose ps` 결과 4개 서비스 모두 `Up` 상태

**REQ-007**: WHEN DB 컨테이너가 재시작되면, 데이터가 유지되어야 한다
- **조건**: `docker compose restart postgres` 실행
- **동작**: 볼륨 마운트된 데이터 유지
- **검증**: 재시작 전 생성한 테이블이 재시작 후에도 존재

**REQ-008**: WHEN Health Check가 실패하면, 컨테이너가 자동 재시작되어야 한다
- **조건**: Health Check 3회 연속 실패
- **동작**: Docker가 컨테이너 재시작 (restart: unless-stopped)
- **검증**: `docker inspect <container>` Health 상태 변화 확인

**REQ-009**: WHEN 환경 변수가 변경되면, 컨테이너 재생성이 필요함을 경고해야 한다
- **조건**: `.env` 파일 수정
- **동작**: `docker compose up` 시 변경 감지
- **검증**: 재생성 메시지 출력

### State-driven Requirements (상태 기반 요구사항)

**REQ-010**: WHILE 개발 모드일 때, Hot Reload를 위해 API 서버는 호스트에서 실행되어야 한다
- **상태**: `NODE_ENV=development`
- **동작**: API 서버는 Docker 외부 (localhost:3000)에서 실행
- **검증**: 코드 수정 시 즉시 반영

**REQ-011**: WHILE 컨테이너가 실행 중일 때, 로그가 실시간 스트리밍되어야 한다
- **상태**: `docker compose up` (foreground 모드)
- **동작**: 모든 서비스 로그가 통합 출력
- **검증**: `docker compose logs -f` 로그 출력 확인

**REQ-012**: WHILE Health Check 실패 중일 때, 의존 서비스가 대기해야 한다
- **상태**: postgres 컨테이너 Health Check 실패
- **동작**: API 서버 컨테이너가 대기 (depends_on.condition: service_healthy)
- **검증**: postgres 준비 전 API 시작 안 됨

### Constraints (제약사항)

**CON-001**: 각 서비스는 Health Check를 통과해야 한다
- **postgres**: `pg_isready -U liaruser`
- **redis**: `redis-cli ping`
- **nginx**: `curl -f http://localhost/health`
- **minio**: `curl -f http://localhost:9000/minio/health/live`

**CON-002**: PostgreSQL 데이터는 로컬 볼륨에 영구 저장되어야 한다
- **볼륨 경로**: `./docker/volumes/postgres`
- **권한**: `chmod 700` (보안)
- **백업**: 호스트에서 직접 접근 가능

**CON-003**: 비밀번호는 `.env` 파일로 관리되어야 한다 (Git 미추적)
- **필수 변수**: `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `MINIO_ROOT_PASSWORD`
- **검증**: `.gitignore`에 `.env` 포함
- **템플릿**: `.env.example` 제공

**CON-004**: 컨테이너 리소스 제한을 설정해야 한다
- **메모리**: postgres(1GB), redis(512MB), nginx(256MB), minio(1GB)
- **CPU**: 제한 없음 (개발 환경)
- **검증**: `docker stats` 리소스 사용량 확인

**CON-005**: 네트워크 분리를 위해 전용 브릿지 네트워크를 사용해야 한다
- **네트워크명**: `liar-game-network`
- **드라이버**: bridge
- **검증**: `docker network inspect liar-game-network` 성공

## Specifications (상세 명세)

### Docker Compose 구성

#### PostgreSQL 서비스
```yaml
postgres:
  image: postgres:16
  container_name: liar-game-postgres
  environment:
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    POSTGRES_DB: ${POSTGRES_DB}
  ports:
    - "5432:5432"
  volumes:
    - ./docker/volumes/postgres:/var/lib/postgresql/data
  networks:
    - liar-game-network
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
    interval: 10s
    timeout: 5s
    retries: 5
  restart: unless-stopped
```

#### Redis 서비스
```yaml
redis:
  image: redis:7
  container_name: liar-game-redis
  command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
  ports:
    - "6379:6379"
  volumes:
    - ./docker/volumes/redis:/data
  networks:
    - liar-game-network
  healthcheck:
    test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
  restart: unless-stopped
```

#### Nginx 서비스
```yaml
nginx:
  image: nginx:1.25
  container_name: liar-game-nginx
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/ssl:/etc/nginx/ssl:ro
  networks:
    - liar-game-network
  depends_on:
    - postgres
    - redis
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost/health"]
    interval: 10s
    timeout: 5s
    retries: 3
  restart: unless-stopped
```

#### MinIO 서비스
```yaml
minio:
  image: minio/minio:RELEASE.2024-01-01T16-36-33Z
  container_name: liar-game-minio
  command: server /data --console-address ":9001"
  environment:
    MINIO_ROOT_USER: ${MINIO_ROOT_USER}
    MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
  ports:
    - "9000:9000"
    - "9001:9001"
  volumes:
    - ./docker/volumes/minio:/data
  networks:
    - liar-game-network
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
    interval: 30s
    timeout: 20s
    retries: 3
  restart: unless-stopped
```

### 환경 변수 (.env.example)
```bash
# PostgreSQL
POSTGRES_USER=liaruser
POSTGRES_PASSWORD=change-this-password
POSTGRES_DB=liardb

# Redis
REDIS_PASSWORD=change-this-redis-password

# MinIO
MINIO_ROOT_USER=minio-admin
MINIO_ROOT_PASSWORD=change-this-minio-password
```

### Nginx 설정 (nginx/nginx.conf)
```nginx
events {
    worker_connections 1024;
}

http {
    upstream api_backend {
        server host.docker.internal:3000;
    }

    server {
        listen 80;
        server_name localhost;

        # Health Check 엔드포인트
        location /health {
            access_log off;
            return 200 "OK";
            add_header Content-Type text/plain;
        }

        # API 프록시
        location /api/ {
            proxy_pass http://api_backend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket 프록시
        location /ws/ {
            proxy_pass http://api_backend/ws/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
        }
    }
}
```

## Traceability (추적성)

### TAG 관계도
```
@SPEC:INFRA-001 (이 문서) ✅
├─ depends_on: @SPEC:SETUP-001 (프로젝트 초기 설정)
├─ @TEST:INFRA-001 → tests/infra/docker-compose.test.ts ✅
├─ @CODE:INFRA-001 → docker-compose.yml ✅
├─ @CODE:INFRA-001 → nginx/nginx.conf ✅
├─ @CODE:INFRA-001 → .env.example ✅
└─ @DOC:INFRA-001 → docs/infrastructure.md ✅
```

### 파일 매핑
- **SPEC**: `.moai/specs/SPEC-INFRA-001/spec.md` (이 문서) ✅
- **구현**:
  - `docker-compose.yml` ✅
  - `.env.example` ✅
  - `nginx/nginx.conf` ✅
- **테스트**: `tests/infra/docker-compose.test.ts` ✅
- **문서**:
  - `README.md#Infrastructure` ✅
  - `docs/infrastructure.md` ✅

### 관련 이슈
- GitHub Issue: TBD (Team 모드 시 자동 생성)

---

**작성일**: 2025-10-11
**작성자**: m16khb
**버전**: v0.1.0 (COMPLETED)
**상태**: completed
