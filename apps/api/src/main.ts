// @CODE:SETUP-001 | SPEC: .moai/specs/SPEC-SETUP-001/spec.md
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true })
  );

  // CORS 설정 (Next.js 프론트엔드 허용)
  await app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(4000, '0.0.0.0');
  console.log(`🚀 API Server running on http://localhost:4000`);
}

bootstrap();
