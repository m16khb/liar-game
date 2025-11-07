import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { setupAdminSwagger, setupMainSwagger } from './core/utils/swagger-setup.util';
import { QueueDashboardService } from './modules/queue/dashboard/queue-dashboard.service';
import { configureDayjs } from './core/utils/dayjs.config';

// Initialize dayjs with global plugins
configureDayjs();
/**
 * @description
 * 환경변수 값을 마스킹하여 로깅합니다.
 * 값의 절반만 표시하고 나머지는 '...'으로 표기합니다.
 * @param key - 환경변수 키
 * @param value - 환경변수 값
 */
function logMaskedEnv(key: string, value: string | undefined): void {
  if (!value) {
    console.log(`  ${key}: <undefined>`);
    return;
  }

  const halfLength = Math.floor(value.length / 2);
  const maskedValue = value.slice(0, halfLength) + '...';
  console.log(`  ${key}: ${maskedValue} (length: ${value.length})`);
}

/**
 * @description
 * 모든 환경 변수를 마스킹하여 로깅합니다.
 * 애플리케이션 시작 시 설정 확인을 위한 디버깅 정보를 제공합니다.
 * @param configService - NestJS ConfigService 인스턴스
 */
function logEnvironmentVariables(configService: ConfigService): void {
  console.log('');
  console.log('🔍 ================================');
  console.log('🔍 ENVIRONMENT VARIABLES CHECK');
  console.log('🔍 ================================');
  console.log('');

  // Core Settings
  console.log('📌 Core Settings:');
  logMaskedEnv('NODE_ENV', configService.get<string>('NODE_ENV'));
  logMaskedEnv('DEPLOY_ENV', configService.get<string>('DEPLOY_ENV'));
  logMaskedEnv('BACKEND_API_PORT', configService.get<string>('BACKEND_API_PORT'));
  logMaskedEnv('BACKEND_API_HOST', configService.get<string>('BACKEND_API_HOST'));
  console.log('');

  // Database Configuration
  console.log('🗄️  Database Configuration:');
  logMaskedEnv('DB_HOST', configService.get<string>('DB_HOST'));
  logMaskedEnv('DB_PORT', configService.get<string>('DB_PORT'));
  logMaskedEnv('DB_USERNAME', configService.get<string>('DB_USERNAME'));
  logMaskedEnv('DB_PASSWORD', configService.get<string>('DB_PASSWORD'));
  logMaskedEnv('DB_DATABASE', configService.get<string>('DB_DATABASE'));
  console.log('');

  // Redis Configuration
  console.log('📦 Redis Configuration:');
  logMaskedEnv('REDIS_HOST', configService.get<string>('REDIS_HOST'));
  logMaskedEnv('REDIS_PORT', configService.get<string>('REDIS_PORT'));
  logMaskedEnv('REDIS_PASSWORD', configService.get<string>('REDIS_PASSWORD'));
  console.log('');

  // Supabase Configuration
  console.log('🔐 Supabase Configuration:');
  logMaskedEnv('SUPABASE_URL', configService.get<string>('SUPABASE_URL'));
  logMaskedEnv('SUPABASE_ANON_KEY', configService.get<string>('SUPABASE_ANON_KEY'));
  logMaskedEnv('SUPABASE_SERVICE_ROLE_KEY', configService.get<string>('SUPABASE_SERVICE_ROLE_KEY'));
  logMaskedEnv('SUPABASE_JWT_SECRET', configService.get<string>('SUPABASE_JWT_SECRET'));
  logMaskedEnv('SUPABASE_WEBHOOK_SECRET', configService.get<string>('SUPABASE_WEBHOOK_SECRET'));
  console.log('');

  // AI Service Configuration
  console.log('🤖 AI Service Configuration:');
  logMaskedEnv('AI_SERVICE_URL', configService.get<string>('AI_SERVICE_URL'));
  logMaskedEnv('AI_SERVICE_TIMEOUT', configService.get<string>('AI_SERVICE_TIMEOUT'));
  console.log('');

  // Email Configuration
  console.log('📧 Email Configuration:');
  logMaskedEnv('SMTP_HOST', configService.get<string>('SMTP_HOST'));
  logMaskedEnv('SMTP_PORT', configService.get<string>('SMTP_PORT'));
  logMaskedEnv('SMTP_USER', configService.get<string>('SMTP_USER'));
  logMaskedEnv('SMTP_PASSWORD', configService.get<string>('SMTP_PASSWORD'));
  logMaskedEnv('SMTP_FROM', configService.get<string>('SMTP_FROM'));
  console.log('');

  // CORS Configuration
  console.log('🌐 CORS Configuration:');
  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  logMaskedEnv('CORS_ORIGINS', corsOrigins);
  console.log('');

  // API Keys Configuration
  console.log('🔑 API Keys Configuration:');
  logMaskedEnv('BACKEND_API_KEYS', configService.get<string>('BACKEND_API_KEYS'));
  console.log('');

  // Binance Configuration
  console.log('💱 Binance Configuration:');
  logMaskedEnv('BINANCE_API_KEY', configService.get<string>('BINANCE_API_KEY'));
  logMaskedEnv('BINANCE_API_SECRET', configService.get<string>('BINANCE_API_SECRET'));
  console.log('');

  console.log('🔍 ================================');
  console.log('');
}

/**
 * @description
 * 애플리케이션을 부트스트랩합니다.
 * NestFastifyApplication을 생성하고 반환합니다.
 */
async function bootstrap(): Promise<void> {
  const app: NestFastifyApplication = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      connectionTimeout: 300000, // 300 seconds (CSV upload support)
      requestTimeout: 300000, // 300 seconds
    })
  );

  // CORS configuration
  const configService = app.get(ConfigService);

  // Environment Variables Logging
  logEnvironmentVariables(configService);

  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  const origins = corsOrigins
    ? corsOrigins.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  console.log('✅ CORS Origins (parsed):', origins);

  await app.register(require('@fastify/cors'), {
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-API-Key'],
    credentials: true,
  });

  // Security headers
  await app.register(require('@fastify/helmet'), {
    contentSecurityPolicy: false, // Disable for development
  });

  // Compression
  await app.register(require('@fastify/compress'), {
    encodings: ['gzip', 'deflate'],
  });

  // File upload support (multipart/form-data)
  await app.register(require('@fastify/multipart'), {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max file size
      files: 1, // Single file upload
    },
  });

  // Static files for Swagger custom JS
  const path = require('path');

  // NODE_ENV에 따라 public 디렉토리 경로 결정
  // - 로컬 개발(npm run start:dev): src/main.ts 실행 → src/../public
  // - PM2 환경(dev/stg/prod): dist/main.js 실행 → dist/public (빌드 시 복사)
  const publicPath =
    process.env.NODE_ENV === 'local'
      ? path.join(__dirname, '..', 'public')
      : path.join(__dirname, 'public');

  await app.register(require('@fastify/static'), {
    root: publicPath,
    prefix: '/',
  });

  // Global API prefix
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  // 실시간 업데이트가 필요한 경로에 대한 캐시 방지 헤더 추가
  const fastifyInstance = app.getHttpAdapter().getInstance();
  fastifyInstance.addHook('onRequest', async (request, reply) => {
    const path = request.url;

    // Swagger 문서 및 실시간 대시보드 경로 체크
    if (
      path.startsWith('/api/docs') ||
      path.startsWith('/api/admin/docs') ||
      path === '/api/docs-json' ||
      path === '/api/admin/docs-json' ||
      path.startsWith('/api/admin/queues') // Bull Board 큐 대시보드
    ) {
      reply.header(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
      );
      reply.header('Pragma', 'no-cache');
      reply.header('Expires', '0');
      reply.header('Surrogate-Control', 'no-store');
      reply.header('X-Accel-Expires', '0');
    }
  });

  // Main API Swagger 문서 설정
  setupMainSwagger(app);

  // Admin API Swagger 문서 설정
  setupAdminSwagger(app);

  // Setup Bull Board dashboard
  try {
    const queueDashboardService = app.get(QueueDashboardService);
    const serverAdapter = queueDashboardService.getServerAdapter();
    await app.register(serverAdapter.registerPlugin() as any, {
      prefix: '/api/admin/queues',
    });
  } catch (error: any) {
    console.warn('⚠️ Failed to setup queue dashboard:', error?.message || error);
  }

  const port = configService.get<number>('BACKEND_API_PORT') || 3001;
  const host = configService.get<string>('BACKEND_API_HOST') || '0.0.0.0';

  await app.listen(port, host);

  console.log('');
  console.log('🚀 ================================');
  console.log('🚀 CANDLE API STARTED');
  console.log('🚀 ================================');
  console.log('');
  console.log(`📡 Server: http://${host}:${port}`);
  console.log(`📖 API Docs: http://${host}:${port}/api/docs`);
  console.log(`🔧 Admin API Docs: http://${host}:${port}/api/admin/docs`);
  console.log(`🎯 Queue Dashboard: http://${host}:${port}/api/admin/queues`);
  console.log(`⚡ Platform: Fastify (High Performance)`);
  console.log('Ready to serve candle data! 🚀');
  console.log('================================');
  console.log('');
}

bootstrap();
