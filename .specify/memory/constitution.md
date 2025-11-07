<!--
Sync Impact Report:
Version: 1.4.0 → 1.5.0 (minor - TypeORM migration principle added)
Modified Principles: N/A
Added Sections: XI. TypeORM 마이그레이션 관리 원칙
Removed Sections: N/A
Templates Updated: ✅ plan-template.md, ✅ tasks-template.md
Follow-up TODOs: N/A
-->

# 라이어 게임 프로젝트 헌법

## 핵심 원칙

### I. 한국어 우선 원칙
프로젝트의 모든 문서, 소통, 코드 주석은 한국어로 작성합니다. 기술 용어는 번역이 어색한 경우 영어 그대로 사용하며, 변수명/함수명/클래스명은 영어로 작성합니다.

### II. 현대 기술 스택 원칙
프론트엔드는 React 18 + React Compiler 기반으로 구성하며, 최신 스택 중 많이 사용되고 각광받는 기술을 적절히 선택하여 사용합니다. 백엔드는 NestJS 11 + Fastify로 구성하며, 추가 종속성이 필요할 경우 개발자와 협의하여 결정합니다.

### III. 시간대 표준화 원칙
백엔드의 모든 시간 관련 처리는 UTC(협정 세계시)를 기준으로 진행합니다. 프론트엔드는 응답받은 UTC 시간을 KST(한국 표준시)로 변환하여 사용자에게 표시하며, 시간 처리는 dayjs 라이브러리를 통일하여 사용합니다.

### IV. 인프라 현대화 원칙
MySQL v8 LTS 버전을 주 데이터베이스로 사용하며, Redis v8 LTS 버전을 캐싱 및 세션 관리에 사용합니다. Nginx 최신 LTS 버전으로 리버스 프록시를 구성하며, 컨테이너 오케스트레이션은 Kubernetes(k8s)를 사용합니다. Promtail + Loki + Grafana 최신 LTS 스택으로 로깅 대시보드를 구축합니다.

### V. 실시간 게임 서버 원칙
웹 기반 라이어 게임은 실시간 멀티플레이어 추리 게임으로, 6명의 플레이어가 참여하며 한 명의 Liar를 제외한 모든 플레이어가 제시어를 받고 토론을 통해 Liar를 찾아내거나 Liar가 제시어를 추리하여 승리하는 게임 로직을 구현합니다.

### VI. Supabase 인증 원칙
인증은 Supabase Auth를 중심으로 구현하며, OAuth 소셜 로그인(Google, GitHub, Discord)과 Email/Password 로그인을 모두 지원합니다. PKCE flow로 보안을 강화하며, 간단하고 직관적인 인증 흐름을 제공합니다.

### VII. 최소 구현 원칙
명시적으로 요구된 기능만 구현하며, 과도한 엔지니어링이나 불필요한 추상화를 지양합니다. YAGNI(You Aren't Gonna Need It) 원칙을 따르며, 현재 요구사항에 명확한 가치를 제공하지 않는 코드는 작성하지 않습니다. 모든 구현은 비즈니스 요구사항과 직접적인 연관성이 있어야 합니다.

### VIII. SOLID 원칙 준수
코드는 SOLID 원칙을 엄격히 준수해야 합니다:
- **Single Responsibility**: 각 클래스/함수는 단 하나의 책임만 가집니다
- **Open/Closed**: 확장에는 열려있고, 수정에는 닫혀있어야 합니다
- **Liskov Substitution**: 자식 클래스는 부모 클래스를 완전히 대체할 수 있어야 합니다
- **Interface Segregation**: 클라이언트는 사용하지 않는 인터페이스에 의존하지 않습니다
- **Dependency Inversion**: 상위 모듈은 하위 모듈이 아닌 추상화에 의존합니다

### IX. 코드 품질 및 주석 원칙
효율적이고 이해하기 쉬운 코드를 작성하며, 핵심 비즈니스 로직과 복잡한 알고리즘에는 상세한 한글 주석을 작성합니다:
- **핵심 주석 대상**: 비즈니스 로직, 복잡한 알고리즘, 성능 최적화 부분
- **주석 작성 기준**: '왜(Why)'와 '어떻게(How)'를 명확히 설명
- **LOC 고려**: 코드의 간결성을 유지하며, 불필요한 주석은 지양
- **가독성**: 다른 개발자가 쉽게 이해할 수 있도록 명확한 표현 사용

### X. TypeORM 외키 제약 조건 원칙
데이터베이스 설계 시 외키 관계는 개념적으로만 존재하며, 실제 데이터베이스 스키마에는 외키 제약 조건을 생성하지 않습니다:
- **개념적 관계**: Entity 간의 관계는 TypeORM 데코레이터로 명확하게 정의
- **물리적 제약**: 실제 데이터베이스에는 FOREIGN KEY 제약 조건을 생성하지 않음
- **설정 방법**: TypeORM @JoinColumn, @RelationId 등을 사용하되 createForeignKeyConstraints: false로 설정
- **무결성 보장**: 애플리케이션 레벨에서 참조 무결성을 보장하며, 필요시 트랜잭션으로 데이터 일관성 유지
- **성능 최적화**: 불필요한 데이터베이스 locking과 제약 조건 검사를 피하여 성능 향상

### XI. TypeORM 마이그레이션 관리 원칙
모든 데이터베이스 스키마 변경은 TypeORM의 공식 마이그레이션 기능을 통해 생성하고 적용해야 합니다:
- **마이그레이션 생성**: TypeORM CLI를 사용한 마이그레이션 파일 생성이 의무사항
- **비상 상황 대응**: 긴급 상황에서도 TypeORM 마이그레이션 파일은 반드시 생성해야 함
- **순차 적용**: 마이그레이션은 생성된 순서대로 누락 없이 적용해야 함
- **롤백 지원**: 모든 마이그레이션은 롤백이 가능하도록 down 메서드 구현이 필수
- **네이밍 규칙**: 마이그레이션 파일은 `MigrationYYYYMMDDHHMMSS_descriptive_name.ts` 형식으로 명명
- **테스트 검증**: 개발 환경에서 마이그레이션 적용/롤백 테스트 후 프로덕션 적용

## 기술 표준

### 프론트엔드 기술 스택
- **프레임워크**: React 18 + React Compiler
- **번들러**: Vite
- **런타임**: Node.js 25.1.0
- **상태 관리**: React Context API 또는 Zustand
- **스타일링**: CSS Modules 또는 Tailwind CSS
- **빌드 도구**: Turborepo

### 백엔드 기술 스택
- **프레임워크**: NestJS 11.x + Fastify
- **실시간 통신**: Socket.IO
- **데이터베이스**: MySQL v8 LTS (영구 저장)
- **캐싱**: Redis v8 LTS (세션 관리, 캐싱)
- **인증**: Supabase Auth (OAuth 소셜 로그인 + Email 로그인)
- **오케스트레이션**: Kubernetes
- **ORM**: TypeORM (외키 제약 조건 없이 개념적 관계만 정의)

### 개발 도구
- **패키지 매니저**: pnpm 10.x
- **모노레포**: Turborepo 2.x
- **테스트**: Jest (백엔드), Vitest (프론트엔드)
- **코드 품질**: ESLint, Prettier, TypeScript
- **로깅**: Promtail + Loki + Grafana

### TypeORM 외키 설정 가이드

#### Entity 관계 정의 예시
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // 개념적 관계만 정의, 실제 FK 제약 조건은 생성하지 않음
  @OneToMany(() => Game, game => game.user, { cascade: true })
  games: Game[];
}

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  status: string;

  // 외키 제약 조건 없이 관계만 정의
  @ManyToOne(() => User, user => user.games, {
    createForeignKeyConstraints: false,  // FK 제약 조건 생성 안 함
  })
  @JoinColumn({ name: 'user_id' })  // 컬럼은 생성하지만 FK는 아님
  user: User;

  @RelationId((game: Game) => game.user)
  @Column({ name: 'user_id' })
  userId: number;  // 실제 외키 값은 앱 레벨에서 관리
}
```

#### 참조 무결성 보장 방법
- **트랜잭션 사용**: 데이터 수정 시 관련된 모든 변경을 하나의 트랜잭션에서 처리
- **앱 레벨 검증**: 데이터 저장 전 참조 무결성 확인 로직 구현
- **소프트 삭제**: 물리적 삭제 대신 논리적 삭제로 관계 유지

#### TypeORM 마이그레이션 관리 가이드
```typescript
// 마이그레이션 생성 명령어
// npx typeorm migration:generate src/migrations/MigrationYYYYMMDDHHMMSS_create_users_table

// 마이그레이션 파일 예시
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class Migration20250101000000CreateUsersTable1640995200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

**마이그레이션 적용 방법**:
- **개발 환경**: `pnpm migration:run`
- **롤백**: `pnpm migration:revert`
- **상태 확인**: `pnpm migration:show`
- **비상 상황**: 수동으로 스키마를 변경하더라도 반드시 마이그레이션 파일은 별도로 생성

## 인증 시스템 아키텍처

### 지원 인증 방식
- **OAuth 소셜 로그인**: Google, GitHub, Discord OAuth 2.0
- **Email 로그인**: 비밀번호 기반 전통 인증
- **Anonymous 인증**: 게스트 플레이 지원 (선택적)

### 보안 강화
- **PKCE flow**: OAuth 인증 시 중간자 공격 방어
- **자동 토큰 갱신**: Supabase SDK 자동 리프레시
- **JWT 토큰**: Supabase 발급/관리

## 개발 워크플로우

### 코드 품질 기준
- **파일 크기**: 300 LOC 이하 (단일 책임 원칙 준수)
- **함수 크기**: 50 LOC 이하 (단일 기능 수행)
- **매개변수**: 5개 이하 (인터페이스 분리 원칙)
- **복잡도**: 10 이하 (제어 흐름 단순화)
- **테스트 커버리지**: 85% 이상 (핵심 로직 집중)
- **의존성**: 최소화하고 인터페이스 기반으로 설계
- **중복**: DRY 원칙 준수, 공통 로직은 재사용

### 시간 처리 표준
- 백엔드: 모든 TZ은 UTC로 처리
- 프론트엔드: 응답 받은 UTC 시간을 KST로 변환 표시
- 라이브러리: dayjs 사용
- 데이터베이스: TIMESTAMP WITH TIME ZONE 사용

### 배포 및 운영
- 컨테이너화: Docker + Kubernetes
- 리버스 프록시: Nginx LTS
- 로깅: Promtail + Loki + Grafana 스택
- 모니터링: 실시간 게임 상태 및 성능 지표

## 거버넌스

### 헌법 우선 원칙
이 헌법은 다른 모든 개발 관행보다 우선 적용됩니다. 모든 코드 리뷰, 기능 개발, 아키텍처 결정은 헌법 원칙을 준수해야 합니다.

### 개정 절차
헌법 개정은 다음 절차를 따릅니다:
1. 개정 필요성 제안
2. 팀 논의 및 합의
3. 문서화 및 버전 업데이트
4. 적용 계획 수립 및 실행

### 버전 관리
헌법 버전은 시맨틱 버전닝을 따릅니다:
- MAJOR: 하위 호환되지 않는 원칙 변경
- MINOR: 새로운 원칙 추가 또는 기존 원칙 확장
- PATCH: 문구 수정, 오타 수정, 명확화 개선

### 준수 검토
모든 Pull Request는 헌법 준수 여부를 검토받아야 하며, 복잡성이 증가하는 변경 사항은 정당성이 명확하게 제시되어야 합니다.

**버전**: 1.5.0 | **제정일**: 2025-11-07 | **최종 수정일**: 2025-11-07