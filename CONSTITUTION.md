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

## 금지사항

- Docker Compose에서 MySQL/Redis 실행 금지
- 로컬 데이터베이스와 K8s 데이터베이스 혼용 금지
- K8s 없이 애플리케이션 단독 실행 금지 (인프라 의존성)

---
**최종 수정일**: 2025-11-07
**적용 버전**: v1.0