# Claude AI 에이전트 및 스킬 가이드

이 디렉토리에는 liar-game 프로젝트를 위한 전문화된 Claude Code sub-agents와 skills가 포함되어 있습니다.

## 📁 디렉토리 구조

```
.claude/
├── agents/                    # 전문 분석 에이전트
│   ├── game-logic-analyzer.md    # 게임 로직 분석 전문가
│   ├── database-architect.md     # 데이터베이스 아키텍트
│   ├── auth-security-specialist.md # 인증/보안 전문가
│   └── kubernetes-deployment-expert.md # K8s 배포 전문가
├── skills/                    # 자동 호출 기능 스킬
│   ├── api-endpoint-generator/SKILL.md  # API 엔드포인트 생성
│   ├── websocket-gateway-builder/SKILL.md # WebSocket Gateway 구축
│   ├── typeorm-migration-generator/SKILL.md # TypeORM 마이그레이션 생성
│   ├── docker-k8s-optimizer/SKILL.md    # Docker/K8s 최적화
│   └── nestjs-test-specialist/SKILL.md  # NestJS 테스트 전문가
└── README.md               # 이 파일
```

## 🤖 Sub-agents 사용법

Sub-agents는 Claude가 특정 작업 유형을 감지했을 때 자동으로 호출하는 전문 분석 에이전트입니다.

### 자동 호출 예시
```
사용자: "게임 로직에 성능 문제가 있는 것 같아 분석해줘"
Claude: (자동으로 game-logic-analyzer sub-agent 호출)
```

### 수동 호출 예시
```
사용자: "database-architect subagent를 사용해서 데이터베이스 스키마를 검토해줘"
Claude: (명시적으로 database-architect sub-agent 호출)
```

## 🛠️ Skills 사용법

Skills는 사용자의 요청 내용에 따라 Claude가 자동으로 활용하는 전문 기능입니다.

### 자동 활용 예시
```
사용자: "이 플레이어의 발언에서 거짓말을 찾아봐"
Claude: (deception-detector skill 자동 활용)
```

```
사용자: "방어할 만한 알리바이를 만들어줘"
Claude: (alibi-generator skill 자동 활용)
```

## 🎯 주요 기능

### 게임 로직 분석
- **game-logic-analyzer**: NestJS 계층별 로직 분석, WebSocket 통신 검토
- 실시간 게임 상태 관리 최적화
- AI 플레이어 행동 알고리즘 검증

### 데이터베이스 최적화
- **database-architect**: TypeORM 엔티티 설계, 성능 분석
- Kubernetes 환경 MySQL/Redis 운영 가이드
- 쿼리 최적화 및 인덱스 설계

### 보안 강화
- **auth-security-specialist**: Supabase Auth 보안 검토
- JWT 토큰 관리 및 OAuth 취약점 분석
- API 엔드포인트 보안 점검

### 인프라 관리
- **kubernetes-deployment-expert**: K8s 매니페스트 최적화
- CI/CD 배포 전략 수립
- 모니터링 및 장애 대응 가이드

### 개발 인프라 기능
- **api-endpoint-generator**: NestJS API 엔드포인트 생성
  - Controller, Service, DTO, Entity 완전한 CRUD 구조
  - 일관된 API 패턴과 타입 안전성 확보

- **websocket-gateway-builder**: Socket.IO Gateway 구축
  - 실시간 통신을 위한 WebSocket Gateway 생성
  - 방 관리, 게임 상태 동기화, 이벤트 처리 구현

- **typeorm-migration-generator**: TypeORM 마이그레이션 생성
  - Entity 변경 사항을 안전한 마이그레이션으로 변환
  - 롤백 가능한 MySQL 기반 데이터베이스 스키마 관리

- **docker-k8s-optimizer**: Docker 및 Kubernetes 최적화
  - 컨테이너화 및 K8s 배포 전략 수립
  - 개발/운영 환경의 효율성과 안정성 확보

### 테스트 자동화
- **nestjs-test-specialist**: 단위 테스트 작성 및 커버리지 최적화
- Service/Controller/Gateway 계층별 테스트 패턴
- Jest 모킹 및 테스트 데이터 관리

## 📋 사용 원칙

1. **자동 호출**: Claude가 작업 내용을 분석하여 가장 적합한 에이전트/스킬 선택
2. **한글 우선**: 모든 분석 결과와 출력은 한국어로 제공
3. **프로젝트 준수**: liar-game 기술 스택과 헌법 원칙 엄격 준수
4. **팀 공유**: 모든 에이전트와 스킬은 Git으로 버전 관리 및 팀 공유

## 🔧 커스터마이징

새로운 sub-agent나 skill을 추가하려면:
1. `.claude/agents/` 또는 `.claude/skills/`에 파일 생성
2. 프로젝트 기술 스택과 헌법 원칙 준수
3. 팀 표준과 일관된 형식 유지
4. Git에 커밋하여 팀원과 공유

---
*마지막 업데이트: 2025-11-08*