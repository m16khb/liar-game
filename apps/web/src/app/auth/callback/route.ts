// @CODE:AUTH-002 | SPEC: SPEC-AUTH-002.md
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * @CODE:AUTH-002:API - OAuth 콜백 핸들러
 * Google/Kakao OAuth 콜백 처리
 *
 * 흐름:
 * 1. OAuth 코드 → Supabase 세션
 * 2. 자체 API 호출하여 DB에 유저 생성/동기화
 * 3. JWT 쿠키에 저장
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  // 실제 origin 계산 (ngrok/proxy 환경 고려)
  const getOrigin = () => {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || requestUrl.host;
    let proto = request.headers.get('x-forwarded-proto') || requestUrl.protocol.replace(':', '');
    if (host && (host.includes('ngrok') || host.includes('.app'))) {
      proto = 'https';
    }
    return `${proto}://${host}`;
  };

  if (!code) {
    return NextResponse.redirect(`${getOrigin()}/login?error=no_code`);
  }

  // NextResponse를 미리 생성하여 쿠키를 담을 수 있게 함
  let response = NextResponse.next();
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              response.cookies.set(name, value, options);
            });
          } catch (error) {
            // Cookie setting failed
          }
        },
      },
    }
  );

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session || !data.user) {
      return NextResponse.redirect(`${getOrigin()}/login?error=oauth_failed`);
    }

    const token = data.session.access_token;
    const user = data.user;

    // 자체 DB에 유저 생성/동기화
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      await fetch(`${apiUrl}/api/auth/oauth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supabaseUserId: user.id,
          email: user.email,
          username: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
          provider: user.app_metadata?.provider || 'unknown',
        }),
      });
    } catch (syncError) {
      // DB 동기화 실패해도 로그인은 진행 (Hook이 이미 동기화했을 가능성 있음)
    }

    // 게임 페이지로 리다이렉트
    // 실제 요청 origin 확인 (ngrok/proxy 환경 고려)
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || requestUrl.host;
    let proto = request.headers.get('x-forwarded-proto') || requestUrl.protocol.replace(':', '');

    // ngrok 도메인이면 무조건 https 사용
    if (host && (host.includes('ngrok') || host.includes('.app'))) {
      proto = 'https';
    }

    const redirectUrl = `${proto}://${host}/game`;
    const redirectResponse = NextResponse.redirect(redirectUrl);

    // response의 쿠키를 redirect response로 복사
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  } catch (error) {
    return NextResponse.redirect(`${getOrigin()}/login?error=internal_error`);
  }
}
