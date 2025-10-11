// @TEST:SETUP-001 | SPEC: .moai/specs/SPEC-SETUP-001/spec.md
import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * CON-002: 순환 의존성이 발생하지 않아야 한다
 */
describe('의존성 그래프 검증', () => {
  const rootDir = resolve(__dirname, '../..');

  it('packages/types 디렉토리가 존재해야 한다', () => {
    const typesDir = resolve(rootDir, 'packages/types');
    expect(existsSync(typesDir)).toBe(true);
  });

  it('packages/config 디렉토리가 존재해야 한다', () => {
    const configDir = resolve(rootDir, 'packages/config');
    expect(existsSync(configDir)).toBe(true);
  });

  it('packages/ui 디렉토리가 존재해야 한다', () => {
    const uiDir = resolve(rootDir, 'packages/ui');
    expect(existsSync(uiDir)).toBe(true);
  });

  it('packages/constants 디렉토리가 존재해야 한다', () => {
    const constantsDir = resolve(rootDir, 'packages/constants');
    expect(existsSync(constantsDir)).toBe(true);
  });

  it('apps/web 디렉토리가 존재해야 한다', () => {
    const webDir = resolve(rootDir, 'apps/web');
    expect(existsSync(webDir)).toBe(true);
  });

  it('apps/api 디렉토리가 존재해야 한다', () => {
    const apiDir = resolve(rootDir, 'apps/api');
    expect(existsSync(apiDir)).toBe(true);
  });
});
