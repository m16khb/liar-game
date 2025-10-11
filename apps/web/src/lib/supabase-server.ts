// @CODE:UI-001:INFRA | SPEC: SPEC-UI-001.md
import { createServerClient as _createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * 환경변수 검증
 */
function validateSupabaseConfig(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
      'Please add it to your .env.local file.'
    );
  }

  if (!key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Please add it to your .env.local file.'
    );
  }

  return { url, key };
}

/**
 * Server Component용 Supabase 클라이언트 생성
 * Next.js 15 Server Components에서 사용
 */
export async function createServerClient() {
  const { url, key } = validateSupabaseConfig();
  const cookieStore = await cookies();

  return _createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component에서 setAll이 호출될 수 있음 (무시)
        }
      },
    },
  });
}
