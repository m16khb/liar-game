// @CODE:UI-001:INFRA | SPEC: SPEC-UI-001.md | TEST: tests/middleware.test.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js Middleware - 인증 가드
 *
 * @description
 * Edge Runtime에서 실행되는 인증 미들웨어
 * Supabase 세션을 확인하여 보호 경로에 대한 접근을 제어합니다.
 *
 * @protectedRoutes
 * - `/game/*`: 로그인 필수, 미인증 시 `/login`으로 리다이렉트
 * - `/login`: 이미 로그인된 사용자는 `/game`으로 리다이렉트
 *
 * @errorHandling
 * - 세션 확인 실패 시: 안전하게 비로그인 상태로 처리
 * - 예외 발생 시: 보호 경로는 로그인 페이지로 리다이렉트
 *
 * @see SPEC-UI-001.md
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error && request.nextUrl.pathname.startsWith('/game')) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // 보호 경로 (/game) 접근 시 인증 확인
    if (request.nextUrl.pathname.startsWith('/game')) {
      if (!session) {
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // 로그인 페이지에 이미 로그인된 사용자 접근 시
    if (request.nextUrl.pathname === '/login' && session) {
      return NextResponse.redirect(new URL('/game', request.url));
    }

    return response;
  } catch (error) {
    if (request.nextUrl.pathname.startsWith('/game')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }
}

export const config = {
  matcher: ['/game/:path*', '/login'],
};
