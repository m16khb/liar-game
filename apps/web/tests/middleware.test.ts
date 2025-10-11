// @TEST:UI-001 | SPEC: SPEC-UI-001.md
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Middleware는 동적 import로 테스트
const getMiddleware = async () => {
  const { middleware } = await import('../src/middleware');
  return middleware;
};

describe('Middleware 인증 가드', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('비로그인 사용자가 /game 접근 시 /login으로 리다이렉트', async () => {
    // Given: 세션 없음
    const url = new URL('http://localhost:3000/game');
    const request = new NextRequest(url, {
      headers: new Headers(),
    });

    // Mock Supabase 세션 없음
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null
        }),
      },
    } as any);

    // When: Middleware 실행
    const middleware = await getMiddleware();
    const response = await middleware(request);

    // Then: /login으로 리다이렉트
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });

  it('로그인 사용자는 /game 접근 허용', async () => {
    // Given: 세션 존재
    const url = new URL('http://localhost:3000/game');
    const request = new NextRequest(url, {
      headers: new Headers(),
    });

    // Mock Supabase 세션 존재
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: { id: 'user-123', email: 'test@example.com' }
            }
          },
          error: null,
        }),
      },
    } as any);

    // When: Middleware 실행
    const middleware = await getMiddleware();
    const response = await middleware(request);

    // Then: 정상 진행 (200 또는 다음 핸들러로)
    expect(response.status).not.toBe(307);
  });

  it('로그인 사용자가 /login 접근 시 /game으로 리다이렉트', async () => {
    // Given: 세션 존재
    const url = new URL('http://localhost:3000/login');
    const request = new NextRequest(url, {
      headers: new Headers(),
    });

    // Mock Supabase 세션 존재
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: { id: 'user-123', email: 'test@example.com' }
            }
          },
          error: null,
        }),
      },
    } as any);

    // When: Middleware 실행
    const middleware = await getMiddleware();
    const response = await middleware(request);

    // Then: /game으로 리다이렉트
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/game');
  });

  it('비로그인 사용자는 /login 접근 허용', async () => {
    // Given: 세션 없음
    const url = new URL('http://localhost:3000/login');
    const request = new NextRequest(url, {
      headers: new Headers(),
    });

    // Mock Supabase 세션 없음
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null
        }),
      },
    } as any);

    // When: Middleware 실행
    const middleware = await getMiddleware();
    const response = await middleware(request);

    // Then: 정상 진행
    expect(response.status).not.toBe(307);
  });

  it('세션 확인 실패 시 /game 접근은 /login으로 리다이렉트', async () => {
    // Given: 세션 확인 에러
    const url = new URL('http://localhost:3000/game');
    const request = new NextRequest(url, {
      headers: new Headers(),
    });

    // Mock Supabase 세션 확인 에러
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: new Error('Session check failed'),
        }),
      },
    } as any);

    // When: Middleware 실행
    const middleware = await getMiddleware();
    const response = await middleware(request);

    // Then: 안전하게 /login으로 리다이렉트
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });

  it('예외 발생 시 /game 접근은 /login으로 리다이렉트', async () => {
    // Given: 세션 확인 중 예외 발생
    const url = new URL('http://localhost:3000/game');
    const request = new NextRequest(url, {
      headers: new Headers(),
    });

    // Mock Supabase 예외 발생
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockRejectedValue(new Error('Unexpected error')),
      },
    } as any);

    // When: Middleware 실행
    const middleware = await getMiddleware();
    const response = await middleware(request);

    // Then: 안전하게 /login으로 리다이렉트
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });
});
