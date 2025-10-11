// @CODE:AUTH-002 | SPEC: SPEC-AUTH-002.md
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * @CODE:AUTH-002:INFRA - Supabase 클라이언트 (프론트엔드)
 * Next.js 클라이언트 컴포넌트에서 사용하는 Supabase 클라이언트
 */
export const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

/**
 * @CODE:AUTH-002:API - Google OAuth 로그인
 */
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

/**
 * @CODE:AUTH-002:API - Kakao OAuth 로그인
 */
export async function signInWithKakao() {
  return supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

/**
 * @CODE:AUTH-002:API - Anonymous 로그인
 */
export async function signInAnonymously() {
  return supabase.auth.signInAnonymously();
}

/**
 * @CODE:AUTH-002:API - 로그아웃
 */
export async function signOut() {
  return supabase.auth.signOut();
}

/**
 * @CODE:AUTH-002:API - 현재 세션 조회
 */
export async function getSession() {
  return supabase.auth.getSession();
}
