/**
 * Swagger 설정 유틸리티
 * main.ts에서 Swagger 관련 설정을 분리하여 가독성 향상
 */

import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../../app.module';
import { getSwaggerModules, logModuleInfo } from './module.util';
import {
  applyTagsToDocumentBuilder,
  extractTagsFromModules,
  logTagInfo,
} from './swagger-helper.util';

/**
 * 메인 API Swagger 문서 설정
 * @param app - NestFastifyApplication 인스턴스
 */
export function setupMainSwagger(app: NestFastifyApplication): void {
  // 현재 모듈들을 기반으로 Swagger 모듈 설정
  const mainModules = getSwaggerModules({
    rootModule: AppModule,
    excludeModules: [], // 향후 관리자 모듈이 생기면 여기에 추가
  });
  logModuleInfo(mainModules, 'Main API modules');

  // 모듈에서 사용된 태그 자동 추출
  const mainTags = extractTagsFromModules(mainModules);
  logTagInfo(mainTags, 'Main API tags');

  // 기본 태그 추가 (수동으로 정의된 태그)
  const defaultTags = [
    { name: 'Auth', description: '사용자 인증 및 권한 관리' },
    { name: 'Users', description: '사용자 정보 관리' },
    { name: 'Rooms', description: '게임 방 관리' },
    { name: 'Games', description: '게임 진행 관리' },
    { name: 'Health', description: '시스템 상태 모니터링' },
  ];

  // 자동 추출된 태그와 기본 태그 병합
  const allTags = [...mainTags, ...defaultTags].filter((tag, index, self) =>
    index === self.findIndex(t => t.name === tag.name)
  );

  // Main API Swagger documentation
  let mainConfigBuilder = new DocumentBuilder()
    .setTitle('Liar Game API')
    .setDescription('라이어 게임 백엔드 API 문서\n\n## 주요 기능\n- 🔐 소셜 로그인 (Google, GitHub, Discord)\n- 📧 이메일 회원가입/로그인\n- 🎮 게임 방 생성 및 관리\n- 💬 실시간 WebSocket 통신\n- 👥 사용자 인증 및 권한 관리\n\n## API 사용 가이드\n1. **인증**: JWT Bearer 토큰 또는 API Key를 사용하여 인증\n2. **게임 방**: 방 생성, 참가, 나가기 등 방 관리\n3. **실시간 통신**: WebSocket을 통한 실시간 게임 진행')
    .setVersion('1.0.0')
    .setContact('Liar Game Team', '', 'support@liar-game.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT');

  // 모든 태그들을 DocumentBuilder에 추가
  allTags.forEach(tag => {
    mainConfigBuilder.addTag(tag.name, tag.description || '');
  });

  const mainConfig = mainConfigBuilder
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'JWT 토큰을 입력하세요 (Bearer {token})',
        in: 'header',
      },
      'JWT-auth'
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key를 입력하세요 (선택적 인증)',
      },
      'api-key'
    )
    .addServer('http://localhost:4000', 'Development Server')
    .addServer('https://api.liar-game.com', 'Production Server')
    .build();

  const mainDocument = SwaggerModule.createDocument(app, mainConfig, {
    include: mainModules,
    deepScanRoutes: true,
  });

  // 공통 스키마 추가
  if (!mainDocument.components) {
    mainDocument.components = {};
  }
  if (!mainDocument.components.schemas) {
    mainDocument.components.schemas = {};
  }

  mainDocument.components.schemas = {
    ...mainDocument.components.schemas,
    ApiError: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          description: 'HTTP 상태 코드',
        },
        message: {
          type: 'string',
          description: '에러 메시지',
        },
        error: {
          type: 'string',
          description: '에러 타입',
        },
        details: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: '상세 에러 정보',
        },
      },
    },
    ApiResponse: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'API 호출 성공 여부',
        },
        data: {
          description: '응답 데이터',
        },
        message: {
          type: 'string',
          description: '응답 메시지',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: '응답 시간',
        },
      },
    },
  };

  SwaggerModule.setup('api/docs', app, mainDocument, {
    customSiteTitle: 'Liar Game API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .topbar-wrapper img { content: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzYzNjZGMSIvPgo8cGF0aCBkPSJNOCAxNkM4IDEzLjggOS44IDEyIDEyIDEyQzE0LjIgMTIgMTYgMTMuOCAxNiAxNkMxNiAxOC4yIDE0LjIgMjAgMTIgMjBDOS44IDIwIDggMTguMiA4IDE2WiIgZmlsbD0id2hpdGUiLz4KPHA+PC9wPgo8L3N2Zz4='); }
      .swagger-ui .topbar { background-color: #6366F1; }
      .swagger-ui .topbar-wrapper .link { color: white; }
    `,
    swaggerOptions: {
      docExpansion: 'none', // 모든 엔드포인트 접힘
      defaultModelsExpandDepth: -1, // 모델 스키마 숨김
      filter: true, // 검색 필터 활성화
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true, // Try it out 활성화
      operationsSorter: 'method', // HTTP 메소드순 정렬
      tagsSorter: 'alpha', // 태그 알파벳순 정렬
      onComplete: function() {
        console.log("Swagger UI loaded");
      },
    },
  });

  console.log('📖 Main Swagger documentation configured at /api/docs');
}