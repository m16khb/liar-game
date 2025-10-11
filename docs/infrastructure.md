# Docker Compose 기반 인프라 아키텍처

@DOC:INFRA-001 | SPEC: .moai/specs/SPEC-INFRA-001/spec.md

## 개요

liar-game 프로젝트의 인프라 구성 문서입니다. Docker Compose를 사용하여 다음 4개 서비스를 컨테이너화하고 통합 관리합니다.

### 서비스 구성

- **PostgreSQL 16**: 게임 데이터, 사용자 정보를 저장하는 관계형 데이터베이스
- **Redis 7**: 세션 관리, 게임 상태 캐싱, 실시간 Pub/Sub
- **Nginx 1.25**: 리버스 프록시, API 라우팅, 정적 파일 서빙
- **MinIO**: S3 호환 오브젝트 스토리지 (게임 로그, 사용자 업로드 파일)

### 설계 원칙

- **단일 명령 실행**: `docker compose up -d`로 전체 인프라 시작
- **데이터 영속성**: Named Volumes로 컨테이너 재시작 시에도 데이터 유지
- **Health Check 통합**: 각 서비스의 상태를 자동으로 모니터링
- **리소스 제한**: 개발 환경에 최적화된 메모리/CPU 제한
- **네트워크 격리**: 전용 브릿지 네트워크로 서비스 간 통신 격리

## 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                       Host Machine                          │
│                                                             │
│  ┌─────────────┐          ┌──────────────────────────┐     │
│  │  API Server │          │   Docker Network         │     │
│  │ (localhost) │◄─────────│   liar-game-network      │     │
│  │   :3000     │          │                          │     │
│  └─────────────┘          │  ┌────────────────────┐  │     │
│                           │  │  Nginx :80/443     │  │     │
│  ┌─────────────┐          │  │ (리버스 프록시)      │  │     │
│  │   Client    │◄─────────┼──┤  - /api → :3000    │  │     │
│  │   Browser   │  HTTP    │  │  - /ws → WebSocket │  │     │
│  └─────────────┘          │  │  - /health         │  │     │
│                           │  └────────────────────┘  │     │
│                           │           │              │     │
│                           │           ▼              │     │
│                           │  ┌────────────────────┐  │     │
│                           │  │ PostgreSQL :5432   │  │     │
│                           │  │ (liar-game-postgres)│ │     │
│                           │  │  - 메모리: 1GB      │  │     │
│                           │  │  - 볼륨: postgres/  │  │     │
│                           │  └────────────────────┘  │     │
│                           │                          │     │
│                           │  ┌────────────────────┐  │     │
│                           │  │  Redis :6379       │  │     │
│                           │  │ (liar-game-redis)   │  │     │
│                           │  │  - 메모리: 512MB    │  │     │
│                           │  │  - AOF 영속성 활성화│  │     │
│                           │  │  - 볼륨: redis/     │  │     │
│                           │  └────────────────────┘  │     │
│                           │                          │     │
│                           │  ┌────────────────────┐  │     │
│                           │  │  MinIO :9000/9001  │  │     │
│                           │  │ (liar-game-minio)   │  │     │
│                           │  │  - 메모리: 1GB      │  │     │
│                           │  │  - 볼륨: minio/     │  │     │
│                           │  │  - Console: 9001   │  │     │
│                           │  └────────────────────┘  │     │
│                           └──────────────────────────┘     │
│                                                             │
│  볼륨 매핑:                                                  │
│  ./docker/volumes/postgres → /var/lib/postgresql/data     │
│  ./docker/volumes/redis    → /data                        │
│  ./docker/volumes/minio    → /data                        │
└─────────────────────────────────────────────────────────────┘
```

## 서비스 상세 설명

### PostgreSQL 16

**역할**: 게임 데이터, 사용자 정보를 저장하는 메인 데이터베이스

**이미지**: `postgres:16` (공식 이미지)

**환경 변수**:
- `POSTGRES_USER`: 데이터베이스 사용자명 (기본: `liaruser`)
- `POSTGRES_PASSWORD`: 사용자 비밀번호 (보안상 `.env`에서 관리)
- `POSTGRES_DB`: 기본 데이터베이스명 (기본: `liardb`)

**포트 매핑**: `5432:5432` (호스트:컨테이너)

**볼륨**: `./docker/volumes/postgres:/var/lib/postgresql/data`
- 로컬 파일 시스템에 데이터 영속 저장
- 컨테이너 재시작/삭제 시에도 데이터 유지
- 호스트에서 직접 백업 가능 (`chmod 700` 권한 권장)

**Health Check**:
```bash
pg_isready -U ${POSTGRES_USER}
# 10초마다 체크, 5초 타임아웃, 5회 재시도
```

**리소스 제한**:
- 메모리: 1GB (개발 환경 최적화)
- CPU: 제한 없음

**재시작 정책**: `unless-stopped` (수동 중지 전까지 자동 재시작)

**연결 문자열 예시**:
```typescript
// NestJS TypeORM 설정
{
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
}
```

### Redis 7

**역할**: 세션 관리, 게임 상태 캐싱, 실시간 Pub/Sub 메시징

**이미지**: `redis:7` (공식 이미지)

**실행 명령**:
```bash
redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
```
- `--appendonly yes`: AOF(Append Only File) 영속성 활성화
- `--requirepass`: 비밀번호 인증 활성화

**포트 매핑**: `6379:6379`

**볼륨**: `./docker/volumes/redis:/data`
- AOF 파일 저장 (appendonly.aof)
- 재시작 시 데이터 복구

**Health Check**:
```bash
redis-cli --raw incr ping
# PONG 응답 확인 (10초마다, 5초 타임아웃)
```

**리소스 제한**:
- 메모리: 512MB
- CPU: 제한 없음

**사용 사례**:
- 사용자 세션 저장 (TTL 7일)
- 게임 매칭 큐 관리
- 실시간 게임 상태 캐싱 (<10ms 조회)
- Socket.IO 어댑터 (다중 서버 환경)

**연결 예시**:
```typescript
// NestJS Redis 모듈
{
  host: 'localhost',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0,
}
```

### Nginx 1.25

**역할**: 리버스 프록시, API 라우팅, WebSocket 프록시, 정적 파일 서빙

**이미지**: `nginx:1.25` (공식 이미지)

**포트 매핑**:
- `80:80` (HTTP)
- `443:443` (HTTPS - 추후 SSL 인증서 추가)

**볼륨**:
- `./nginx/nginx.conf:/etc/nginx/nginx.conf:ro` (읽기 전용 설정 파일)

**의존성**: PostgreSQL, Redis 서비스가 `service_healthy` 상태일 때 시작

**Health Check**:
```bash
curl -f http://localhost/health
# 10초마다, 5초 타임아웃, 3회 재시도
```

**리소스 제한**:
- 메모리: 256MB
- CPU: 제한 없음

**주요 라우팅 규칙** (`nginx/nginx.conf` 참조):

1. **Health Check 엔드포인트** (`/health`):
   ```nginx
   location /health {
       return 200 "OK\n";
   }
   ```
   - Docker Compose Health Check용
   - 로그 기록 안 함 (`access_log off`)

2. **API 프록시** (`/api/*`):
   ```nginx
   location /api/ {
       proxy_pass http://host.docker.internal:3000/;
   }
   ```
   - NestJS 백엔드로 라우팅 (`localhost:3000`)
   - HTTP/1.1, Upgrade 헤더 지원 (WebSocket 대비)
   - 타임아웃: 60초

3. **WebSocket 프록시** (`/ws/*`):
   ```nginx
   location /ws/ {
       proxy_pass http://host.docker.internal:3000/ws/;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "Upgrade";
   }
   ```
   - Socket.IO 실시간 통신
   - 타임아웃: 7일 (게임 세션 유지)

4. **정적 파일** (`/`):
   - 추후 프론트엔드 빌드 결과물 서빙 (현재 미구현)

**로그 위치**:
- Access Log: `/var/log/nginx/access.log`
- Error Log: `/var/log/nginx/error.log`

### MinIO

**역할**: S3 호환 오브젝트 스토리지 (게임 로그, 사용자 업로드 파일)

**이미지**: `minio/minio:RELEASE.2024-01-01T16-36-33Z`

**실행 명령**:
```bash
server /data --console-address ":9001"
```

**환경 변수**:
- `MINIO_ROOT_USER`: 관리자 사용자명 (기본: `minio-admin`)
- `MINIO_ROOT_PASSWORD`: 관리자 비밀번호 (보안상 `.env`에서 관리)

**포트 매핑**:
- `9000:9000` (S3 API)
- `9001:9001` (웹 콘솔)

**볼륨**: `./docker/volumes/minio:/data`

**Health Check**:
```bash
curl -f http://localhost:9000/minio/health/live
# 30초마다, 20초 타임아웃, 3회 재시도
```

**리소스 제한**:
- 메모리: 1GB
- CPU: 제한 없음

**사용 사례**:
- 게임 플레이 로그 저장 (버킷: `game-logs`)
- 사용자 프로필 이미지 (버킷: `user-uploads`)
- 게임 리플레이 파일 (버킷: `replays`)

**웹 콘솔 접속**:
- URL: `http://localhost:9001`
- 로그인: `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`

**S3 클라이언트 설정 예시**:
```typescript
import { S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER,
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD,
  },
  forcePathStyle: true, // MinIO 필수 설정
});
```

## 네트워크 구성

### liar-game-network

**드라이버**: `bridge` (기본 Docker 브릿지 네트워크)

**특징**:
- 모든 서비스가 동일 네트워크에 속함
- 서비스명으로 DNS 해석 가능 (예: `postgres`, `redis`)
- 외부 네트워크와 격리 (포트 매핑 통해서만 접근)

**서비스 간 통신 예시**:
```typescript
// API 서버에서 PostgreSQL 연결 (컨테이너 내부라면)
host: 'postgres', // 서비스명으로 해석
port: 5432,

// 호스트 머신에서 PostgreSQL 연결
host: 'localhost', // 포트 매핑 활용
port: 5432,
```

## 볼륨 및 데이터 영속성

### Named Volumes vs. Bind Mounts

본 프로젝트는 **Bind Mounts** 방식을 사용합니다:

```yaml
volumes:
  - ./docker/volumes/postgres:/var/lib/postgresql/data
  - ./docker/volumes/redis:/data
  - ./docker/volumes/minio:/data
```

**장점**:
- 호스트에서 직접 파일 접근 가능 (백업, 검사)
- 볼륨 위치가 명확함 (`./docker/volumes/`)
- Git 저장소 내 위치 (`.gitignore`에 추가)

**주의사항**:
- 볼륨 디렉토리는 `.gitignore`에 반드시 추가
- PostgreSQL 볼륨은 `chmod 700` 권한 설정 권장

### 볼륨 백업

```bash
# PostgreSQL 백업
docker compose exec postgres pg_dump -U liaruser liardb > backup.sql

# Redis 백업 (AOF 파일 복사)
cp ./docker/volumes/redis/appendonly.aof backup-redis-$(date +%F).aof

# MinIO 백업 (디렉토리 전체 복사)
tar -czf backup-minio-$(date +%F).tar.gz ./docker/volumes/minio/
```

## Health Check 전략

### Health Check 개요

모든 서비스는 Docker의 Health Check 메커니즘을 사용하여 자동으로 상태를 모니터링합니다.

**Health Check 상태**:
- `starting`: 컨테이너 시작 중 (첫 번째 체크 전)
- `healthy`: Health Check 통과
- `unhealthy`: 연속 재시도 실패

**재시작 정책**:
- `restart: unless-stopped`: Health Check 실패 시 자동 재시작
- Nginx는 의존 서비스가 `service_healthy` 상태일 때만 시작

### 서비스별 Health Check 설정

| 서비스     | 테스트 명령                                        | 간격  | 타임아웃 | 재시도 |
| ---------- | -------------------------------------------------- | ----- | -------- | ------ |
| PostgreSQL | `pg_isready -U liaruser`                           | 10초  | 5초      | 5회    |
| Redis      | `redis-cli --raw incr ping`                        | 10초  | 5초      | 5회    |
| Nginx      | `curl -f http://localhost/health`                  | 10초  | 5초      | 3회    |
| MinIO      | `curl -f http://localhost:9000/minio/health/live` | 30초  | 20초     | 3회    |

### Health Check 확인 방법

```bash
# 전체 서비스 상태 확인
docker compose ps

# 특정 컨테이너 Health 상태 확인
docker inspect liar-game-postgres | grep -A 10 Health

# Health Check 로그 확인
docker inspect liar-game-postgres --format='{{json .State.Health}}' | jq
```

## 환경 변수

### .env 파일 구조

프로젝트 루트에 `.env` 파일을 생성하여 환경 변수를 관리합니다.

**템플릿 파일**: `.env.example` (Git 추적됨)
**실제 파일**: `.env` (`.gitignore`에 추가, Git 미추적)

```bash
# @CODE:INFRA-001 | SPEC: .moai/specs/SPEC-INFRA-001/spec.md
# Docker Compose 인프라 환경 변수

# PostgreSQL
POSTGRES_USER=liaruser
POSTGRES_PASSWORD=change-this-password
POSTGRES_DB=liardb

# Redis
REDIS_PASSWORD=change-this-redis-password

# MinIO
MINIO_ROOT_USER=minio-admin
MINIO_ROOT_PASSWORD=change-this-minio-password

# Application (추후 추가)
NODE_ENV=development
API_PORT=3000
```

### 환경 변수 설정 방법

```bash
# 1. 템플릿 복사
cp .env.example .env

# 2. 에디터로 열어서 비밀번호 변경
nano .env  # 또는 vi, code 등

# 3. 변경 사항 적용 (컨테이너 재생성 필요)
docker compose up -d
```

### 보안 권장사항

- **비밀번호 복잡도**: 최소 16자, 대소문자/숫자/특수문자 혼용
- **프로덕션 환경**: AWS Secrets Manager, HashiCorp Vault 등 사용
- **Git 커밋 금지**: `.env` 파일은 절대 커밋하지 말 것
- **팀 공유**: 비밀번호는 별도 안전한 채널로 공유

## 사용법

### 인프라 시작

```bash
# 환경 변수 설정 (최초 1회)
cp .env.example .env
nano .env  # 비밀번호 변경

# 전체 인프라 시작 (백그라운드)
docker compose up -d

# 상태 확인
docker compose ps

# 출력 예시:
# NAME                  STATUS         PORTS
# liar-game-postgres    Up (healthy)   0.0.0.0:5432->5432/tcp
# liar-game-redis       Up (healthy)   0.0.0.0:6379->6379/tcp
# liar-game-nginx       Up (healthy)   0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
# liar-game-minio       Up (healthy)   0.0.0.0:9000-9001->9000-9001/tcp
```

### 상태 확인

```bash
# 전체 서비스 상태
docker compose ps

# 실시간 로그 확인 (모든 서비스)
docker compose logs -f

# 특정 서비스 로그
docker compose logs -f postgres
docker compose logs -f redis
docker compose logs -f nginx

# 리소스 사용량 확인
docker stats
```

### 서비스 재시작

```bash
# 특정 서비스 재시작
docker compose restart postgres
docker compose restart redis

# 전체 재시작
docker compose restart

# 환경 변수 변경 시 (재생성 필요)
docker compose up -d --force-recreate
```

### 종료 및 정리

```bash
# 서비스 중지 (데이터 유지)
docker compose stop

# 컨테이너 삭제 (데이터 유지)
docker compose down

# 컨테이너 + 볼륨 모두 삭제 (주의!)
docker compose down -v

# 네트워크도 함께 삭제
docker compose down --remove-orphans
```

### 데이터베이스 마이그레이션

```bash
# PostgreSQL이 실행 중인 상태에서
cd apps/api
pnpm migration:run

# 또는 Docker 내부에서 직접 실행
docker compose exec postgres psql -U liaruser -d liardb -f /path/to/migration.sql
```

## 트러블슈팅

### 일반적인 문제

#### 1. 포트 충돌

**증상**:
```
Error starting userland proxy: listen tcp4 0.0.0.0:5432: bind: address already in use
```

**해결**:
```bash
# 충돌 포트 확인
lsof -i :5432  # macOS/Linux
netstat -ano | findstr :5432  # Windows

# 해당 프로세스 종료 또는
# docker-compose.yml에서 포트 변경:
ports:
  - "15432:5432"  # 호스트 포트 변경
```

#### 2. Health Check 실패

**증상**:
```
liar-game-postgres is unhealthy
```

**해결**:
```bash
# 로그 확인
docker compose logs postgres

# 컨테이너 내부 진입
docker compose exec postgres bash
pg_isready -U liaruser  # 수동 Health Check

# 재시작
docker compose restart postgres
```

#### 3. 볼륨 권한 오류

**증상**:
```
initdb: error: could not change permissions of directory "/var/lib/postgresql/data": Permission denied
```

**해결**:
```bash
# 볼륨 디렉토리 권한 수정
sudo chown -R $(whoami):$(whoami) ./docker/volumes/postgres
chmod 700 ./docker/volumes/postgres

# 볼륨 완전 삭제 후 재생성
docker compose down -v
rm -rf ./docker/volumes/postgres
docker compose up -d
```

#### 4. 환경 변수 미적용

**증상**:
```
FATAL: password authentication failed for user "liaruser"
```

**해결**:
```bash
# .env 파일 존재 확인
cat .env

# 컨테이너 재생성 (환경 변수 재로딩)
docker compose up -d --force-recreate

# 환경 변수 확인
docker compose exec postgres env | grep POSTGRES
```

#### 5. 네트워크 연결 실패

**증상**:
```
Error: getaddrinfo ENOTFOUND postgres
```

**해결**:
```bash
# API 서버가 호스트에서 실행 중이라면:
# → "postgres" 대신 "localhost" 사용

# API 서버도 Docker 컨테이너라면:
# → 동일 네트워크에 연결되어 있는지 확인
docker network inspect liar-game-network
```

### 디버깅 명령어

```bash
# 컨테이너 내부 진입
docker compose exec postgres bash
docker compose exec redis sh

# 네트워크 연결 확인
docker compose exec nginx ping postgres
docker compose exec nginx ping redis

# 파일 시스템 확인
docker compose exec postgres ls -la /var/lib/postgresql/data

# 프로세스 확인
docker compose exec postgres ps aux
```

## 성능 최적화

### 리소스 제한

현재 설정 (개발 환경 최적화):

```yaml
mem_limit: 1g    # PostgreSQL, MinIO
mem_limit: 512m  # Redis
mem_limit: 256m  # Nginx
```

**프로덕션 환경 권장사항**:
```yaml
services:
  postgres:
    mem_limit: 2g
    cpus: '2.0'
    deploy:
      resources:
        limits:
          memory: 2g
          cpus: '2.0'
        reservations:
          memory: 1g
          cpus: '1.0'
```

### PostgreSQL 튜닝

`docker-compose.yml`에 추가 설정:

```yaml
postgres:
  command:
    - "postgres"
    - "-c"
    - "max_connections=100"
    - "-c"
    - "shared_buffers=256MB"
    - "-c"
    - "effective_cache_size=1GB"
    - "-c"
    - "work_mem=8MB"
```

### Redis 최적화

```yaml
redis:
  command: >
    redis-server
    --appendonly yes
    --requirepass ${REDIS_PASSWORD}
    --maxmemory 512mb
    --maxmemory-policy allkeys-lru
```

### Nginx 캐싱

`nginx/nginx.conf`에 추가:

```nginx
# 정적 파일 캐싱
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Gzip 압축
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

## 보안 고려사항

### 1. 환경 변수 관리

- `.env` 파일은 **절대 Git에 커밋하지 말 것**
- `.gitignore`에 `.env` 추가 확인:
  ```bash
  grep "\.env" .gitignore
  ```
- 비밀번호는 최소 16자 이상, 복잡도 높게 설정

### 2. 네트워크 격리

- 모든 서비스는 `liar-game-network` 내부에만 노출
- 외부 접근은 Nginx를 통해서만 허용
- 프로덕션 환경에서는 내부 포트 매핑 제거 권장

### 3. 볼륨 권한

```bash
# PostgreSQL 볼륨 권한 설정
chmod 700 ./docker/volumes/postgres

# Redis AOF 파일 권한
chmod 600 ./docker/volumes/redis/appendonly.aof
```

### 4. SSL/TLS (프로덕션)

Nginx에 SSL 인증서 추가:

```yaml
nginx:
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/ssl:/etc/nginx/ssl:ro  # SSL 인증서
```

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ...
}
```

### 5. 컨테이너 격리

```yaml
# 프로덕션 환경 추가 설정
security_opt:
  - no-new-privileges:true
read_only: true  # 루트 파일 시스템 읽기 전용
tmpfs:
  - /tmp
```

## 참고 자료

### 내부 문서
- **SPEC**: [.moai/specs/SPEC-INFRA-001/spec.md](../.moai/specs/SPEC-INFRA-001/spec.md) - EARS 요구사항 명세
- **테스트**: [tests/infra/docker-compose.test.ts](../tests/infra/docker-compose.test.ts) - 통합 테스트 케이스
- **설정 파일**:
  - [docker-compose.yml](../docker-compose.yml) - 서비스 정의
  - [nginx/nginx.conf](../nginx/nginx.conf) - Nginx 설정
  - [.env.example](../.env.example) - 환경 변수 템플릿

### 외부 문서
- [Docker Compose V2 Specification](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Official Image](https://hub.docker.com/_/postgres)
- [Redis Official Image](https://hub.docker.com/_/redis)
- [Nginx Official Image](https://hub.docker.com/_/nginx)
- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)

### 관련 SPEC
- **SPEC-SETUP-001**: 모노레포 기반 구조 (프로젝트 초기 설정)
- **SPEC-AUTH-001**: 사용자 인증 및 세션 관리 (Redis 세션 활용)

---

**문서 버전**: v1.0.0 (2025-10-11)
**작성자**: MoAI-ADK doc-syncer
**마지막 업데이트**: 2025-10-11
**TAG**: @DOC:INFRA-001
