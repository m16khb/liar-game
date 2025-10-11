// @TEST:SETUP-001 | SPEC: .moai/specs/SPEC-SETUP-001/spec.md
import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * REQ-002: 시스템은 공유 타입 정의 패키지를 제공해야 한다
 * REQ-003: 시스템은 통합 빌드 파이프라인을 제공해야 한다
 */
describe('빌드 설정 검증', () => {
  const rootDir = resolve(__dirname, '../..');

  it('packages/types에 package.json이 존재해야 한다', () => {
    const packageJsonPath = resolve(rootDir, 'packages/types/package.json');
    expect(existsSync(packageJsonPath)).toBe(true);
  });

  it('packages/types에 src/index.ts가 존재해야 한다', () => {
    const indexPath = resolve(rootDir, 'packages/types/src/index.ts');
    expect(existsSync(indexPath)).toBe(true);
  });

  it('apps/web에 package.json이 존재해야 한다', () => {
    const packageJsonPath = resolve(rootDir, 'apps/web/package.json');
    expect(existsSync(packageJsonPath)).toBe(true);
  });

  it('apps/api에 package.json이 존재해야 한다', () => {
    const packageJsonPath = resolve(rootDir, 'apps/api/package.json');
    expect(existsSync(packageJsonPath)).toBe(true);
  });

  it('.gitignore 파일이 존재해야 한다', () => {
    const gitignorePath = resolve(rootDir, '.gitignore');
    expect(existsSync(gitignorePath)).toBe(true);
  });
});
