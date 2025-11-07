# Quick Start Guide: 프로젝트 기초 생성

## 개요
헌법 기반의 라이어 게임 프로젝트를 설정하는 가이드입니다. React 18 + Compiler와 NestJS 11 + Fastify, TypeORM으로 최소한의 기능만 구현합니다.

## 사전 요구사항

### 필수 도구
- **Node.js**: 25.1.0 이상
- **pnpm**: 10.x 이상
- **Docker**: 24.x 이상
- **Docker Compose**: V2 이상
- **Git**: 2.x 이상

### Kubernetes 클러스터 준비
Kubernetes 클러스터가 준비되어 있어야 합니다.

## 1단계: 프로젝트 구조 생성

### Turborepo 모노레포 초기화
```bash
# 프로젝트 디렉토리 생성
mkdir liar-game-new
cd liar-game-new

# package.json 초기화
pnpm init

# Turborepo 설정 설치
pnpm add -D turbo
pnpm add -D typescript @types/node

# pnpm 워크스페이스 설정
echo 'packages:\n  - "apps/*"\n  - "packages/*"' > pnpm-workspace.yaml

# Turborepo 설정
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
EOF
```

### 모노레포 구조 생성
```bash
# 애플리케이션 디렉토리
mkdir -p apps/web/src/{components,hooks,pages,lib}
mkdir -p apps/api/src/{auth,room,game,gateway}
mkdir -p apps/api/test

# 공유 패키지 디렉토리
mkdir -p packages/{types,config,ui,constants}
mkdir -p packages/types/src
mkdir -p packages/config/src
mkdir -p packages/ui/src
mkdir -p packages/constants/src

# 문서 디렉토리
mkdir -p docs/architecture
```

## 2단계: 프론트엔드 설정 (React 18 + Compiler)

### 기본 패키지 설치
```bash
cd apps/web

# React 18 + Compiler 설정
pnpm add react@18 react-dom@18
pnpm add -D @types/react@18 @types/react-dom@18
pnpm add -D vite @vitejs/plugin-react
pnpm add -D typescript

# 빌드 도구
pnpm add -D turbo

# 상태 관리 (필요한 경우만)
# pnpm add zustand

# 스타일링 (선택)
# pnpm add tailwindcss
```

### Vite 설정
```bash
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist'
  }
})
EOF
```

### TypeScript 설정
```bash
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF
```

### 기본 앱 컴포넌트
```bash
cat > src/App.tsx << 'EOF'
// React 18 + Compiler 기반 기본 앱 컴포넌트
// 한국어 주석으로 비즈니스 로직 설명

import React from 'react'

/**
 * 메인 애플리케이션 컴포넌트
 * 라이어 게임의 진입점 역할
 */
function App() {
  return (
    <div className="App">
      <header>
        <h1>라이어 게임</h1>
        <p>헌법 기반 최소 구현 프로젝트</p>
      </header>
      <main>
        {/* TODO: 인증 및 게임 기능 구현 */}
      </main>
    </div>
  )
}

export default App
EOF
```

## 3단계: 백엔드 설정 (NestJS 11 + Fastify)

### 기본 패키지 설치
```bash
cd ../api

# NestJS CLI
pnpm add -D @nestjs/cli
pnpm add @nestjs/core @nestjs/common @nestjs/platform-fastify

# TypeORM 설정
pnpm add @nestjs/typeorm typeorm mysql2

# 기타 필요한 패키지
pnpm add class-validator class-transformer
pnpm add @nestjs/config
pnpm add socket.io @nestjs/websockets

# 개발 도구
pnpm add -D @types/node
pnpm add -D jest @types/jest
pnpm add -D supertest @types/supertest

# 빌드 도구
pnpm add -D turbo
```

### NestJS 프로젝트 초기화
```bash
# NestJS CLI로 기본 구조 생성
npx nest new . --package-manager pnpm --skip-git

# Fastify로 플랫폼 변경
pnpm remove @nestjs/platform-express
pnpm add @nestjs/platform-fastify
```

### TypeORM 설정
```bash
# src/config/database.ts 생성
mkdir -p src/config
cat > src/config/database.ts << 'EOF'
// TypeORM 데이터베이스 설정
// MySQL v8 LTS 연결을 위한 설정

import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { User } from '../auth/entities/user.entity'
import { GameRoom } from '../room/entities/game-room.entity'
import { RoomPlayer } from '../room/entities/room-player.entity'

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'liaruser',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'liardb',
  entities: [User, GameRoom, RoomPlayer],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  timezone: '+00:00', // UTC 기준
}
EOF
```

### 환경 변수 설정
```bash
cat > .env.example << 'EOF'
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=liaruser
DB_PASSWORD=change-this-password
DB_NAME=liardb

# Supabase 설정
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 서버 설정
PORT=4000
NODE_ENV=development
EOF

cp .env.example .env
```

## 4단계: 공유 패키지 설정

### 타입 패키지
```bash
cd ../../packages/types

# 기본 패키지 설정
pnpm init -y
pnpm add -D typescript

# 공유 타입 정의
cat > src/index.ts << 'EOF'
// 프론트엔드와 백엔드에서 공유하는 타입 정의

export interface User {
  id: string
  email: string
  nickname: string
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface GameRoom {
  id: string
  hostId: string
  name: string
  maxPlayers: number
  currentPlayers: number
  status: 'waiting' | 'playing' | 'finished'
  createdAt: Date
  updatedAt: Date
}

export interface RoomPlayer {
  id: string
  roomId: string
  userId: string
  nickname: string
  avatarUrl?: string
  isHost: boolean
  joinedAt: Date
  isActive: boolean
}

// Socket.IO 이벤트 타입
export interface SocketEvents {
  'join-room': { roomCode: string }
  'leave-room': {}
  'room-joined': { room: GameRoom; player: RoomPlayer }
  'room-left': { playerId: string }
  'player-joined': { player: RoomPlayer }
  'player-left': { playerId: string }
  'error': { code: string; message: string }
}
EOF
```

## 5단계: Kubernetes 배포 설정

### 기본 배포 설정
```bash
cd ../../

# k8s 디렉토리 생성
mkdir -p k8s/{frontend,backend,ingress}

# 백엔드 배포 설정
cat > k8s/backend/deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: liar-game-api
  labels:
    app: liar-game-api
spec:
  replicas: 1
  selector:
    matchLabels:
      app: liar-game-api
  template:
    metadata:
      labels:
        app: liar-game-api
    spec:
      containers:
      - name: liar-game-api
        image: liar-game-api:latest
        ports:
        - containerPort: 4000
        env:
        - name: DB_HOST
          value: "mysql-service"
        - name: DB_USERNAME
          value: "liaruser"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: liar-game-secrets
              key: mysql-password
        - name: DB_NAME
          value: "liardb"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: liar-game-api-service
spec:
  selector:
    app: liar-game-api
  ports:
    - protocol: TCP
      port: 80
      targetPort: 4000
  type: ClusterIP
EOF
```

## 6단계: 개발 서버 실행

### 로컬 개발 환경
```bash
# 루트 디렉토리로 이동
cd liar-game-new

# 의존성 설치
pnpm install

# 개발 서버 실행 (병렬)
pnpm turbo dev
```

### 빌드 테스트
```bash
# 전체 빌드
pnpm turbo build

# 테스트 실행
pnpm turbo test
```

## 다음 단계

1. **Supabase 프로젝트 설정**: https://supabase.com에서 프로젝트 생성
2. **데이터베이스 마이그레이션**: TypeORM 마이그레이션 실행
3. **인증 구현**: Supabase Auth 연동
4. **WebSocket 구현**: Socket.IO로 실시통신 기능 개발

## 문제 해결

### 빌드 오류
```bash
# 의존성 재설치
rm -rf node_modules
pnpm install

# Turborepo 캐시 정리
pnpm turbo clean
```

### 데이터베이스 연결 오류
```bash
# MySQL 서버 확인
docker ps | grep mysql

# 환경 변수 확인
cat .env
```

### K8s 배포 오류
```bash
# 파드 상태 확인
kubectl get pods
kubectl describe pod <pod-name>

# 로그 확인
kubectl logs <pod-name>
```

## 성공 확인

다음 명령어로 설정이 완료되었는지 확인하세요:

```bash
# 개발 서버 실행 확인
curl http://localhost:4000/api/health
curl http://localhost:3000

# K8s 배포 확인
kubectl get deployments
kubectl get services
```

30분 이내에 모든 설정이 완료되고 개발 서버가 정상적으로 실행되면 성공입니다!