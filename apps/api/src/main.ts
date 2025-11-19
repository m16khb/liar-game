import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { configureDayjs } from './common/utils/dayjs.config';
import { setupMainSwagger, setupAdminSwagger } from './common/utils/swagger-setup.util';

configureDayjs();

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
      connectionTimeout: 30000, // 30 seconds
      requestTimeout: 30000, // 30 seconds
    })
  );

  // CORS configuration
  const configService = app.get(ConfigService);

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

  // Global security exception filter
  const logger = new Logger('Bootstrap');

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
    // const queueDashboardService = app.get(QueueDashboardService);
    // const serverAdapter = queueDashboardService.getServerAdapter();
    // await app.register(serverAdapter.registerPlugin() as any, {
    //   prefix: '/api/admin/queues',
    // });
  } catch (error: any) {
    console.warn('⚠️ Failed to setup queue dashboard:', error?.message || error);
  }

  const port = configService.get<number>('API_PORT') || 4000;
  const host = configService.get<string>('API_HOST') || '0.0.0.0';

  await app.listen(port, host);

  console.log('');
  console.log('🚀 ================================');
  console.log('🚀 API STARTED');
  console.log('🚀 ================================');
  console.log('');
  console.log(`📡 Server: http://${host}:${port}`);
  console.log(`📖 API Docs: http://${host}:${port}/api/docs`);
  console.log(`🔧 Admin API Docs: http://${host}:${port}/api/admin/docs`);
  console.log(`🎯 Queue Dashboard: http://${host}:${port}/api/admin/queues`);
  console.log(`⚡ Platform: Fastify (High Performance)`);
  console.log('Ready to serve data! 🚀');
  console.log('================================');
  console.log('');
}

bootstrap();
