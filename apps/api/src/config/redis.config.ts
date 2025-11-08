import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: 0, // Default database for cache
  queueDb: 1, // Separate database for queues
  retryAttempts: 5, // 재시도 횟수 증가
  retryDelay: 2000, // 재시도 간격 증가
  maxRetriesPerRequest: null, // Required for BullMQ compatibility
  lazyConnect: false, // 즉시 연결 시도
  keepAlive: 60000, // Keep-Alive 시간 증가
  family: 4, // IPv4
  keyPrefix: 'candle:',
  connectTimeout: 20000, // 연결 타임아웃 증가
  commandTimeout: 10000, // 명령 타임아웃 증가
  // BullMQ-specific options
  queue: {
    maxRetriesPerRequest: null, // BullMQ requires this to be null
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
  },
}));
