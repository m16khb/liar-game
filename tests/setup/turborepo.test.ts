// @TEST:SETUP-001 | SPEC: .moai/specs/SPEC-SETUP-001/spec.md
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * REQ-001: 시스템은 Turborepo 기반 모노레포 구조를 제공해야 한다
 * REQ-003: 시스템은 통합 빌드 파이프라인을 제공해야 한다
 */
describe('Turborepo 설정 검증', () => {
  const rootDir = resolve(__dirname, '../..');
  const turboJsonPath = resolve(rootDir, 'turbo.json');

  it('turbo.json 파일이 존재해야 한다', () => {
    expect(existsSync(turboJsonPath)).toBe(true);
  });

  it('turbo.json이 유효한 JSON 형식이어야 한다', () => {
    const content = readFileSync(turboJsonPath, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it('build 태스크가 정의되어야 한다', () => {
    const turboConfig = JSON.parse(readFileSync(turboJsonPath, 'utf-8'));
    const tasks = turboConfig.tasks || turboConfig.pipeline; // 하위 호환성
    expect(tasks).toBeDefined();
    expect(tasks.build).toBeDefined();
  });

  it('build 태스크에 의존성 순서가 정의되어야 한다', () => {
    const turboConfig = JSON.parse(readFileSync(turboJsonPath, 'utf-8'));
    const tasks = turboConfig.tasks || turboConfig.pipeline;
    expect(tasks.build.dependsOn).toContain('^build');
  });

  it('dev 태스크가 persistent 모드여야 한다', () => {
    const turboConfig = JSON.parse(readFileSync(turboJsonPath, 'utf-8'));
    const tasks = turboConfig.tasks || turboConfig.pipeline;
    expect(tasks.dev).toBeDefined();
    expect(tasks.dev.persistent).toBe(true);
  });

  it('test 태스크가 정의되어야 한다', () => {
    const turboConfig = JSON.parse(readFileSync(turboJsonPath, 'utf-8'));
    const tasks = turboConfig.tasks || turboConfig.pipeline;
    expect(tasks.test).toBeDefined();
  });
});
