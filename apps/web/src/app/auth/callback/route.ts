// @CODE:AUTH-002 | SPEC: SPEC-AUTH-002.md
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * @CODE:AUTH-002:API - OAuth 콜백 핸들러
 * Google/Kakao OAuth 콜백 처리 및 세션 생성
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });

    try {
      // OAuth 코드를 세션으로 교환
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('OAuth callback failed:', error);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_failed`);
    }
  }

  // 성공 시 게임 페이지로 리다이렉트
  return NextResponse.redirect(`${requestUrl.origin}/game`);
}
