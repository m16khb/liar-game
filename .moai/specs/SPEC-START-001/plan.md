# SPEC-START-001 구현 계획

## 개요

게임 시작 및 실시간 진행 구현을 위한 상세 계획입니다. 이 구현은 SPEC-GAME-001의 설계를 실제로 구현하며, WebSocket 기반의 실시간 게임 진행 로직을 포함합니다.

## 구현 우선순위 (Priority-Based Milestones)

### Phase 1: 기본 게임 흐름 (Primary Goals)

**목표**: 게임 시작부터 종료까지 기본 흐름 구현

#### 1.1 역할 배정 및 키워드 선택
- **우선순위**: Critical (최우선)
- **의존성**: room.gateway.ts의 `start-game` 이벤트 활용
- **구현 파일**:
  - `apps/api/src/game/services/role-assignment.service.ts` (신규)
  - `apps/api/src/game/services/keyword-selection.service.ts` (신규)
  - `apps/api/src/game/entities/keyword.entity.ts` (신규)
- **주요 기능**:
  - 무작위 라이어 선택 (기본 1명)
  - 난이도별 키워드 선택
  - 역할 정보 암호화 전송
  - 키워드 데이터베이스 마이그레이션

#### 1.2 토론 단계 구현
- **우선순위**: Critical
- **의존성**: Phase 1.1 완료 후 시작
- **구현 파일**:
  - `apps/api/src/game/services/turn-manager.service.ts` (신규)
  - `apps/api/src/game/gateways/game.gateway.ts` (신규)
- **주요 기능**:
  - 턴 순서 랜덤 생성
  - 자동 턴 전환 (30초 타이머)
  - 발언 시스템 (WebSocket 이벤트)
  - 연결 끊김 처리 (5초 대기 후 스킵)

#### 1.3 투표 및 결과 집계
- **우선순위**: Critical
- **의존성**: Phase 1.2 완료 후 시작
- **구현 파일**:
  - `apps/api/src/game/services/voting.service.ts` (신규)
  - `apps/api/src/game/services/result-calculator.service.ts` (신규)
- **주요 기능**:
  - 익명 투표 시스템
  - 실시간 투표 진행률
  - 결과 집계 및 승패 결정
  - 역할 공개 및 결과 화면

#### 1.4 점수 시스템
- **우선순위**: Critical
- **의존성**: Phase 1.3 완료 후 시작
- **구현 파일**:
  - `apps/api/src/game/services/score-update.service.ts` (신규)
  - `apps/api/src/user/entities/user.entity.ts` (수정 - score 필드 추가)
  - `apps/api/src/game/services/keyword-guess.service.ts` (신규)
- **주요 기능**:
  - 누적 점수 관리 (User.score 필드)
  - 승리 조건별 점수 부여:
    * 시민 승리: 모든 시민 +1점
    * 라이어 승리: 라이어 +1점
    * 키워드 정답: 라이어 추가 +1점 (총 +2점)
  - 라이어 키워드 추측 시스템 (15초 제한)
  - 트랜잭션 기반 점수 업데이트 (원자성 보장)
  - 점수 변경 이력 로깅 (game_history)

### Phase 2: 실시간 최적화 (Secondary Goals)

**목표**: WebSocket 성능 최적화 및 안정성 강화

#### 2.1 Redis 캐싱 구현
- **우선순위**: High
- **의존성**: Phase 1 완료 후 시작
- **구현 파일**:
  - `apps/api/src/game/services/game-cache.service.ts` (신규)
  - `apps/api/src/common/redis/redis.module.ts` (기존 확장)
- **주요 기능**:
  - 게임 상태 캐싱 (1시간 TTL)
  - 빠른 조회 (데이터베이스 부하 감소)
  - 상태 동기화 (Redis + MySQL)

#### 2.2 타이머 시스템 구현
- **우선순위**: High
- **의존성**: Phase 1 완료 후 시작
- **구현 파일**:
  - `apps/api/src/game/services/game-timer.service.ts` (신규)
- **주요 기능**:
  - 서버 기준 시간 관리
  - 초당 타이머 업데이트 전송
  - 자동 단계 전환
  - 정확도 향상 (재귀 setTimeout)

#### 2.3 WebSocket 메시지 최적화
- **우선순위**: Medium
- **의존성**: Phase 1 완료 후 시작
- **최적화 항목**:
  - 메시지 압축 활성화
  - 배칭 (100ms 이내 이벤트 묶음)
  - 선택적 전송 (필요한 플레이어만)
  - 에러 처리 및 재연결 로직

### Phase 3: 프론트엔드 UI/UX (Final Goals)

**목표**: 실시간 게임 진행 화면 구현

#### 3.1 게임 진행 화면
- **우선순위**: High
- **의존성**: Phase 1 완료 후 시작
- **구현 파일**:
  - `apps/web/src/components/game/GamePlay.tsx` (신규)
  - `apps/web/src/components/game/RoleReveal.tsx` (신규)
  - `apps/web/src/components/game/DiscussionPhase.tsx` (신규)
  - `apps/web/src/hooks/useGamePlay.ts` (신규)
- **주요 기능**:
  - 역할 정보 표시 (개인별)
  - 키워드/카테고리 표시
  - 현재 턴 플레이어 강조
  - 발언 입력 및 표시

#### 3.2 투표 화면
- **우선순위**: High
- **의존성**: Phase 3.1 완료 후 시작
- **구현 파일**:
  - `apps/web/src/components/game/VotingPhase.tsx` (신규)
  - `apps/web/src/components/game/VotingProgress.tsx` (신규)
- **주요 기능**:
  - 플레이어 목록 표시 (자신 제외)
  - 투표 버튼 및 확인
  - 실시간 투표 진행률 표시
  - 타이머 표시

#### 3.3 결과 화면
- **우선순위**: High
- **의존성**: Phase 3.2 완료 후 시작
- **구현 파일**:
  - `apps/web/src/components/game/ResultPhase.tsx` (신규)
  - `apps/web/src/components/game/RoleRevealAnimation.tsx` (신규)
  - `apps/web/src/components/game/ScoreUpdateAnimation.tsx` (신규)
- **주요 기능**:
  - 승패 결과 표시
  - 역할 공개 애니메이션
  - 투표 결과 상세 표시
  - **점수 증감 애니메이션**:
    * 각 플레이어별 이전 점수 → 새 점수 전환
    * 점수 증가 시 녹색 (+1, +2) 표시
    * 점수 변동 없을 시 회색 (0) 표시
    * 전체 플레이어 순위 표시 (점수 높은 순)
  - 라이어 키워드 추측 UI (라이어 승리 시)
  - 재시작 버튼 (방 대기실로 이동)

## 기술적 접근 방식 (Technical Approach)

### 아키텍처 설계

#### 백엔드 아키텍처

```
apps/api/src/game/
├── entities/
│   ├── keyword.entity.ts          # 키워드 엔티티
│   └── game-role.enum.ts          # 역할 열거형 (기존)
├── services/
│   ├── role-assignment.service.ts # 역할 배정
│   ├── keyword-selection.service.ts # 키워드 선택
│   ├── turn-manager.service.ts    # 턴 관리
│   ├── voting.service.ts          # 투표 처리
│   ├── result-calculator.service.ts # 결과 집계
│   ├── game-cache.service.ts      # Redis 캐싱
│   └── game-timer.service.ts      # 타이머 관리
├── gateways/
│   └── game.gateway.ts            # 게임 진행 WebSocket
└── game.module.ts                 # 게임 모듈
```

#### 프론트엔드 아키텍처

```
apps/web/src/components/game/
├── GamePlay.tsx                   # 게임 진행 메인
├── RoleReveal.tsx                 # 역할 공개 모달
├── DiscussionPhase.tsx            # 토론 단계
├── VotingPhase.tsx                # 투표 단계
├── ResultPhase.tsx                # 결과 단계
└── GameTimer.tsx                  # 타이머 컴포넌트

apps/web/src/hooks/
├── useGamePlay.ts                 # 게임 진행 훅
├── useGameTimer.ts                # 타이머 훅
└── useVoting.ts                   # 투표 훅
```

### 데이터베이스 설계

#### keywords 테이블 (신규)

```sql
CREATE TABLE keywords (
  id INT PRIMARY KEY AUTO_INCREMENT,
  word VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  difficulty ENUM('EASY', 'NORMAL', 'HARD') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_difficulty (difficulty),
  INDEX idx_category (category)
);
```

#### game_history 테이블 (신규)

```sql
CREATE TABLE game_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_id INT NOT NULL,
  keyword_id INT NOT NULL,
  liar_id INT NOT NULL,
  winner ENUM('LIAR', 'CIVILIAN') NOT NULL,
  most_voted_player_id INT NOT NULL,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP NOT NULL,
  duration INT NOT NULL,           -- 게임 진행 시간 (초)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (keyword_id) REFERENCES keywords(id),
  INDEX idx_room_id (room_id),
  INDEX idx_started_at (started_at)
);
```

#### speeches 테이블 (신규)

```sql
CREATE TABLE speeches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  turn_number INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  INDEX idx_room_id (room_id),
  INDEX idx_created_at (created_at)
);
```

#### votes 테이블 (신규)

```sql
CREATE TABLE votes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_id INT NOT NULL,
  voter_id INT NOT NULL,
  target_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  UNIQUE KEY unique_vote (room_id, voter_id),
  INDEX idx_room_id (room_id)
);
```

### WebSocket 이벤트 설계

#### 서버 → 클라이언트 이벤트

| 이벤트 명                | 페이로드                                   | 설명                  |
| ------------------- | -------------------------------------- | ------------------- |
| `game-started`      | `{ room, phase, turnOrder, keyword }`  | 게임 시작 알림           |
| `role-assigned`     | `{ role, keyword?, category? }`        | 개별 역할 배정 (개별 전송)   |
| `turn-changed`      | `{ currentTurn, nextTurn, remaining }` | 턴 전환 알림            |
| `speech-submitted`  | `{ userId, content, timestamp }`       | 발언 전송              |
| `voting-started`    | `{ duration, players }`                | 투표 시작 알림           |
| `voting-progress`   | `{ votedCount, total, progress }`      | 투표 진행률 업데이트        |
| `game-ended`        | `{ winner, roles, voteResults }`       | 게임 종료 및 결과         |
| `timer-update`      | `{ phase, remainingTime, progress }`   | 타이머 업데이트 (1초마다)    |
| `player-reconnect`  | `{ userId, gameState }`                | 플레이어 재접속 시 상태 복원   |

#### 클라이언트 → 서버 이벤트

| 이벤트 명               | 페이로드                        | 설명            |
| ------------------- | --------------------------- | ------------- |
| `submit-speech`     | `{ content }`               | 발언 제출         |
| `submit-vote`       | `{ targetUserId }`          | 투표 제출         |
| `request-game-state`| `{}`                        | 현재 게임 상태 요청   |

### Redis 캐싱 전략

#### 캐시 키 구조

```
game:state:{roomId}          - 게임 전체 상태
game:roles:{roomId}          - 역할 배정 정보 (암호화)
game:keyword:{roomId}        - 키워드 정보
game:turn:{roomId}           - 현재 턴 정보
game:votes:{roomId}          - 투표 정보
```

#### TTL 설정

- 게임 진행 중: TTL 없음 (게임 종료 시 삭제)
- 게임 종료 후: 1시간 TTL (이력 조회용)

## 리스크 및 대응 방안 (Risks & Mitigation)

### 기술적 리스크

#### 1. WebSocket 연결 불안정
- **리스크**: 네트워크 지연 또는 연결 끊김으로 게임 진행 중단
- **대응 방안**:
  - 5초 재접속 대기 (자동 턴 스킵 전)
  - 재접속 시 게임 상태 복원 (`request-game-state` 이벤트)
  - Redis에 게임 상태 저장하여 복원 지원

#### 2. 타이머 동기화 문제
- **리스크**: 클라이언트와 서버 시간 불일치로 인한 경험 저하
- **대응 방안**:
  - 서버 기준 시간 사용 (클라이언트는 표시만)
  - 1초마다 서버에서 `timer-update` 이벤트 전송
  - 클라이언트는 서버 시간 기준으로 UI 업데이트

#### 3. 투표 집계 오류
- **리스크**: 동시 투표 요청으로 인한 중복 투표 또는 누락
- **대응 방안**:
  - 데이터베이스 UNIQUE 제약 조건 (`room_id, voter_id`)
  - 트랜잭션 사용하여 원자성 보장
  - 투표 완료 여부를 Redis에 캐싱하여 빠른 검증

#### 4. 역할 정보 노출 리스크
- **리스크**: 클라이언트 측 코드 분석으로 역할 정보 유출
- **대응 방안**:
  - 서버에서만 역할 배정 및 관리
  - 개별 전송 (각 플레이어는 자신의 역할만 수신)
  - 역할 정보 암호화 (JWT 또는 AES 암호화)
  - 클라이언트 검증은 참고용, 서버 최종 검증 필수

### 성능 리스크

#### 1. 동시 100개 게임 방 부하
- **리스크**: 동시 접속자 800명 (100방 × 8명) 시 서버 부하
- **대응 방안**:
  - Redis 캐싱으로 데이터베이스 부하 감소
  - WebSocket 메시지 압축 및 배칭
  - 수평 확장 (k3s HPA 활용)

#### 2. 메시지 지연 (P95 > 100ms)
- **리스크**: WebSocket 메시지 지연으로 인한 실시간성 저하
- **대응 방안**:
  - 메시지 압축 활성화 (Socket.IO 기본 기능)
  - 불필요한 메시지 전송 최소화
  - 선택적 전송 (개별 역할 정보는 개인만)
  - 부하 테스트를 통한 성능 검증

## 테스트 전략 (Testing Strategy)

### 단위 테스트 (Unit Tests)

#### 백엔드 서비스 테스트
- **대상**: `role-assignment.service.ts`, `keyword-selection.service.ts`, `voting.service.ts`, `result-calculator.service.ts`
- **도구**: Jest 30.x
- **커버리지 목표**: 90% 이상
- **주요 테스트 케이스**:
  - 역할 배정: 라이어 1명, 나머지 시민 확인
  - 키워드 선택: 난이도별 키워드 선택 확인
  - 투표 집계: 최다 득표자 계산 정확성
  - 결과 계산: 승패 결정 로직 검증

#### 프론트엔드 컴포넌트 테스트
- **대상**: `GamePlay.tsx`, `VotingPhase.tsx`, `ResultPhase.tsx`
- **도구**: Vitest 2.x + React Testing Library
- **주요 테스트 케이스**:
  - 역할 정보 표시 (라이어 vs 시민)
  - 투표 버튼 활성화/비활성화
  - 타이머 표시 및 업데이트

### 통합 테스트 (Integration Tests)

#### WebSocket 이벤트 흐름 테스트
- **도구**: Jest + Socket.IO Client
- **주요 시나리오**:
  1. 게임 시작 → 역할 배정 → 키워드 전송
  2. 토론 단계 → 턴 전환 → 발언 전송
  3. 투표 단계 → 투표 제출 → 결과 집계
  4. 결과 화면 → 역할 공개 → 방 대기실 복귀

#### 데이터베이스 통합 테스트
- **도구**: Jest + TypeORM + MySQL (Docker)
- **주요 시나리오**:
  - 키워드 조회 및 선택
  - 게임 이력 저장 및 조회
  - 투표 기록 저장 및 집계

### 부하 테스트 (Load Tests)

#### 목표
- 동시 100개 게임 방 (총 800명 플레이어)
- WebSocket 메시지 지연 P95 < 100ms
- 서버 CPU 사용률 < 70%
- 서버 메모리 사용률 < 512MB

#### 도구
- K6 (부하 테스트)
- Prometheus + Grafana (모니터링)

#### 시나리오
1. 100개 방 동시 게임 시작
2. 각 방에서 동시 턴 전환 (800명 동시 메시지)
3. 투표 단계 동시 진입 (800명 동시 투표)

### E2E 테스트 (End-to-End Tests)

#### 도구
- Playwright

#### 주요 시나리오
1. **전체 게임 시나리오**:
   - 로그인 → 방 생성 → 플레이어 참여 → 게임 시작 → 토론 → 투표 → 결과 확인
2. **연결 끊김 시나리오**:
   - 게임 중 연결 끊김 → 5초 이내 재접속 → 상태 복원 확인
3. **동시 투표 시나리오**:
   - 8명 동시 투표 → 진행률 실시간 업데이트 → 결과 집계 정확성

## 기술 스택 버전 (Technology Stack)

### 백엔드
- NestJS: `^11.0.10`
- Socket.IO: `^4.8.1`
- TypeORM: `^0.3.20`
- MySQL: `8.0` 이상
- Redis: `^7.0`
- ioredis: `^5.4.1` (Redis 클라이언트)
- jsonwebtoken: `^9.0.2` (역할 암호화)
- bcrypt: `^6.0.0` (비밀번호 해싱)

### 프론트엔드
- React: `^19.2.0`
- Socket.IO Client: `^4.8.1`
- React Router: `^7.9.5`
- Tailwind CSS: `^3.4.18`
- Vite: `^6.0.3`

### 개발 도구
- TypeScript: `^5.7.2`
- Jest: `^30.2.0` (백엔드 테스트)
- Vitest: `^2.1.8` (프론트엔드 테스트)
- Playwright: (E2E 테스트)
- K6: (부하 테스트)

## 구현 체크리스트

### Phase 1: 기본 게임 흐름
- [ ] 키워드 엔티티 및 마이그레이션 생성
- [ ] 역할 배정 서비스 구현
- [ ] 키워드 선택 서비스 구현
- [ ] 게임 시작 WebSocket 이벤트 구현
- [ ] 턴 관리 서비스 구현
- [ ] 발언 시스템 구현
- [ ] 투표 서비스 구현
- [ ] 결과 집계 서비스 구현
- [ ] 게임 종료 및 방 복귀 구현

### Phase 2: 실시간 최적화
- [ ] Redis 캐싱 서비스 구현
- [ ] 타이머 서비스 구현
- [ ] WebSocket 메시지 압축 활성화
- [ ] 메시지 배칭 구현
- [ ] 재접속 로직 구현

### Phase 3: 프론트엔드 UI/UX
- [ ] 게임 진행 메인 화면 구현
- [ ] 역할 공개 모달 구현
- [ ] 토론 단계 UI 구현
- [ ] 투표 단계 UI 구현
- [ ] 결과 화면 UI 구현
- [ ] 타이머 컴포넌트 구현

### 테스트
- [ ] 단위 테스트 작성 (커버리지 90%)
- [ ] 통합 테스트 작성
- [ ] 부하 테스트 실행
- [ ] E2E 테스트 작성

## 완료 기준 (Definition of Done)

1. 모든 Phase 1-3 체크리스트 완료
2. 단위 테스트 커버리지 90% 이상
3. 통합 테스트 통과 (모든 시나리오)
4. 부하 테스트 통과 (P95 < 100ms)
5. E2E 테스트 통과 (전체 게임 시나리오)
6. 코드 리뷰 완료
7. 문서 업데이트 (API 문서, 아키텍처 다이어그램)

## 참고 문서

- SPEC-GAME-001: 게임 핵심 로직 설계
- SPEC-LOBBY-001: 로비 시스템 구현
- Socket.IO 공식 문서: https://socket.io/docs/v4/
- TypeORM 공식 문서: https://typeorm.io/
- Redis 공식 문서: https://redis.io/docs/
