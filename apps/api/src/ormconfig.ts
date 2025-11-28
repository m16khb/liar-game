import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env 파일 명시적 로드 (프로젝트 루트에서 로드)
const envPath = path.resolve(__dirname, '../../..', '.env');
dotenv.config({ path: envPath });

// DB_NAME 환경 변수 직접 사용 (기본값: liar_game_db)
const dbName = process.env.DB_NAME || 'liar_game_db';
console.log('🎯 [ormconfig] Final database name:', dbName);
console.log('🎯 [ormconfig] Connection details:', {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '3306',
  username: process.env.DB_USERNAME || 'candle_user',
  database: dbName,
});

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'candle_user',
  password: process.env.DB_PASSWORD || 'mysql123',
  database: dbName,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  subscribers: ['dist/subscribers/*.js'],
  migrationsTableName: 'migrations',
  synchronize: true,
  logging: process.env.NODE_ENV !== 'prod',
});

export default AppDataSource;
