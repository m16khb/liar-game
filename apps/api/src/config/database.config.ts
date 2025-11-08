import { UserEntity } from '@/user/entities';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const entities = [
  UserEntity,
];

export const databaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'mysql' as const,
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  entities,
  synchronize: configService.get<string>('NODE_ENV') !== 'production',
  logging: configService.get<string>('NODE_ENV') !== 'production',
  timezone: 'Z', // ✅ UTC 타임존 설정 (MySQL timestamp 컬럼에 UTC 저장)
  ssl: false,
  charset: 'utf8mb4',
  extra: {
    // MySQL 8 호환성을 위한 추가 설정
    flags: '+MULTI_STATEMENTS,-FOUND_ROWS',
  },
});

export default databaseConfig;
