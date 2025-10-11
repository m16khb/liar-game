// @TEST:SETUP-001 | SPEC: .moai/specs/SPEC-SETUP-001/spec.md
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

/**
 * CON-004: 모든 패키지는 TypeScript strict mode를 사용해야 한다
 */
describe('TypeScript strict mode 검증', () => {
  const rootDir = resolve(__dirname, '../..');
  const rootTsConfigPath = resolve(rootDir, 'tsconfig.json');

  it('루트 tsconfig.json이 존재해야 한다', () => {
    expect(existsSync(rootTsConfigPath)).toBe(true);
  });

  it('루트 tsconfig.json에 strict mode가 활성화되어야 한다', () => {
    const tsConfig = JSON.parse(readFileSync(rootTsConfigPath, 'utf-8'));
    expect(tsConfig.compilerOptions?.strict).toBe(true);
  });

  it('packages의 모든 패키지에 tsconfig.json이 존재해야 한다', () => {
    const packagesDir = resolve(rootDir, 'packages');
    if (!existsSync(packagesDir)) {
      // packages 디렉토리가 아직 없으면 테스트 스킵
      return;
    }

    const packages = readdirSync(packagesDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const pkg of packages) {
      const tsConfigPath = join(packagesDir, pkg, 'tsconfig.json');
      expect(existsSync(tsConfigPath)).toBe(true);
    }
  });

  it('apps의 모든 앱에 tsconfig.json이 존재해야 한다', () => {
    const appsDir = resolve(rootDir, 'apps');
    if (!existsSync(appsDir)) {
      // apps 디렉토리가 아직 없으면 테스트 스킵
      return;
    }

    const apps = readdirSync(appsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const app of apps) {
      const tsConfigPath = join(appsDir, app, 'tsconfig.json');
      expect(existsSync(tsConfigPath)).toBe(true);
    }
  });
});
