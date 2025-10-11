// @CODE:AUTH-002 | SPEC: SPEC-AUTH-002.md
'use client';

import { useRouter } from 'next/navigation';
import { signInWithGoogle, signInWithKakao, signInAnonymously } from '@/lib/supabase';

/**
 * @CODE:AUTH-002:UI - 소셜 로그인 페이지
 * Google, Kakao, Anonymous Auth 버튼 제공
 */
export default function LoginPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    console.log('🔵 Google 로그인 버튼 클릭됨');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    try {
      const result = await signInWithGoogle();
      console.log('✅ signInWithGoogle 결과:', result);
      console.log('📦 data 객체:', result.data);
      console.log('🔗 OAuth URL:', result.data?.url);

      if (result.error) {
        console.error('❌ Google login failed:', result.error);
        alert(`Google 로그인 실패: ${result.error.message}`);
      } else if (result.data?.url) {
        console.log('🚀 리다이렉트 시작:', result.data.url);
        // 수동 리다이렉트
        window.location.href = result.data.url;
      } else {
        console.log('✅ Google login initiated successfully');
      }
    } catch (err) {
      console.error('❌ Exception during Google login:', err);
      alert(`Google 로그인 에러: ${err}`);
    }
  };

  const handleKakaoLogin = async () => {
    const { error } = await signInWithKakao();
    if (error) {
      console.error('Kakao login failed:', error);
      alert('Kakao 로그인 실패. Google을 시도해보세요.');
    }
  };

  const handleGuestLogin = async () => {
    const { data, error } = await signInAnonymously();
    if (!error && data) {
      router.push('/game');
    } else {
      console.error('Guest login failed:', error);
      alert('게스트 로그인 실패');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">라이어 게임</h1>
          <p className="mt-2 text-gray-600">로그인하여 게임을 시작하세요</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 시작
          </button>

          <button
            onClick={handleKakaoLogin}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] px-4 py-3 font-medium text-[#000000] transition hover:bg-[#FDD835]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z" />
            </svg>
            Kakao로 시작
          </button>

          <button
            onClick={handleGuestLogin}
            className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            게스트로 시작
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          소셜 로그인으로 빠르게 시작하거나
          <br />
          게스트로 먼저 체험해보세요
        </p>
      </div>
    </div>
  );
}
