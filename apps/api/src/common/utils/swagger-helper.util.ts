/**
 * Swagger 자동화 헬퍼 유틸리티
 * @ApiTags 데코레이터를 자동으로 수집하여 DocumentBuilder에 추가
 */

import { DocumentBuilder } from '@nestjs/swagger';
import { Type } from '@nestjs/common';

/**
 * 태그 정보 인터페이스
 */
interface TagInfo {
  name: string;
  description?: string;
}

/**
 * 모듈에서 사용된 모든 @ApiTags를 추출합니다
 * @param modules - 스캔할 모듈 배열
 * @returns 추출된 태그 정보 배열
 */
export function extractTagsFromModules(modules: any[]): TagInfo[] {
  const tagSet = new Set<string>();
  const tagInfoMap = new Map<string, TagInfo>();

  // 모든 모듈을 순회하며 컨트롤러 찾기
  modules.forEach(module => {
    const controllers = getControllersFromModule(module);

    controllers.forEach(controller => {
      const tags = getApiTagsFromController(controller);

      tags.forEach(tag => {
        if (!tagSet.has(tag)) {
          tagSet.add(tag);
          tagInfoMap.set(tag, {
            name: tag,
            description: generateTagDescription(tag),
          });
        }
      });
    });
  });

  // 태그 이름순으로 정렬하여 반환
  return Array.from(tagInfoMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * 추출된 태그를 DocumentBuilder에 추가합니다
 * @param builder - DocumentBuilder 인스턴스
 * @param tags - 추가할 태그 정보 배열
 * @returns 업데이트된 DocumentBuilder
 */
export function applyTagsToDocumentBuilder(
  builder: DocumentBuilder,
  tags: TagInfo[]
): DocumentBuilder {
  tags.forEach(tag => {
    builder.addTag(tag.name, tag.description || '');
  });

  return builder;
}

/**
 * 모듈에서 컨트롤러들을 추출합니다
 * @param module - 분석할 모듈
 * @returns 컨트롤러 클래스 배열
 */
function getControllersFromModule(module: any): Type<any>[] {
  if (!module) return [];

  try {
    // NestJS 모듈 메타데이터에서 컨트롤러 추출
    const controllers = Reflect.getMetadata('controllers', module) || [];
    return Array.isArray(controllers) ? controllers : [];
  } catch (error) {
    console.warn(`Failed to extract controllers from module ${module.name || 'Unknown'}:`, error);
    return [];
  }
}

/**
 * 컨트롤러에서 @ApiTags 메타데이터를 추출합니다
 * @param controller - 분석할 컨트롤러 클래스
 * @returns 태그 이름 배열
 */
function getApiTagsFromController(controller: Type<any>): string[] {
  if (!controller) return [];

  try {
    // @ApiTags 데코레이터는 'swagger/apiUseTags' 메타데이터에 저장됨
    const tags = Reflect.getMetadata('swagger/apiUseTags', controller);

    if (Array.isArray(tags)) {
      return tags.filter(tag => typeof tag === 'string');
    }

    return [];
  } catch (error) {
    console.warn(
      `Failed to extract ApiTags from controller ${controller.name || 'Unknown'}:`,
      error
    );
    return [];
  }
}

/**
 * 태그 이름으로부터 설명을 자동 생성합니다
 * @param tagName - 태그 이름
 * @returns 생성된 설명
 */
function generateTagDescription(tagName: string): string {
  // 태그 이름 패턴에 따라 설명 자동 생성
  const descriptions: Record<string, string> = {
    // 영어 태그
    Health: 'System health monitoring endpoints',
    Authentication: 'User authentication and authorization',
    Analysis: 'Cryptocurrency pattern analysis services',
    'Admin - User Management': 'User administration and management',
    'Admin - Analysis Management': 'Analysis system administration',
    'Admin - System Management': 'System monitoring and maintenance',

    // 한국어 태그
    헬스: '시스템 상태 모니터링 및 헬스체크',
    인증: '사용자 인증 및 권한 관리',
    분석: '암호화폐 패턴 분석 서비스',
    'Rate Limit Management': 'Binance API 속도 제한 관리',
  };

  // 정의된 설명이 있으면 사용
  if (descriptions[tagName]) {
    return descriptions[tagName];
  }

  // Admin 태그 패턴 자동 처리 (한국어)
  if (tagName.startsWith('관리자 - ')) {
    const subCategory = tagName.replace('관리자 - ', '');
    // "XXX 관리" 형태면 "관리 기능" 중복 방지
    if (subCategory.endsWith(' 관리')) {
      return `${subCategory} 기능`;
    }
    return `${subCategory} 관리 기능`;
  }

  // Admin 태그 패턴 자동 처리 (영어)
  if (tagName.startsWith('Admin - ')) {
    const subCategory = tagName.replace('Admin - ', '').toLowerCase();
    return `Administrative operations for ${subCategory}`;
  }

  // 기본 설명 (한국어/영어 구분)
  // 한글이 포함되어 있으면 한국어 설명 사용
  if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(tagName)) {
    return `${tagName} 관련 기능`;
  }

  return `${tagName} related operations`;
}

/**
 * 태그 정보를 로깅합니다 (디버깅용)
 * @param tags - 태그 정보 배열
 * @param title - 로그 제목
 */
export function logTagInfo(tags: TagInfo[], title: string): void {
  console.log(`🏷️  ${title} (${tags.length} tags):`);
  tags.forEach(tag => {
    console.log(`   • ${tag.name}: ${tag.description}`);
  });
}
