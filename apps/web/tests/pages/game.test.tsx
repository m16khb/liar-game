// @TEST:UI-001 | SPEC: SPEC-UI-001.md
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createServerClient } from '@supabase/ssr';

// 게임 페이지는 동적 import로 테스트
const getGamePage = async () => {
  const module = await import('../../src/app/game/page');
  return module.default;
};

describe('게임 페이지', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('로그인 사용자 정보 표시', async () => {
    // Given: 로그인 사용자
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com'
            }
          },
          error: null,
        }),
      },
    } as any);

    // When: 게임 페이지 렌더링
    const GamePage = await getGamePage();
    const result = await GamePage();
    render(result);

    // Then: 사용자 정보 표시
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });

  it('게임 대기실 제목 표시', async () => {
    // Given: 로그인 사용자
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com'
            }
          },
          error: null,
        }),
      },
    } as any);

    // When: 게임 페이지 렌더링
    const GamePage = await getGamePage();
    const result = await GamePage();
    render(result);

    // Then: 게임 대기실 제목 표시
    expect(screen.getByText(/게임 대기실/i)).toBeInTheDocument();
  });

  it('게임 시작 버튼 표시', async () => {
    // Given: 로그인 사용자
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com'
            }
          },
          error: null,
        }),
      },
    } as any);

    // When: 게임 페이지 렌더링
    const GamePage = await getGamePage();
    const result = await GamePage();
    render(result);

    // Then: 게임 시작 버튼 표시
    expect(screen.getByText(/게임 시작/i)).toBeInTheDocument();
  });
});
