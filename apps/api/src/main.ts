// @CODE:SETUP-001 | SPEC: .moai/specs/SPEC-SETUP-001/spec.md
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  const configService = app.get(ConfigService);
  const crossOrigins = configService.get('CROSS_ORIGINS').split(',');

  await app.register(require('@fastify/cors'), {
    origin: [
      'http://localhost:3000',
      'http://localhost:8080',
      ...crossOrigins,
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Helmet (보안 헤더) - Swagger와 충돌하지 않도록 설정
  await app.register(require('@fastify/helmet'), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`, 'cdn.jsdelivr.net'],
        scriptSrc: [`'self'`, `'unsafe-inline'`, 'cdn.jsdelivr.net'],
        imgSrc: [`'self'`, 'data:', 'cdn.jsdelivr.net'],
      },
    },
  });

  // 글로벌 API 프리픽스 설정 (/api)
  app.setGlobalPrefix('api');

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('LIAR GAME API')
    .setDescription('LIAR GAME API 문서')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'MAFIA.AI API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  // 서버 시작

  await app.listen(4000, '0.0.0.0');
  console.log(`🚀 API Server running on http://localhost:4000`);
  console.log(`📚 Swagger docs at http://localhost:4000/api/docs`);
}

bootstrap();
