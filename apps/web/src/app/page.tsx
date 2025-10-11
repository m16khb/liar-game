// @CODE:UI-001:UI | SPEC: SPEC-UI-001.md | TEST: tests/pages/home.test.tsx
import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Button } from '@liar-game/ui';

/**
 * 메인 페이지 (Landing Page)
 *
 * @description
 * 앱의 진입점으로, 사용자 인증 상태에 따라 다른 동작을 수행합니다.
 *
 * @flow
 * 1. OAuth 코드 확인 (Supabase Redirect URL 미설정 시 대응)
 * 2. 세션 확인 (Server Component)
 * 3. 로그인 상태
 *    - Yes: `/game` 페이지로 자동 리다이렉트
 *    - No: 로그인 CTA 표시 (OAuth + Anonymous 로그인)
 *
 * @see SPEC-UI-001.md
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  // Next.js 15: searchParams는 Promise로 await 필요
  const params = await searchParams;

  // OAuth 코드가 있으면 /auth/callback으로 리다이렉트
  // (Supabase Dashboard에서 Redirect URL이 설정되지 않은 경우 대응)
  if (params.code) {
    redirect(`/auth/callback?code=${params.code}`);
  }

  // 세션 확인 (Server Component)
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  // 로그인된 사용자는 게임 페이지로 리다이렉트
  if (session) {
    redirect('/game');
  }

  // 비로그인 사용자에게 로그인 CTA 표시
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">라이어 게임</h1>
        <p className="text-gray-600 mb-8">친구들과 함께 즐기는 추리 게임</p>
        <div className="flex gap-4 justify-center">
          <a href="/login">
            <Button variant="primary">로그인하기</Button>
          </a>
          <a href="/login?mode=anonymous">
            <Button variant="secondary">게스트로 플레이</Button>
          </a>
        </div>
      </div>
    </main>
  );
}
