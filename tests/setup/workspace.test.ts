// @TEST:SETUP-001 | SPEC: .moai/specs/SPEC-SETUP-001/spec.md
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * REQ-007: 시스템은 pnpm install로 워크스페이스를 올바르게 업데이트해야 한다
 */
describe('pnpm 워크스페이스 검증', () => {
  const rootDir = resolve(__dirname, '../..');
  const workspaceYamlPath = resolve(rootDir, 'pnpm-workspace.yaml');
  const packageJsonPath = resolve(rootDir, 'package.json');

  it('pnpm-workspace.yaml 파일이 존재해야 한다', () => {
    expect(existsSync(workspaceYamlPath)).toBe(true);
  });

  it('pnpm-workspace.yaml에 apps/* 패턴이 포함되어야 한다', () => {
    const content = readFileSync(workspaceYamlPath, 'utf-8');
    expect(content).toContain('apps/*');
  });

  it('pnpm-workspace.yaml에 packages/* 패턴이 포함되어야 한다', () => {
    const content = readFileSync(workspaceYamlPath, 'utf-8');
    expect(content).toContain('packages/*');
  });

  it('루트 package.json이 존재해야 한다', () => {
    expect(existsSync(packageJsonPath)).toBe(true);
  });

  it('루트 package.json에 workspaces 필드가 정의되어야 한다', () => {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    expect(pkg.workspaces).toBeDefined();
    expect(Array.isArray(pkg.workspaces)).toBe(true);
  });
});
