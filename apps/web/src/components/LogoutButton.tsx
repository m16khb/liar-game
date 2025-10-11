// @CODE:UI-001:UI | SPEC: SPEC-UI-001.md
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase, signOut } from '@/lib/supabase';

/**
 * 로그아웃 버튼 (Client Component)
 *
 * @description
 * 1. NestJS API 로그아웃 호출 (Redis 세션 삭제 + Supabase OAuth revoke)
 * 2. Supabase 클라이언트 세션 삭제
 * 3. 로그인 페이지로 리다이렉트
 */
export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);

      // 1. Supabase 세션에서 access token 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // 2. NestJS API 로그아웃 호출 (nginx /api/ → NestJS)
      if (token) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        } catch (error) {
          // API 실패해도 클라이언트 로그아웃은 진행
        }
      }

      // 3. Supabase 클라이언트 세션 삭제
      await signOut();

      // 4. 로그인 페이지로 리다이렉트 (전체 URL로 이동)
      window.location.href = '/login';
    } catch (error) {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
    >
      {isLoading ? '로그아웃 중...' : '로그아웃'}
    </button>
  );
}
