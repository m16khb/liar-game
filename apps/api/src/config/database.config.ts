// TypeORM 데이터베이스 설정
// MySQL v8 LTS 연결을 위한 설정

import { TypeOrmModuleOptions } from '@nestjs/typeorm'

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT!) || 3306,
  username: process.env.DB_USERNAME || 'liaruser',
  password: process.env.DB_PASSWORD || 'userpassword123',
  database: process.env.DB_NAME || 'liardb',

  // MySQL2 드라이버 명시
  connectorPackage: 'mysql2',

  // 문자셋 설정
  charset: 'utf8mb4',

  // 연결 풀 설정
  extra: {
    connectionLimit: 10,
  },

  // 엔티티 파일들 자동 로드
  entities: [__dirname + '/**/*.entity{.ts,.js}'],

  // 마이그레이션 파일들
  migrations: [__dirname + '/migrations/*.ts'],

  // 개발 환경에서는 스키마 자동 동기화
  synchronize: process.env.NODE_ENV === 'development',

  // SQL 로그 표시
  logging: process.env.NODE_ENV === 'development',

  // 타임존 설정 (UTC 기준)
  timezone: '+00:00',
}