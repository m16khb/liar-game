// @CODE:UI-001:UI | SPEC: SPEC-UI-001.md | TEST: tests/pages/game.test.tsx
import { createServerClient } from '@/lib/supabase-server';
import { Button } from '@liar-game/ui';
import { LogoutButton } from '@/components/LogoutButton';
import { JwtDebugger } from '@/components/JwtDebugger';

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

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || '게스트';
  const role = user?.app_metadata?.role || 'user';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      {/* JWT 디버거 (개발용 - 브라우저 콘솔에만 출력) */}
      <JwtDebugger />

      <div className="max-w-2xl w-full p-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">라이어 게임</h1>
            <p className="text-gray-600 mt-2">게임 대기실</p>
          </div>
          <LogoutButton />
        </div>

        {/* 사용자 정보 카드 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">사용자 정보</h2>
          <div className="space-y-2 text-gray-700">
            <p>
              <span className="font-medium">이름:</span> {username}
            </p>
            <p>
              <span className="font-medium">이메일:</span> {user?.email}
            </p>
            <p>
              <span className="font-medium">역할:</span>{' '}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {role.toUpperCase()}
              </span>
            </p>
            {user?.app_metadata?.provider && (
              <p>
                <span className="font-medium">로그인 방식:</span>{' '}
                {user.app_metadata.provider === 'google' ? 'Google' :
                 user.app_metadata.provider === 'kakao' ? 'Kakao' :
                 user.app_metadata.provider}
              </p>
            )}
          </div>
        </div>

        {/* 게임 시작 버튼 */}
        <div className="text-center">
          <Button variant="primary" className="px-8 py-3 text-lg">
            게임 시작하기
          </Button>
          <p className="text-gray-500 text-sm mt-4">
            게임 기능은 곧 추가될 예정입니다!
          </p>
        </div>
      </div>
    </main>
  );
}
