---
name: typeorm-migration-generator
description: TypeORM으로 안전한 데이터베이스 스키마 마이그레이션 생성. Entity 구조 수정, 새 테이블 추가, 컬럼 타입 변경, liar-game 프로젝트 데이터베이스 스키마 진화 관리 시 사용합니다.
---

# TypeORM 마이그레이션 생성기

## 지침

MySQL v8용 안전하고 롤백 가능한 데이터베이스 마이그레이션 생성:

1. **Entity 변경 분석**: 필요한 스키마 수정 사항 이해
2. **안전한 마이그레이션 전략 설계**: 데이터 손실 방지
3. **up() 및 down() 메서드 포함 완전한 마이그레이션 파일 생성**
4. **대용량 테이블의 성능 영향** 고려
5. **모든 변경에 대한 적절한 롤백 절차** 확보

## 예시

### 새 테이블 생성
```typescript
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateGameSessionsTable1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'game_sessions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'room_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['WAITING', 'PLAYING', 'FINISHED'],
            default: `'WAITING'`,
          },
          {
            name: 'started_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 성능을 위한 인덱스 추가
    await queryRunner.createIndex(
      'game_sessions',
      new Index('IDX_game_sessions_room_id', ['room_id']),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 먼저 인덱스 삭제
    await queryRunner.dropIndex('game_sessions', 'IDX_game_sessions_room_id');

    // 그 다음 테이블 삭제
    await queryRunner.dropTable('game_sessions');
  }
}
```

### 안전한 컬럼 타입 변경
```typescript
export class UpdateRoomCodeLength1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1단계: 새 컬럼 추가
    await queryRunner.query(`
      ALTER TABLE game_rooms
      ADD COLUMN room_code_new VARCHAR(10) NULL
    `);

    // 2단계: 데이터 마이그레이션
    await queryRunner.query(`
      UPDATE game_rooms
      SET room_code_new = room_code
    `);

    // 3단계: 기존 컬럼 삭제
    await queryRunner.query(`
      ALTER TABLE game_rooms
      DROP COLUMN room_code
    `);

    // 4단계: 새 컬럼 이름 변경
    await queryRunner.query(`
      ALTER TABLE game_rooms
      CHANGE COLUMN room_code_new room_code VARCHAR(10) NOT NULL
    `);

    // 5단계: 고유 인덱스 재생성
    await queryRunner.query(`
      CREATE UNIQUE INDEX IDX_game_rooms_room_code
      ON game_rooms(room_code)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 모든 단계를 역순으로 되돌리기
    await queryRunner.query(`DROP INDEX IDX_game_rooms_room_code ON game_rooms`);

    await queryRunner.query(`
      ALTER TABLE game_rooms
      CHANGE COLUMN room_code room_code_new VARCHAR(10) NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE game_rooms
      ADD COLUMN room_code VARCHAR(6) NULL
    `);

    await queryRunner.query(`
      UPDATE game_rooms
      SET room_code = LEFT(room_code_new, 6)
    `);

    await queryRunner.query(`
      ALTER TABLE game_rooms
      DROP COLUMN room_code_new
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IDX_game_rooms_room_code
      ON game_rooms(room_code)
    `);
  }
}
```

### 데이터가 포함된 컬럼 추가
```typescript
export class AddDescriptionToGameRooms1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 먼저 nullable 컬럼 추가
    await queryRunner.query(`
      ALTER TABLE game_rooms
      ADD COLUMN description TEXT NULL
    `);

    // 선택적으로 기본 데이터로 채우기
    await queryRunner.query(`
      UPDATE game_rooms
      SET description = '게임에 오신 것을 환영합니다!'
      WHERE description IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE game_rooms
      DROP COLUMN description
    `);
  }
}
```

## 핵심 패턴

- **항상 down() 메서드 포함**: 모든 변경은 되돌릴 수 있어야 함
- **복잡한 변경 분리**: 위험한 작업을 여러 단계로 나누기
- **외래 키 고려**: 관계를 신중하게 처리 (이 프로젝트에서는 FK 제약조건 없음)
- **대용량 데이터셋으로 테스트**: 프로덕션 데이터의 성능 영향 고려
- **트랜잭션 사용**: 여러 작업을 트랜잭션으로 래핑
- **검증 추가**: 마이그레이션 후 데이터 무결성 검증
- **프로세스 문서화**: 복잡한 마이그레이션 설명하는 주석 포함