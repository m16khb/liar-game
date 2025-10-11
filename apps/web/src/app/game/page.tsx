// @CODE:UI-001:UI | SPEC: SPEC-UI-001.md | TEST: tests/pages/game.test.tsx
import { createServerClient } from '@/lib/supabase-server';
import { Button } from '@liar-game/ui';

/**
 * 게임 대기실 페이지
 *
 * @description
 * 인증된 사용자만 접근 가능한 게임 대기실
 * Middleware에서 이미 인증 여부를 확인하므로 여기서는 사용자 정보만 표시합니다.
 *
 * @protected
 * Middleware에서 `/game/*` 경로 보호
 * 비인증 사용자는 자동으로 `/login`으로 리다이렉트됨
 *
 * @see SPEC-UI-001.md
 */
export default async function GamePage() {
  // 세션 확인 (Middleware에서 이미 보호됨)
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">게임 대기실</h1>
        <div className="mb-8">
          <p className="text-gray-600">
            환영합니다, {user?.email || '게스트'}님!
          </p>
        </div>
        <Button variant="primary">게임 시작하기</Button>
      </div>
    </main>
  );
}
