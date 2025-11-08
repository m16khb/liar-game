import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// .env 파일 명시적 로드
dotenv.config();

function getDBName(env: string | undefined): string {
  console.log('🔍 [ormconfig] NODE_ENV:', env);
  console.log('🔍 [ormconfig] process.env.NODE_ENV:', process.env.NODE_ENV);
  console.log('🔍 [ormconfig] process.env.DB_NAME:', process.env.DB_NAME);

  if (!env || env === 'local') {
    console.log('✅ [ormconfig] Using candle_local');
    return 'candle_local';
  } else {
    console.log(`⚠️ [ormconfig] Using candle_${env}`);
    return `candle_${env}`;
  }
}

const dbName = process.env.DB_NAME || getDBName(process.env.NODE_ENV);
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
  synchronize: false,
  logging: process.env.NODE_ENV !== 'prod',
});

export default AppDataSource;
