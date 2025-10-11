// @TEST:UI-001 | SPEC: SPEC-UI-001.md
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';

// 메인 페이지는 동적 import로 테스트
const getHomePage = async () => {
  const module = await import('../../src/app/page');
  return module.default;
};

describe('메인 페이지', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('비로그인 사용자에게 로그인 버튼 표시', async () => {
    // Given: 세션 없음
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null
        }),
      },
    } as any);

    // When: 메인 페이지 렌더링
    const HomePage = await getHomePage();
    const result = await HomePage();
    render(result);

    // Then: 로그인 CTA 표시
    expect(screen.getByText(/로그인하기/i)).toBeInTheDocument();
  });

  it('로그인 사용자는 /game으로 리다이렉트', async () => {
    // Given: 세션 존재
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

    // When: 메인 페이지 렌더링 시도
    const HomePage = await getHomePage();

    try {
      await HomePage();
    } catch (error) {
      // redirect() 함수는 NEXT_REDIRECT 에러를 던짐
    }

    // Then: redirect 함수가 '/game'으로 호출됨
    expect(redirect).toHaveBeenCalledWith('/game');
  });
});
