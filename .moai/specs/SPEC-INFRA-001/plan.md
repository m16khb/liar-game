# SPEC-INFRA-001 구현 계획

> Docker Compose 기반 인프라 통합 구현 전략

## TDD 구현 전략

### RED-GREEN-REFACTOR 사이클

#### 1️⃣ RED Phase (테스트 작성)
**파일**: `tests/infra/docker-compose.test.ts`

```typescript
// @TEST:INFRA-001 | SPEC: SPEC-INFRA-001.md
describe('Docker Compose Infrastructure', () => {
  // 컨테이너 상태 검증
  test('모든 컨테이너가 실행 중이어야 한다', async () => {
    const services = ['postgres', 'redis', 'nginx', 'minio'];
    // docker compose ps --format json 파싱
    // 각 서비스 State === 'running' 확인
  });

  // Health Check 검증
  test('모든 서비스 Health Check 통과해야 한다', async () => {
    // postgres: pg_isready
    // redis: redis-cli ping
    // nginx: curl http://localhost/health
    // minio: curl http://localhost:9000/minio/health/live
  });

  // 데이터 영속성 검증
  test('PostgreSQL 재시작 후 데이터가 유지되어야 한다', async () => {
    // 1. 테스트 테이블 생성
    // 2. docker compose restart postgres
    // 3. 테이블 존재 확인
  });

  // 네트워크 검증
  test('컨테이너 간 통신이 가능해야 한다', async () => {
    // API 컨테이너에서 postgres, redis 연결 테스트
  });

  // 환경 변수 검증
  test('.env 파일이 올바르게 로드되어야 한다', async () => {
    // POSTGRES_USER, POSTGRES_PASSWORD 등 확인
  });
});
```

#### 2️⃣ GREEN Phase (최소 구현)
**파일**: `docker-compose.yml`, `.env.example`, `nginx/nginx.conf`

```yaml
# @CODE:INFRA-001 | SPEC: SPEC-INFRA-001.md | TEST: tests/infra/docker-compose.test.ts
# docker-compose.yml 최소 구성
version: '3.8'

services:
  postgres:
    image: postgres:16
    # 기본 설정만 추가 (테스트 통과 목적)

  redis:
    image: redis:7
    # 기본 설정만 추가

  # ... (최소 구성으로 테스트 통과)
```

#### 3️⃣ REFACTOR Phase (품질 개선)
- Health Check 타임아웃 최적화
- 리소스 제한 추가 (메모리, CPU)
- 네트워크 격리 강화
- 로깅 설정 개선 (json-file driver, rotate)
- Nginx 설정 최적화 (gzip, cache)

## 파일 구조

```
liar-game/
├── docker-compose.yml              # @CODE:INFRA-001
├── .env                            # Git 미추적 (실제 비밀번호)
├── .env.example                    # @CODE:INFRA-001 (템플릿)
├── .gitignore                      # .env 추가
├── nginx/
│   ├── nginx.conf                  # @CODE:INFRA-001
│   └── ssl/                        # SSL 인증서 (향후)
├── docker/
│   └── volumes/                    # 데이터 볼륨 (Git 미추적)
│       ├── postgres/
│       ├── redis/
│       └── minio/
├── tests/
│   └── infra/
│       └── docker-compose.test.ts  # @TEST:INFRA-001
└── .moai/
    └── specs/
        └── SPEC-INFRA-001/
            ├── spec.md             # @SPEC:INFRA-001
            ├── plan.md             # 이 문서
            └── acceptance.md       # 수락 기준
```

## 마일스톤 (우선순위 기반)

### 1차 목표: 기본 인프라 구동 ✅
- [ ] docker-compose.yml 작성 (4개 서비스)
- [ ] .env.example 템플릿 생성
- [ ] `docker compose up` 성공 (모든 컨테이너 시작)
- [ ] Health Check 기본 구성

**완료 조건**:
- `docker compose ps` 결과 모두 `Up` 상태
- 포트 충돌 없음 (5432, 6379, 80, 9000, 9001)

### 2차 목표: 데이터 영속성 보장 🔄
- [ ] 볼륨 마운트 설정 (postgres, redis, minio)
- [ ] `./docker/volumes/` 디렉토리 생성
- [ ] `.gitignore`에 volumes/ 추가
- [ ] 재시작 후 데이터 유지 검증

**완료 조건**:
- 컨테이너 재시작 후 데이터 손실 없음
- 볼륨 권한 올바름 (chmod 700 for postgres)

### 3차 목표: Nginx 리버스 프록시 구성 🌐
- [ ] nginx.conf 작성 (API 프록시 설정)
- [ ] Health Check 엔드포인트 (/health)
- [ ] WebSocket 프록시 설정 (/ws/)
- [ ] CORS 설정

**완료 조건**:
- `curl http://localhost/health` 응답 200
- API 프록시 정상 작동 (localhost:80/api → localhost:3000)

### 4차 목표: 프로덕션 준비 🚀
- [ ] 리소스 제한 설정 (메모리, CPU)
- [ ] 로깅 드라이버 설정 (json-file, rotate)
- [ ] Health Check 고도화 (interval, retries 최적화)
- [ ] 모니터링 준비 (Prometheus exporter 고려)

**완료 조건**:
- `docker stats` 리소스 사용량 정상 범위
- 로그 로테이션 작동
- Health Check 실패 시 자동 재시작

## 기술적 접근 방법

### Docker Compose 버전 전략
- **v2.20+** 사용 (최신 문법 지원)
- `docker compose` 명령 (하이픈 없음) 사용
- `docker-compose.yml` 파일명 유지 (호환성)

### Health Check 전략
- **간격 (interval)**: 10s (기본), 30s (MinIO - 무거움)
- **타임아웃 (timeout)**: 5s
- **재시도 (retries)**: 3~5회
- **시작 대기 (start_period)**: 서비스별 조정

### 네트워크 전략
- **브릿지 네트워크**: 컨테이너 간 격리
- **호스트 접근**: `host.docker.internal` (macOS/Windows)
- **서비스 디스커버리**: Docker DNS (서비스명으로 접근)

### 보안 전략
- **비밀번호 관리**: `.env` 파일 (Git 미추적)
- **볼륨 권한**: `chmod 700` (PostgreSQL 요구사항)
- **네트워크 격리**: 외부 노출 최소화
- **이미지 버전**: 명시적 태그 사용 (latest 금지)

## 리스크 및 대응 방안

### 리스크 1: 포트 충돌
**증상**: `Error: port is already allocated`
**대응**:
- `lsof -i :5432` 등으로 포트 사용 프로세스 확인
- `.env`에서 포트 변경 (예: 5433, 6380)
- 기존 프로세스 종료 또는 Docker 포트만 변경

### 리스크 2: 볼륨 권한 오류
**증상**: PostgreSQL 시작 실패 (`initdb: could not change permissions`)
**대응**:
```bash
chmod 700 ./docker/volumes/postgres
chown -R $USER:$USER ./docker/volumes/
```

### 리스크 3: 네트워크 충돌
**증상**: `network liar-game-network already exists`
**대응**:
```bash
docker network rm liar-game-network
docker compose up
```

### 리스크 4: 이미지 다운로드 실패
**증상**: `Error pulling image`
**대응**:
- Docker Hub 로그인 확인
- 프록시 설정 확인
- 미러 레지스트리 사용 (중국/기업 환경)

### 리스크 5: Health Check 무한 대기
**증상**: 컨테이너가 `starting` 상태에서 멈춤
**대응**:
- `docker logs <container>` 로그 확인
- Health Check 명령 수동 실행 테스트
- interval/timeout 값 조정

## 의존성 관리

### SPEC 의존성
- **SETUP-001**: 프로젝트 초기 설정 (package.json, 디렉토리 구조)
  - `.gitignore` 파일 존재 필요
  - Node.js 개발 환경 구성 완료

### 외부 의존성
- Docker Desktop 24.0+ 또는 Docker Engine
- docker compose CLI v2.20+
- 네트워크 연결 (이미지 다운로드)
- 디스크 공간 5GB+

## 테스트 전략

### 단위 테스트
- Health Check 명령 검증
- 환경 변수 파싱 테스트
- 설정 파일 구문 검증

### 통합 테스트
- `docker compose up` 전체 플로우
- 컨테이너 간 통신 (API → DB)
- 재시작 후 데이터 영속성

### E2E 테스트
- API 서버 + DB + Redis 전체 연동
- WebSocket 연결 (Nginx 프록시 경유)
- MinIO 파일 업로드/다운로드

### 성능 테스트
- 동시 컨테이너 시작 시간 (<30초)
- Health Check 응답 시간 (<5초)
- 리소스 사용량 (메모리 <3GB)

## 다음 단계

1. **TDD 구현**: `/alfred:2-build SPEC-INFRA-001`
   - RED: 테스트 작성 (tests/infra/)
   - GREEN: Docker Compose 파일 작성
   - REFACTOR: 설정 최적화

2. **문서 동기화**: `/alfred:3-sync`
   - Living Document 업데이트
   - TAG 체인 검증
   - README.md 업데이트

3. **후속 SPEC**:
   - SPEC-DEPLOY-001: CI/CD 파이프라인 (GitHub Actions)
   - SPEC-MONITOR-001: 모니터링 (Prometheus + Grafana)
   - SPEC-BACKUP-001: 백업 전략 (PostgreSQL, MinIO)

---

**계획 수립일**: 2025-10-11
**예상 복잡도**: Medium (Docker Compose 경험 있으면 Low)
**예상 파일 수**: 5개 (yml, env, conf, test, doc)
