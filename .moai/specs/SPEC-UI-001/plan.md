# SPEC-UI-001 TDD 구현 계획

## 개요

본 문서는 **SPEC-UI-001: 사용자 로그인 플로우 및 인증 가드**의 TDD 구현 전략을 정의합니다.

**핵심 목표**:
- Next.js Middleware 기반 인증 가드 구현
- 메인 페이지 조건부 리다이렉트
- 게임 페이지 생성 및 보호
- 완전한 테스트 커버리지 확보

---

## RED (테스트 작성)

### 우선순위 1: Middleware 인증 가드 (Critical)

**파일**: `apps/web/tests/middleware.test.ts`

#### TEST-UI-001-M1: 비로그인 사용자 게임 페이지 차단
```typescript
describe('Middleware 인증 가드', () => {
  it('비로그인 사용자가 /game 접근 시 /login으로 리다이렉트', async () => {
    // Given: 세션 없음
    const request = new NextRequest(new URL('/game', 'http://localhost:3000'));

    // When: Middleware 실행
    const response = await middleware(request);

    // Then: /login으로 리다이렉트
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/login');
  });
});
```

#### TEST-UI-001-M2: 로그인 사용자 게임 페이지 허용
```typescript
it('로그인 사용자는 /game 접근 허용', async () => {
  // Given: 유효한 세션
  const request = createAuthenticatedRequest('/game');

  // When: Middleware 실행
  const response = await middleware(request);

  // Then: 통과 (200)
  expect(response.status).toBe(200);
});
```

#### TEST-UI-001-M3: 로그인 사용자 로그인 페이지 차단
```typescript
it('로그인 사용자가 /login 접근 시 /game으로 리다이렉트', async () => {
  // Given: 유효한 세션
  const request = createAuthenticatedRequest('/login');

  // When: Middleware 실행
  const response = await middleware(request);

  // Then: /game으로 리다이렉트
  expect(response.status).toBe(307);
  expect(response.headers.get('location')).toBe('/game');
});
```

### 우선순위 2: 메인 페이지 플로우 (High)

**파일**: `apps/web/tests/pages/main.test.tsx`

#### TEST-UI-001-H1: 비로그인 사용자 로그인 CTA 표시
```typescript
describe('메인 페이지', () => {
  it('비로그인 사용자에게 로그인 버튼 표시', async () => {
    // Given: 세션 없음
    mockSupabaseSession(null);

    // When: 메인 페이지 렌더링
    const { container } = render(<HomePage />);

    // Then: 로그인 CTA 표시
    expect(screen.getByText('로그인하기')).toBeInTheDocument();
    expect(screen.getByText('게스트로 플레이')).toBeInTheDocument();
  });
});
```

#### TEST-UI-001-H2: 로그인 사용자 게임 페이지 리다이렉트
```typescript
it('로그인 사용자는 /game으로 자동 리다이렉트', async () => {
  // Given: 유효한 세션
  mockSupabaseSession({ user: { id: '123', email: 'test@example.com' } });

  // When: 메인 페이지 접속
  render(<HomePage />);

  // Then: redirect() 호출 확인
  await waitFor(() => {
    expect(mockRedirect).toHaveBeenCalledWith('/game');
  });
});
```

### 우선순위 3: 게임 페이지 (Medium)

**파일**: `apps/web/tests/pages/game.test.tsx`

#### TEST-UI-001-G1: 게임 페이지 렌더링
```typescript
describe('게임 페이지', () => {
  it('로그인 사용자에게 게임 대기실 표시', async () => {
    // Given: 유효한 세션
    mockSupabaseUser({ id: '123', email: 'test@example.com' });

    // When: 게임 페이지 렌더링
    render(<GamePage />);

    // Then: 사용자 정보 및 게임 시작 버튼 표시
    expect(await screen.findByText('게임 대기실')).toBeInTheDocument();
    expect(screen.getByText(/환영합니다, test@example.com님!/)).toBeInTheDocument();
    expect(screen.getByText('게임 시작하기')).toBeInTheDocument();
  });
});
```

#### TEST-UI-001-G2: 익명 사용자 게임 페이지 접근
```typescript
it('익명 로그인 사용자는 게스트로 표시', async () => {
  // Given: 익명 세션
  mockSupabaseUser({ id: '123', email: null, is_anonymous: true });

  // When: 게임 페이지 렌더링
  render(<GamePage />);

  // Then: "게스트" 표시
  expect(await screen.findByText(/환영합니다, 게스트님!/)).toBeInTheDocument();
});
```

---

## GREEN (최소 구현)

### 1단계: Middleware 구현

**파일**: `apps/web/src/middleware.ts`

**구현 내용**:
- `createServerClient` 사용하여 Supabase 클라이언트 생성
- 쿠키 기반 세션 확인 로직
- 보호 경로 (`/game/*`) 체크
- 로그인 페이지 역리다이렉트 처리
- `matcher` 설정: `['/game/:path*', '/login']`

**핵심 코드**:
```typescript
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* ... */);
  const { data: { session } } = await supabase.auth.getSession();

  // 보호 경로 체크
  if (request.nextUrl.pathname.startsWith('/game') && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 로그인 페이지 역리다이렉트
  if (request.nextUrl.pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/game', request.url));
  }

  return NextResponse.next();
}
```

### 2단계: 메인 페이지 수정

**파일**: `apps/web/src/app/page.tsx`

**구현 내용**:
- Server Component로 세션 확인
- `cookies()` 함수로 쿠키 접근
- 로그인 여부에 따른 조건부 리다이렉트
- 비로그인 시 로그인 CTA UI 렌더링

**핵심 코드**:
```typescript
export default async function HomePage() {
  const supabase = createServerClient(/* ... */);
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect('/game');
  }

  return <LoginCTA />;
}
```

### 3단계: 게임 페이지 생성

**파일**: `apps/web/src/app/game/page.tsx`

**구현 내용**:
- 기본 게임 대기실 UI
- Server Component로 사용자 정보 조회
- 이메일 또는 익명 여부 표시
- "게임 시작하기" 버튼 (현재는 비활성)

**핵심 코드**:
```typescript
export default async function GamePage() {
  const supabase = createServerClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main>
      <h1>게임 대기실</h1>
      <p>환영합니다, {user?.email || '게스트'}님!</p>
      <button>게임 시작하기</button>
    </main>
  );
}
```

---

## REFACTOR (코드 개선)

### 1단계: 에러 핸들링 강화

**Middleware 에러 처리**:
```typescript
try {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Session check failed:', error);
    // 안전하게 비로그인 상태로 처리
    return NextResponse.redirect(new URL('/login', request.url));
  }
} catch (error) {
  console.error('Unexpected middleware error:', error);
  return NextResponse.redirect(new URL('/login', request.url));
}
```

**Server Component 에러 처리**:
```typescript
const { data: { session }, error } = await supabase.auth.getSession();
if (error) {
  console.error('Session error:', error);
  return <ErrorPage message="세션 확인 중 오류가 발생했습니다." />;
}
```

### 2단계: 로딩 상태 개선

**Suspense 활용**:
```typescript
// app/game/page.tsx
export default function GamePageWrapper() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <GamePage />
    </Suspense>
  );
}
```

**Skeleton UI 추가**:
```typescript
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );
}
```

### 3단계: 코드 주석 및 @TAG 추가

**Middleware**:
```typescript
// @CODE:UI-001:INFRA | SPEC: SPEC-UI-001.md | TEST: tests/middleware.test.ts
// TDD 이력:
// - RED: TEST-UI-001-M1 (비로그인 게임 차단)
// - GREEN: NextResponse.redirect 구현
// - REFACTOR: 에러 핸들링 추가
```

**메인 페이지**:
```typescript
// @CODE:UI-001:UI | SPEC: SPEC-UI-001.md | TEST: tests/pages/main.test.tsx
// TDD 이력:
// - RED: TEST-UI-001-H2 (로그인 사용자 리다이렉트)
// - GREEN: redirect('/game') 구현
// - REFACTOR: Suspense 추가
```

### 4단계: 타입 안전성 강화

**세션 타입 정의**:
```typescript
import type { Session } from '@supabase/supabase-js';

type AuthenticatedSession = Session & {
  user: NonNullable<Session['user']>;
};

function isAuthenticated(session: Session | null): session is AuthenticatedSession {
  return session !== null && session.user !== null;
}
```

**환경변수 타입 체크**:
```typescript
// src/lib/env.ts
export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
} as const;

// 런타임 검증
if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}
```

### 5단계: 성능 최적화

**메모이제이션**:
```typescript
// lib/supabase/server.ts
import { cache } from 'react';

export const getSession = cache(async () => {
  const supabase = createServerClient(/* ... */);
  return await supabase.auth.getSession();
});
```

**병렬 데이터 로딩**:
```typescript
// game/page.tsx
const [session, user] = await Promise.all([
  supabase.auth.getSession(),
  supabase.auth.getUser(),
]);
```

---

## 테스트 전략

### 단위 테스트 (Vitest)

- Middleware 로직 테스트
- 리다이렉트 로직 테스트
- 세션 확인 로직 테스트

**커버리지 목표**: 90% 이상

### 통합 테스트 (Playwright)

- E2E 플로우 테스트
- 실제 Supabase 세션 시뮬레이션
- 브라우저 쿠키 및 리다이렉트 검증

**시나리오**:
1. 비로그인 → 로그인 → 게임 페이지 진입
2. 로그인 상태에서 메인 페이지 접속 → 자동 리다이렉트
3. 로그아웃 → 게임 페이지 접근 차단

### 테스트 명령어

```bash
# 단위 테스트
pnpm test:unit apps/web

# 통합 테스트
pnpm test:e2e apps/web

# 커버리지 리포트
pnpm test:coverage apps/web
```

---

## 마일스톤 및 우선순위

### 1차 목표: 핵심 인증 플로우
- [x] Middleware 인증 가드 구현
- [x] 메인 페이지 조건부 리다이렉트
- [x] 게임 페이지 생성

**완료 조건**:
- 모든 RED 테스트 통과
- Middleware가 `/game` 경로 보호 확인
- 리다이렉트 루프 없음

### 2차 목표: 사용자 경험 개선
- [ ] 로딩 스켈레톤 UI
- [ ] 에러 페이지 디자인
- [ ] 익명 사용자 안내 메시지

**완료 조건**:
- 로딩 시간 < 2초
- 사용자 피드백 명확

### 3차 목표: 품질 및 성능
- [ ] 테스트 커버리지 85% 이상
- [ ] 에러 핸들링 완성
- [ ] 성능 최적화 (캐싱, 병렬 로딩)

**완료 조건**:
- TRUST 5원칙 모두 충족
- 성능 지표 달성 (LCP < 2s)

---

## 리스크 및 대응 방안

| 리스크 | 영향도 | 대응 방안 |
|-------|--------|----------|
| 무한 리다이렉트 루프 | Critical | Middleware matcher 정밀 설정, E2E 테스트 강화 |
| 세션 확인 지연 | High | Server Component 캐싱, Suspense 활용 |
| 쿠키 접근 불가 | Medium | 환경변수 검증, 에러 핸들링 추가 |
| 테스트 환경 세션 모킹 | Medium | 테스트 헬퍼 함수 작성, MSW 활용 |

---

## 참고 자료

- **Next.js Middleware 공식 문서**: https://nextjs.org/docs/app/building-your-application/routing/middleware
- **Supabase SSR Guide**: https://supabase.com/docs/guides/auth/server-side/nextjs
- **AUTH-002 SPEC**: `.moai/specs/SPEC-AUTH-002/spec.md`
- **TDD 가이드**: `.moai/memory/development-guide.md`

---

**계획 수립 완료**: 2025-10-11
**예상 우선순위**: 1차 목표 (High) → 2차 목표 (Medium) → 3차 목표 (Low)
