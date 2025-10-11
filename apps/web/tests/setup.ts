import '@testing-library/jest-dom';
import { expect, afterEach, vi, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// 환경변수 설정
beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
});

afterEach(() => {
  cleanup();
});

// Supabase 모킹
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
  createBrowserClient: vi.fn(),
}));

// Next.js 모킹
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT: ${url}`);
  }),
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));
