# SPEC-INFRA-001 수락 기준

> Docker Compose 기반 인프라 통합의 완료 조건 및 검증 시나리오

## Definition of Done (완료 정의)

### 필수 조건 ✅

- [ ] **docker-compose.yml** 작성 완료 (4개 서비스: postgres, redis, nginx, minio)
- [ ] **.env.example** 템플릿 제공 (비밀번호 예시 포함)
- [ ] **nginx/nginx.conf** 리버스 프록시 설정 완료
- [ ] 모든 컨테이너 Health Check 통과 (`docker compose ps` 결과 `healthy`)
- [ ] `docker compose up` 한 번에 전체 인프라 시작 성공
- [ ] 테스트 커버리지 ≥85% (tests/infra/)
- [ ] `.gitignore`에 `.env`, `docker/volumes/` 추가
- [ ] README.md에 "인프라 구성" 섹션 추가

### 선택 조건 (Nice to Have)

- [ ] SSL 인증서 설정 (자체 서명 인증서)
- [ ] Prometheus exporter 통합 (모니터링 준비)
- [ ] 로그 중앙화 (Loki + Grafana 고려)
- [ ] 개발/프로덕션 환경 분리 (docker-compose.prod.yml)

## Given-When-Then 시나리오

### 시나리오 1: 전체 인프라 시작 🚀

**Given**:
- Docker Desktop이 실행 중이다
- `.env` 파일이 준비되어 있다 (또는 `.env.example` 복사)
- 포트 5432, 6379, 80, 9000, 9001이 사용 가능하다

**When**:
```bash
docker compose up -d
```

**Then**:
- 4개 컨테이너(postgres, redis, nginx, minio)가 모두 시작된다
- `docker compose ps` 결과 모든 서비스가 `Up (healthy)` 상태다
- 30초 이내에 모든 Health Check가 통과한다
- 로그에 에러가 없다 (`docker compose logs`)

**검증 명령**:
```bash
docker compose ps --format json | jq -r '.[] | select(.Health != "healthy") | .Name'
# 출력: (비어있음) → 모든 서비스 healthy
```

---

### 시나리오 2: PostgreSQL 데이터 영속성 💾

**Given**:
- PostgreSQL 컨테이너가 실행 중이다
- 테스트 테이블을 생성한다:
```sql
CREATE TABLE test_persistence (id SERIAL PRIMARY KEY, data TEXT);
INSERT INTO test_persistence (data) VALUES ('persistence test');
```

**When**:
```bash
docker compose restart postgres
# 또는
docker compose down && docker compose up -d
```

**Then**:
- 재시작 후 `test_persistence` 테이블이 여전히 존재한다
- 데이터 `'persistence test'`가 유지된다
- 볼륨 마운트 경로 `./docker/volumes/postgres/`에 데이터 파일이 있다

**검증 명령**:
```bash
docker compose exec postgres psql -U liaruser -d liardb -c "SELECT * FROM test_persistence;"
# 출력: id | data
#       1  | persistence test
```

---

### 시나리오 3: Nginx 리버스 프록시 🌐

**Given**:
- API 서버가 호스트 localhost:3000에서 실행 중이다
- Nginx 컨테이너가 실행 중이다

**When**:
```bash
curl http://localhost/api/health
curl http://localhost/health
```

**Then**:
- `/api/health` 요청이 `localhost:3000/health`로 프록시된다
- 응답 상태 코드가 200이다
- Nginx Health Check 엔드포인트 `/health`가 응답한다 (`OK`)

**검증 명령**:
```bash
curl -o /dev/null -s -w "%{http_code}\n" http://localhost/health
# 출력: 200

curl -o /dev/null -s -w "%{http_code}\n" http://localhost/api/health
# 출력: 200 (API 서버가 실행 중인 경우)
```

---

### 시나리오 4: Redis 캐싱 ⚡

**Given**:
- Redis 컨테이너가 실행 중이다
- Redis 비밀번호가 `.env`에 설정되어 있다

**When**:
```bash
docker compose exec redis redis-cli -a "$REDIS_PASSWORD" SET test_key "test_value"
docker compose exec redis redis-cli -a "$REDIS_PASSWORD" GET test_key
```

**Then**:
- SET 명령이 성공한다 (응답: `OK`)
- GET 명령이 저장된 값을 반환한다 (응답: `"test_value"`)
- 재시작 후에도 AOF 덕분에 데이터가 유지된다

**검증 명령**:
```bash
docker compose exec redis redis-cli -a "$(grep REDIS_PASSWORD .env | cut -d '=' -f2)" PING
# 출력: PONG
```

---

### 시나리오 5: MinIO S3 스토리지 📦

**Given**:
- MinIO 컨테이너가 실행 중이다
- MinIO Console에 접속할 수 있다 (`http://localhost:9001`)

**When**:
1. MinIO Console에 로그인 (MINIO_ROOT_USER, MINIO_ROOT_PASSWORD)
2. 버킷 `liar-game-logs` 생성
3. 테스트 파일 업로드

**Then**:
- 버킷 생성이 성공한다
- 파일 업로드/다운로드가 정상 작동한다
- S3 API 호환 클라이언트(AWS SDK)로 접근 가능하다

**검증 명령**:
```bash
# MinIO Client (mc) 설치 후
mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
mc mb local/liar-game-logs
mc ls local/
# 출력: liar-game-logs
```

---

### 시나리오 6: Health Check 자동 재시작 🔄

**Given**:
- 모든 컨테이너가 실행 중이다
- Health Check가 설정되어 있다

**When**:
- PostgreSQL 프로세스를 강제로 종료한다:
```bash
docker compose exec postgres pkill -9 postgres
```

**Then**:
- Health Check가 실패를 감지한다 (상태: `unhealthy`)
- Docker가 자동으로 컨테이너를 재시작한다 (restart: unless-stopped)
- 재시작 후 Health Check가 다시 통과한다 (상태: `healthy`)

**검증 명령**:
```bash
docker compose ps --format "table {{.Name}}\t{{.Health}}"
# 실시간 상태 변화 관찰
```

---

### 시나리오 7: 환경 변수 변경 적용 🔧

**Given**:
- `.env` 파일이 존재한다
- 컨테이너가 실행 중이다

**When**:
```bash
# .env 파일 수정
sed -i '' 's/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=new-password/' .env
docker compose up -d
```

**Then**:
- Docker Compose가 변경을 감지한다
- 컨테이너 재생성이 필요함을 알린다 (메시지 출력)
- `docker compose up -d --force-recreate` 실행 시 새 비밀번호 적용

**검증 명령**:
```bash
docker compose config | grep POSTGRES_PASSWORD
# 출력: POSTGRES_PASSWORD: new-password
```

---

### 시나리오 8: 네트워크 격리 검증 🔒

**Given**:
- `liar-game-network` 브릿지 네트워크가 생성되어 있다
- 모든 컨테이너가 이 네트워크에 속한다

**When**:
```bash
docker network inspect liar-game-network
```

**Then**:
- 4개 컨테이너(postgres, redis, nginx, minio)가 네트워크에 연결되어 있다
- 컨테이너 간 서비스명으로 통신 가능하다 (예: `postgres:5432`)
- 외부에서는 포트를 통해서만 접근 가능하다

**검증 명령**:
```bash
docker compose exec nginx ping -c 1 postgres
# 출력: 64 bytes from postgres.liar-game-network (xxx.xxx.xxx.xxx): icmp_seq=1
```

---

## 품질 게이트 (Quality Gates)

### 기능 검증
- [ ] `docker compose up -d` 성공률 100% (3회 테스트)
- [ ] 모든 Health Check 통과 (4/4 서비스)
- [ ] 재시작 후 데이터 유지 (PostgreSQL, Redis)
- [ ] Nginx 프록시 정상 작동 (API, WebSocket)

### 성능 검증
- [ ] 전체 시작 시간 ≤30초 (이미지 다운로드 제외)
- [ ] Health Check 응답 시간 ≤5초 (각 서비스)
- [ ] 리소스 사용량 ≤3GB 메모리 (전체 컨테이너 합산)
- [ ] CPU 사용률 ≤50% (유휴 상태)

### 보안 검증
- [ ] `.env` 파일이 Git에 추적되지 않음
- [ ] 비밀번호가 평문으로 노출되지 않음 (로그, 설정)
- [ ] 볼륨 권한이 올바름 (chmod 700 for postgres)
- [ ] 불필요한 포트가 외부 노출되지 않음

### 문서 검증
- [ ] `.env.example` 템플릿이 명확함
- [ ] README.md에 인프라 구성 방법 기술
- [ ] 트러블슈팅 가이드 포함 (포트 충돌, 권한 오류 등)
- [ ] TAG 체인 완전성 (@SPEC → @TEST → @CODE → @DOC)

## 테스트 커버리지 목표

### 단위 테스트 (40%)
- Health Check 명령 파싱
- 환경 변수 검증
- 설정 파일 구문 검증

### 통합 테스트 (40%)
- Docker Compose 전체 플로우
- 컨테이너 간 통신
- 데이터 영속성

### E2E 테스트 (20%)
- API + DB + Redis 연동
- WebSocket + Nginx 프록시
- MinIO S3 파일 업로드

**전체 커버리지**: ≥85% (필수)

## 회귀 테스트 (Regression Tests)

### 매 PR마다 실행
```bash
# CI/CD 파이프라인
- name: Test Docker Compose
  run: |
    docker compose up -d
    sleep 30  # Health Check 대기
    docker compose ps --format json | jq -r '.[] | select(.Health != "healthy") | .Name' | wc -l | grep -q "^0$"
    docker compose down
```

### 주요 시나리오 자동화
- 전체 인프라 시작 (시나리오 1)
- 데이터 영속성 (시나리오 2)
- Health Check 자동 재시작 (시나리오 6)

## 문제 해결 가이드

### 문제: 포트 충돌
```bash
# 증상
Error: Bind for 0.0.0.0:5432 failed: port is already allocated

# 해결
lsof -i :5432
kill -9 <PID>
# 또는 .env에서 포트 변경
```

### 문제: 볼륨 권한 오류
```bash
# 증상
initdb: could not change permissions of directory "/var/lib/postgresql/data"

# 해결
sudo chmod 700 ./docker/volumes/postgres
sudo chown -R $USER:$USER ./docker/volumes/
```

### 문제: Health Check 무한 대기
```bash
# 증상
Waiting for postgres to be healthy...

# 디버깅
docker compose logs postgres
docker compose exec postgres pg_isready -U liaruser

# 해결: Health Check 명령 수정 또는 타임아웃 연장
```

### 문제: 네트워크 충돌
```bash
# 증상
Error: network liar-game-network already exists

# 해결
docker network rm liar-game-network
docker compose up
```

## 다음 단계

1. **즉시 실행**:
   - `/alfred:2-build SPEC-INFRA-001` (TDD 구현)
   - `docker compose up -d` (실제 환경 테스트)

2. **후속 작업**:
   - `/alfred:3-sync` (문서 동기화)
   - SPEC-DEPLOY-001 작성 (CI/CD)

3. **모니터링 준비**:
   - Prometheus + Grafana 검토
   - 로그 중앙화 (Loki) 검토

---

**수락 기준 작성일**: 2025-10-11
**검증 담당자**: m16khb
**최종 검토**: TDD 완료 후 전체 시나리오 재검증 필요
