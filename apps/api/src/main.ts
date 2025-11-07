// NestJS 11 + Fastify 애플리케이션 진입점
// 한국어 주석으로 비즈니스 로직 설명

import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { setupMainSwagger } from './core/utils/swagger-setup.util'
import { AppModule } from './app.module'
import { GlobalExceptionFilter } from './common/filters/global-exception.filter'

/**
 * 환경변수 값을 마스킹하여 로깅합니다.
 * 값의 절반만 표시하고 나머지는 '...'으로 표기합니다.
 * @param key - 환경변수 키
 * @param value - 환경변수 값
 */
function logMaskedEnv(key: string, value: string | undefined): void {
  if (!value) {
    console.log(`  ${key}: <undefined>`)
    return
  }

  const halfLength = Math.floor(value.length / 2)
  const maskedValue = value.slice(0, halfLength) + '...'
  console.log(`  ${key}: ${maskedValue} (length: ${value.length})`)
}

/**
 * 모든 환경 변수를 마스킹하여 로깅합니다.
 * 애플리케이션 시작 시 설정 확인을 위한 디버깅 정보를 제공합니다.
 * @param configService - NestJS ConfigService 인스턴스
 */
function logEnvironmentVariables(configService: ConfigService): void {
  console.log('')
  console.log('🔍 ================================')
  console.log('🔍 ENVIRONMENT VARIABLES CHECK')
  console.log('🔍 ================================')
  console.log('')

  // Core Settings
  console.log('📌 Core Settings:')
  logMaskedEnv('NODE_ENV', configService.get<string>('NODE_ENV'))
  logMaskedEnv('PORT', configService.get<string>('PORT'))
  console.log('')

  // Database Configuration
  console.log('🗄️  Database Configuration:')
  logMaskedEnv('DB_HOST', configService.get<string>('DB_HOST'))
  logMaskedEnv('DB_PORT', configService.get<string>('DB_PORT'))
  logMaskedEnv('DB_USERNAME', configService.get<string>('DB_USERNAME'))
  logMaskedEnv('DB_PASSWORD', configService.get<string>('DB_PASSWORD'))
  logMaskedEnv('DB_NAME', configService.get<string>('DB_NAME'))
  console.log('')

  // Redis Configuration
  console.log('📦 Redis Configuration:')
  logMaskedEnv('REDIS_URL', configService.get<string>('REDIS_URL'))
  logMaskedEnv('REDIS_PASSWORD', configService.get<string>('REDIS_PASSWORD'))
  console.log('')

  // Supabase Configuration
  console.log('🔐 Supabase Configuration:')
  logMaskedEnv('SUPABASE_URL', configService.get<string>('SUPABASE_URL'))
  logMaskedEnv('SUPABASE_ANON_KEY', configService.get<string>('SUPABASE_ANON_KEY'))
  logMaskedEnv('SUPABASE_SERVICE_ROLE_KEY', configService.get<string>('SUPABASE_SERVICE_ROLE_KEY'))
  console.log('')

  // JWT Configuration
  console.log('🔑 JWT Configuration:')
  logMaskedEnv('JWT_SECRET', configService.get<string>('JWT_SECRET'))
  console.log('')

  console.log('🔍 ================================')
  console.log('')
}

/**
 * NestJS 애플리케이션 부트스트랩 함수
 * Fastify + Swagger 최종 설정
 */
async function bootstrap(): Promise<void> {
  const app: NestFastifyApplication = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true, // 개발 환경에서 로깅 활성화
      connectionTimeout: 30000, // 30 seconds
      requestTimeout: 30000, // 30 seconds
    })
  )

  const configService = app.get(ConfigService)

  // 환경 변수 로깅
  logEnvironmentVariables(configService)

  // CORS 설정
  const corsOrigins = configService.get<string>('CORS_ORIGINS')
  const origins = corsOrigins
    ? corsOrigins.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000']

  console.log('✅ CORS Origins (parsed):', origins)

  await app.register(require('@fastify/cors'), {
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
  })

  // Security headers (개발 환경에서는 CSP 비활성화)
  await app.register(require('@fastify/helmet'), {
    contentSecurityPolicy: false,
  })

  // Compression
  await app.register(require('@fastify/compress'), {
    encodings: ['gzip', 'deflate'],
  })

  // File upload support (multipart/form-data)
  await app.register(require('@fastify/multipart'), {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
      files: 1,
    },
  })

  // Global API prefix
  app.setGlobalPrefix('api')

  // 전역 유효성 검증 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 정의된 속성만 허용
      forbidNonWhitelisted: true, // 정의되지 않은 속성 거부
      transform: true, // 자동 타입 변환
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  )

  // 글로벌 예외 필터 설정
  app.useGlobalFilters(new GlobalExceptionFilter())

  // 실시간 업데이트가 필요한 경로에 대한 캐시 방지 헤더 추가
  const fastifyInstance = app.getHttpAdapter().getInstance()
  fastifyInstance.addHook('onRequest', async (request, reply) => {
    const path = request.url

    // Swagger 문서 경로 체크
    if (
      path.startsWith('/api/docs') ||
      path === '/api/docs-json'
    ) {
      reply.header(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
      )
      reply.header('Pragma', 'no-cache')
      reply.header('Expires', '0')
      reply.header('Surrogate-Control', 'no-store')
    }
  })

  // Swagger 문서 설정
  setupMainSwagger(app)

  const port = configService.get<number>('API_PORT') || 4000
  const host = configService.get<string>('API_HOST') || '0.0.0.0'

  await app.listen(port, host)

  console.log('')
  console.log('🚀 ================================')
  console.log('🚀 LIAR GAME API STARTED')
  console.log('🚀 ================================')
  console.log('')
  console.log(`📡 Server: http://${host}:${port}`)
  console.log(`📖 API Docs: http://localhost:${port}/api/docs`)
  console.log(`⚡ Platform: Fastify (High Performance)`)
  console.log('🎮 Ready to serve Liar Game! 🎭')
  console.log('================================')
  console.log('')
}

bootstrap()
