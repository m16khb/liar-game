/**
 * Swagger 설정 유틸리티
 * main.ts에서 Swagger 관련 설정을 분리하여 가독성 향상
 */

import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../../app.module';
import { AdminModule } from '@/admin/admin.module';
import { getSwaggerModules, logModuleInfo } from './module.util';
import { extractTagsFromModules, logTagInfo, applyTagsToDocumentBuilder } from './swagger-helper.util';

/**
 * 메인 API Swagger 문서 설정
 * @param app - NestFastifyApplication 인스턴스
 */
export function setupMainSwagger(app: NestFastifyApplication): void {
  // 자동으로 AdminModule을 제외한 모든 모듈을 포함
  const mainModules = getSwaggerModules({
    rootModule: AppModule,
    excludeModules: [AdminModule],
  });
  logModuleInfo(mainModules, 'Main API modules');

  // 모듈에서 사용된 태그 자동 추출
  const mainTags = extractTagsFromModules(mainModules);
  logTagInfo(mainTags, 'Main API tags');

  // Main API Swagger documentation (excludes admin modules)
  let mainConfigBuilder = new DocumentBuilder()
    .setTitle('Next Candle API')
    .setDescription('일반 사용자를 위한 Next Candle 서비스')
    .setVersion('1.0');

  // 자동 추출된 태그들을 DocumentBuilder에 추가
  mainConfigBuilder = applyTagsToDocumentBuilder(mainConfigBuilder, mainTags);

  const mainConfig = mainConfigBuilder
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT 토큰을 입력하세요',
        in: 'header',
      },
      'JWT-auth'
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key를 입력하세요 (Path API 전용)',
      },
      'api-key'
    )
    .build();

  const mainDocument = SwaggerModule.createDocument(app, mainConfig, {
    include: mainModules,
    deepScanRoutes: true,
  });

  // Filter out admin paths from main documentation
  const filteredPaths: any = {};
  for (const [path, pathItem] of Object.entries(mainDocument.paths || {})) {
    // Exclude paths starting with /api/admin
    if (!path.startsWith('/api/admin')) {
      filteredPaths[path] = pathItem;
    }
  }
  mainDocument.paths = filteredPaths;

  SwaggerModule.setup('api/docs', app, mainDocument, {
    customSiteTitle: '배포 테스트',
    swaggerOptions: {
      docExpansion: 'none', // 모든 엔드포인트 접힘
      defaultModelsExpandDepth: -1, // 모델 스키마 숨김
      filter: true, // 검색 필터 활성화
      persistAuthorization: true,
      displayRequestDuration: true,
      operationsSorter: 'method',
    },
  });
}

/**
 * 어드민 API Swagger 문서 설정
 * @param app - NestFastifyApplication 인스턴스
 */
export function setupAdminSwagger(app: NestFastifyApplication): void {
  // 자동으로 AdminModule과 모든 하위 모듈을 포함
  const adminModules = getSwaggerModules({
    rootModule: AppModule,
    adminModules: [AdminModule],
  });
  logModuleInfo(adminModules, 'Admin API modules');

  // 어드민 모듈에서 사용된 태그 자동 추출
  const adminTags = extractTagsFromModules(adminModules);
  logTagInfo(adminTags, 'Admin API tags');

  // Admin API Swagger documentation (only admin modules)
  let adminConfigBuilder = new DocumentBuilder()
    .setTitle('Next Candle 관리자 API')
    .setDescription('Next Candle 시스템 관리를 위한 관리자 기능')
    .setVersion('1.0');

  // 자동 추출된 어드민 태그들을 DocumentBuilder에 추가
  adminConfigBuilder = applyTagsToDocumentBuilder(adminConfigBuilder, adminTags);

  const adminConfig = adminConfigBuilder
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT 토큰을 입력하세요 (관리자 권한 필요)',
        in: 'header',
      },
      'JWT-auth'
    )
    .build();

  const adminDocument = SwaggerModule.createDocument(app, adminConfig, {
    include: adminModules,
    deepScanRoutes: true,
  });

  // Admin API가 아닌 경로 제거 (import된 모듈의 컨트롤러 제외)
  const filteredPaths: any = {};
  for (const [path, pathItem] of Object.entries(adminDocument.paths || {})) {
    // /api/admin으로 시작하는 경로만 포함
    if (path.startsWith('/api/admin')) {
      filteredPaths[path] = pathItem;
    }
  }
  adminDocument.paths = filteredPaths;

  // Admin 태그만 필터링 (AuthModule 등의 태그 제거)
  if (adminDocument.tags) {
    adminDocument.tags = adminDocument.tags.filter((tag: any) => {
      return (
        tag.name.startsWith('관리자') ||
        tag.name.startsWith('Admin') ||
        tag.name === 'Rate Limit Management'
      );
    });
  }

  SwaggerModule.setup('api/admin/docs', app, adminDocument, {
    swaggerOptions: {
      docExpansion: 'none', // 모든 엔드포인트 접힘
      defaultModelsExpandDepth: -1, // 모델 스키마 숨김
      filter: true, // 검색 필터 활성화
      persistAuthorization: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method',
    },
  });
}
