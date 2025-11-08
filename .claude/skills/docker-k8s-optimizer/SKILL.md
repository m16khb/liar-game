---
name: docker-k8s-optimizer
description: 클라우드 네이티브 인프라용 Docker 컨테이너 및 Kubernetes 배포 최적화. 애플리케이션 컨테이너화, 개발 환경 설정, 프로덕션 배포 구성, liar-game 프로젝트 CI/CD 파이프라인 구현 시 사용합니다.
---

# Docker & Kubernetes 최적화기

## 지침

효율적인 클라우드 네이티브 인프라 솔루션 생성:

1. **최적화된 이미지 크기용 다단계 Docker 빌드 설계**
2. **Docker Compose로 개발 환경 설정**
3. **프로덕션 워크로드용 Kubernetes 배포 구성**
4. **자동화된 배포용 CI/CD 파이프라인 구현**
5. **운영 우수성을 위한 모니터링 및 상태 확인 추가**

## 예시

### 다단계 Dockerfile
```dockerfile
# apps/api/Dockerfile
FROM node:25-alpine AS builder

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY apps/api ./apps/api
COPY packages ./packages
WORKDIR /app/apps/api
RUN pnpm run build

# 프로덕션 단계
FROM node:25-alpine AS production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/node_modules ./node_modules

USER nestjs

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

EXPOSE 4000
CMD ["node", "dist/main"]
```

### 개발용 Docker Compose
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
      target: builder
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=development
      - DB_HOST=host.docker.internal
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./apps/api:/app/apps/api
      - ./packages:/app/packages
      - /app/apps/api/node_modules
    depends_on:
      - redis
    command: pnpm run start:dev

  redis:
    image: redis:8-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_dev_data:
```

### Kubernetes 배포
```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: liar-game-api
  namespace: liar-game
spec:
  replicas: 3
  selector:
    matchLabels:
      app: liar-game-api
  template:
    metadata:
      labels:
        app: liar-game-api
    spec:
      containers:
      - name: api
        image: liar-game/api:latest
        ports:
        - containerPort: 4000
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: liar-game-config
              key: NODE_ENV
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: liar-game-secrets
              key: db-password
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 4000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: liar-game-api
  namespace: liar-game
spec:
  selector:
    app: liar-game-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 4000
  type: ClusterIP
```

### 포트 포워딩 스크립트
```bash
#!/bin/bash
# scripts/dev-setup.sh

echo "K8s 서비스용 포트 포워딩 설정..."

kubectl port-forward -n liar-game svc/mysql 3306:3306 &
MYSQL_PID=$!

kubectl port-forward -n liar-game svc/redis 6379:6379 &
REDIS_PID=$!

echo $MYSQL_PID > .mysql_pid
echo $REDIS_PID > .redis_pid

echo "포트 포워딩 시작:"
echo "MySQL: localhost:3306"
echo "Redis: localhost:6379"

trap "kill $MYSQL_PID $REDIS_PID; rm -f .mysql_pid .redis_pid" EXIT
wait
```

## 핵심 패턴

- **다단계 빌드**: 빌드 및 런타임 환경 분리
- **상태 확인**: 항상 liveness 및 readiness 프로브 포함
- **리소스 제한**: 적절한 CPU 및 메모리 제한 설정
- **환경 분리**: dev/staging/prod용 다른 설정
- **보안 모범 사례**: 비-root 사용자, 최소 기본 이미지
- **볼륨 관리**: 데이터베이스용 영구 스토리지
- **로드 밸런싱**: 트래픽 분산용 K8s 서비스 사용