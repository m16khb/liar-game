/**
 * 모듈 관련 유틸리티 함수들
 * Swagger 문서 생성 시 모듈 분리를 지원
 */

/**
 * 모듈의 imports 메타데이터를 재귀적으로 추출하여 모든 하위 모듈을 반환
 * @param module - 분석할 모듈
 * @param visited - 순환 참조 방지를 위한 방문된 모듈 Set
 * @returns 모듈과 모든 하위 모듈의 배열
 */
export function getModuleImports(module: any, visited: Set<any> = new Set()): any[] {
  if (visited.has(module)) {
    return []; // 순환 참조 방지
  }

  visited.add(module);
  const imports = Reflect.getMetadata('imports', module) || [];
  const allImports = [module]; // 자기 자신도 포함

  imports.forEach((importedModule: any) => {
    if (importedModule && !visited.has(importedModule)) {
      // 재귀적으로 하위 모듈들도 포함
      const subImports = getModuleImports(importedModule, visited);
      allImports.push(...subImports.filter(subModule => !allImports.includes(subModule)));
    }
  });

  return allImports;
}

/**
 * 특정 모듈을 제외한 모든 모듈을 반환
 * @param rootModule - 루트 모듈
 * @param excludeModules - 제외할 모듈들
 * @returns 제외된 모듈을 제외한 모든 모듈의 배열
 */
export function getModulesExcluding(rootModule: any, excludeModules: any[]): any[] {
  const allModules = getModuleImports(rootModule);

  // 제외할 모듈들과 관련 하위 모듈들만 수집
  const excludeSet = new Set();
  excludeModules.forEach(excludeModule => {
    excludeSet.add(excludeModule); // 직접 지정된 모듈
    const subModules = getModuleImports(excludeModule);
    subModules.forEach(subModule => {
      excludeSet.add(subModule);
    });
  });

  return allModules.filter(module => {
    // 제외 목록에 있는지 확인
    return !excludeSet.has(module);
  });
}

/**
 * 여러 모듈들의 모든 하위 모듈을 반환
 * @param modules - 분석할 모듈들
 * @returns 모든 모듈과 하위 모듈들의 배열
 */
export function getMultipleModuleImports(modules: any[]): any[] {
  const allImports: any[] = [];
  const globalVisited = new Set<any>();

  modules.forEach(module => {
    const moduleImports = getModuleImports(module, globalVisited);
    moduleImports.forEach(importedModule => {
      if (!allImports.includes(importedModule)) {
        allImports.push(importedModule);
      }
    });
  });

  return allImports;
}

/**
 * Swagger 문서 생성을 위한 모듈 설정 헬퍼
 */
export interface SwaggerModuleConfig {
  rootModule: any;
  includeModules?: any[];
  excludeModules?: any[];
}

/**
 * Swagger 문서용 모듈 목록을 생성하는 헬퍼 함수
 * @param config - Swagger 모듈 설정
 * @returns 포함할 모듈들의 배열
 */
export function getSwaggerModules(config: SwaggerModuleConfig): any[] {
  const { rootModule, includeModules, excludeModules = [] } = config;

  if (includeModules) {
    // 명시적으로 포함할 모듈이 지정된 경우
    return getMultipleModuleImports(includeModules);
  }

  // 기본적으로 제외할 모듈을 제외한 모든 모듈 반환
  return getModulesExcluding(rootModule, excludeModules);
}

/**
 * 모듈 디버그 정보 출력
 * @param modules - 모듈 배열
 * @param title - 출력할 제목
 */
export function logModuleInfo(modules: any[], title: string): void {
  const moduleNames = modules.map(m => m.name || 'Anonymous').sort();
  console.log(`📦 ${title} (${modules.length} modules):`);
  console.log(`   ${moduleNames.join(', ')}`);
}