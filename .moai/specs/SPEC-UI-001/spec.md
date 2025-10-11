---
id: UI-001
version: 0.0.1
status: draft
created: 2025-10-11
updated: 2025-10-11
author: "@Goos"
priority: critical

category: feature
labels:
  - ui
  - authentication
  - routing
  - user-experience

depends_on:
  - AUTH-002

related_specs:
  - SETUP-001

blocks:
  - GAME-001
  - PROFILE-001

scope:
  packages:
    - apps/web/src/app
    - apps/web/src/middleware.ts
  files:
    - page.tsx
    - login/page.tsx
    - game/page.tsx
    - middleware.ts
---

# @SPEC:UI-001: 사용자 로그인 플로우 및 인증 가드

## HISTORY

### v0.0.1 (2025-10-11)
- **INITIAL**: 사용자 로그인 플로우 및 인증 가드 명세 최초 작성
- **AUTHOR**: @Goos
- **SCOPE**: 메인 페이지 리다이렉트, Middleware 가드, 게임 페이지 생성
- **CONTEXT**: AUTH-002 완료 후 프론트엔드 플로우 연결 필요
- **MIGRATION**: 정적 메인 페이지 → 동적 인증 기반 라우팅
- **DEPENDS_ON**: @SPEC:AUTH-002 (Supabase Auth 통합)

---

## 1. 개요

### 1.1 목적
Supabase 인증 시스템(AUTH-002)을 프론트엔드 라우팅 및 UI 플로우와 완전히 통합하여, 사용자가 로그인 상태에 따라 적절한 페이지로 자동 이동되도록 보장합니다.

### 1.2 범위

**포함 사항**:
- 메인 페이지(`/`) 조건부 리다이렉트 로직
- Next.js Middleware를 통한 인증 가드
- 게임 페이지(`/game`) 생성 및 보호
- 로그인 페이지(`/login`) 접근 제어
- 세션 기반 자동 리다이렉트

**제외 사항**:
- 실제 게임 로직 구현 (GAME-001에서 처리)
- 사용자 프로필 상세 기능 (PROFILE-001에서 처리)
- 로그아웃 기능 (별도 SPEC)
- OAuth 로그인 UI (AUTH-002 범위)

### 1.3 비즈니스 가치
- **사용자 경험 개선**: 로그인 상태에 따른 즉각적인 리다이렉트로 불필요한 클릭 제거
- **보안 강화**: Middleware 레벨에서 보호 경로 차단
- **개발 효율성**: AUTH-002 API 활용으로 빠른 구현 가능

---

## 2. EARS 요구사항

### 2.1 Environment (환경 및 가정사항)

**시스템 환경**:
- Next.js 14+ App Router 사용
- Supabase Auth 세션 기반 인증 (AUTH-002)
- Server Components 및 Middleware 활용
- 클라이언트 사이드 네비게이션 지원

**가정사항**:
- `@supabase/ssr` 패키지가 설치되어 있음 (AUTH-002 완료)
- 환경변수 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정됨
- 사용자 세션은 쿠키에 저장됨

### 2.2 Assumptions (전제 조건)

1. **AUTH-002 완료**: Supabase Auth 통합이 완료되어 `createServerClient`, `createBrowserClient` 함수 사용 가능
2. **로그인 페이지 존재**: `apps/web/src/app/login/page.tsx`가 이미 구현되어 있음
3. **세션 확인 가능**: `supabase.auth.getSession()` 호출로 로그인 상태 확인 가능
4. **Next.js 라우팅**: App Router 기반 파일 시스템 라우팅 사용

### 2.3 Requirements (기능 요구사항)

#### Ubiquitous (항상 제공)
- **R-UI-001**: 시스템은 모든 페이지에서 사용자 세션 상태를 확인해야 한다.
- **R-UI-002**: 시스템은 보호된 경로(`/game`)에 대한 접근 제어를 제공해야 한다.
- **R-UI-003**: 시스템은 로그인 페이지(`/login`)에서 이미 로그인된 사용자를 리다이렉트해야 한다.

#### Event-driven (특정 이벤트 발생 시)
- **R-UI-004**: WHEN 비로그인 사용자가 메인 페이지(`/`)에 접속하면, 시스템은 로그인 CTA를 표시해야 한다.
- **R-UI-005**: WHEN 로그인된 사용자가 메인 페이지(`/`)에 접속하면, 시스템은 `/game` 페이지로 자동 리다이렉트해야 한다.
- **R-UI-006**: WHEN 비로그인 사용자가 `/game` 경로에 접근하면, Middleware는 `/login`으로 리다이렉트해야 한다.
- **R-UI-007**: WHEN 로그인된 사용자가 `/login` 경로에 접근하면, Middleware는 `/game`으로 리다이렉트해야 한다.

#### State-driven (특정 상태에서)
- **R-UI-008**: WHILE 사용자가 로그인된 상태일 때, `/game` 페이지는 사용자 정보를 표시해야 한다.
- **R-UI-009**: WHILE 세션이 만료된 상태일 때, 시스템은 자동으로 로그인 페이지로 리다이렉트해야 한다.

#### Optional (선택적 기능)
- **R-UI-010**: WHERE 사용자가 익명 로그인(Anonymous Auth)을 사용한 경우, 시스템은 제한된 게임 기능을 제공할 수 있다.

#### Constraints (제약사항)
- **C-UI-001**: IF 리다이렉트가 발생하면, 시스템은 무한 루프를 방지해야 한다.
- **C-UI-002**: IF 세션 확인 중 오류가 발생하면, 시스템은 안전하게 로그아웃 상태로 처리해야 한다.
- **C-UI-003**: 모든 리다이렉트는 Next.js `redirect()` 또는 `NextResponse.redirect()` 함수를 사용해야 한다.

---

## 3. 상세 명세

### 3.1 UI 플로우

#### 3.1.1 메인 페이지 (`/`) 플로우

```
사용자 접속
    ↓
세션 확인 (Server Component)
    ↓
로그인 여부?
    ├─ Yes → redirect('/game')
    └─ No  → 로그인 CTA 표시
```

**구현 포인트**:
- `apps/web/src/app/page.tsx`에서 Server Component로 세션 확인
- `supabase.auth.getSession()` 사용
- 로그인된 경우 `redirect('/game')` 호출
- 비로그인 시 정적 랜딩 페이지 렌더링

#### 3.1.2 Middleware 인증 가드

```
사용자 요청
    ↓
Middleware 실행
    ↓
보호 경로? (/game)
    ├─ Yes → 세션 확인
    │         ├─ 로그인 O → 통과
    │         └─ 로그인 X → redirect('/login')
    └─ No  → 통과
```

**구현 포인트**:
- `apps/web/src/middleware.ts` 생성
- `matcher` 설정: `/game/:path*`
- `createServerClient` (SSR 패키지) 사용
- 세션 없으면 `NextResponse.redirect(new URL('/login', request.url))`

#### 3.1.3 로그인 페이지 역리다이렉트

```
로그인된 사용자가 /login 접속
    ↓
Middleware 세션 확인
    ↓
로그인 상태?
    ├─ Yes → redirect('/game')
    └─ No  → 로그인 페이지 표시
```

#### 3.1.4 게임 페이지 (`/game`)

```
인증 통과
    ↓
게임 페이지 렌더링
    ↓
사용자 정보 표시
    - 이메일
    - 프로필 이미지
    - "게임 시작" 버튼
```

### 3.2 기술 구현

#### 3.2.1 디렉토리 구조

```
apps/web/src/
├── app/
│   ├── page.tsx              # 메인 페이지 (조건부 리다이렉트)
│   ├── login/
│   │   └── page.tsx          # 로그인 페이지 (기존)
│   └── game/
│       └── page.tsx          # 🆕 게임 페이지
└── middleware.ts             # 🆕 인증 가드
```

#### 3.2.2 Middleware 명세

**파일**: `apps/web/src/middleware.ts`

```typescript
// @CODE:UI-001:INFRA | SPEC: SPEC-UI-001.md | TEST: tests/middleware.test.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Supabase 클라이언트 생성
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.delete({ name, ...options });
        },
      },
    }
  );

  // 세션 확인
  const { data: { session } } = await supabase.auth.getSession();

  // 보호 경로 (/game) 접근 시 인증 확인
  if (request.nextUrl.pathname.startsWith('/game')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 로그인 페이지에 이미 로그인된 사용자 접근 시
  if (request.nextUrl.pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/game', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/game/:path*', '/login'],
};
```

#### 3.2.3 메인 페이지 수정

**파일**: `apps/web/src/app/page.tsx`

```typescript
// @CODE:UI-001:UI | SPEC: SPEC-UI-001.md | TEST: tests/pages/main.test.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  // 세션 확인 (Server Component)
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // 로그인된 사용자는 게임 페이지로 리다이렉트
  if (session) {
    redirect('/game');
  }

  // 비로그인 사용자에게 로그인 CTA 표시
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8">라이어 게임</h1>
      <div className="flex gap-4">
        <a
          href="/login"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          로그인하기
        </a>
        <a
          href="/login?mode=anonymous"
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          게스트로 플레이
        </a>
      </div>
    </main>
  );
}
```

#### 3.2.4 게임 페이지 생성

**파일**: `apps/web/src/app/game/page.tsx`

```typescript
// @CODE:UI-001:UI | SPEC: SPEC-UI-001.md | TEST: tests/pages/game.test.tsx
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function GamePage() {
  // 세션 확인 (Middleware에서 이미 보호됨)
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">게임 대기실</h1>
      <div className="mb-8">
        <p className="text-gray-600">
          환영합니다, {user?.email || '게스트'}님!
        </p>
      </div>
      <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
        게임 시작하기
      </button>
    </main>
  );
}
```

### 3.3 에러 핸들링

**세션 확인 실패**:
```typescript
try {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Session check failed:', error);
    // 안전하게 로그아웃 상태로 처리
    return null;
  }
  return data.session;
} catch (error) {
  console.error('Unexpected error:', error);
  return null;
}
```

**무한 리다이렉트 방지**:
- Middleware `matcher`에서 명시적으로 경로 지정
- `/login` → `/game` → `/login` 루프 방지 로직

---

## 4. Traceability (@TAG 체인)

### 4.1 의존성 체인

```
@SPEC:UI-001
    ├─ depends_on: @SPEC:AUTH-002 (Supabase Auth)
    └─ blocks: @SPEC:GAME-001 (게임 로직)
               @SPEC:PROFILE-001 (프로필 UI)
```

### 4.2 TAG 위치

- **@SPEC:UI-001**: `.moai/specs/SPEC-UI-001/spec.md` (본 문서)
- **@TEST:UI-001**:
  - `apps/web/tests/middleware.test.ts` (Middleware 테스트)
  - `apps/web/tests/pages/main.test.tsx` (메인 페이지 테스트)
  - `apps/web/tests/pages/game.test.tsx` (게임 페이지 테스트)
- **@CODE:UI-001**:
  - `apps/web/src/middleware.ts` (@CODE:UI-001:INFRA)
  - `apps/web/src/app/page.tsx` (@CODE:UI-001:UI)
  - `apps/web/src/app/game/page.tsx` (@CODE:UI-001:UI)
- **@DOC:UI-001**: (문서 동기화 시 자동 생성)

---

## 5. 검증 및 인수 기준

### 5.1 기능 검증

| ID | 검증 항목 | 방법 | 예상 결과 |
|----|----------|------|----------|
| V-UI-001 | 비로그인 사용자 메인 페이지 접속 | 시크릿 모드로 `/` 접속 | 로그인 CTA 표시 |
| V-UI-002 | 로그인 사용자 메인 페이지 리다이렉트 | 로그인 후 `/` 접속 | `/game`으로 자동 이동 |
| V-UI-003 | 비로그인 사용자 게임 페이지 차단 | `/game` 직접 접속 | `/login`으로 리다이렉트 |
| V-UI-004 | 로그인 사용자 로그인 페이지 차단 | 로그인 후 `/login` 접속 | `/game`으로 리다이렉트 |
| V-UI-005 | 게임 페이지 사용자 정보 표시 | 로그인 후 게임 페이지 확인 | 이메일 표시 |

### 5.2 성능 기준

- 세션 확인 응답 시간: < 200ms
- 리다이렉트 완료 시간: < 1초
- 페이지 로딩 시간: < 2초 (LCP)

### 5.3 보안 검증

- [ ] 세션 토큰이 클라이언트에 노출되지 않음
- [ ] Middleware가 모든 `/game` 하위 경로를 보호함
- [ ] 세션 만료 시 자동 로그아웃 처리

### 5.4 인수 테스트 시나리오

**시나리오 1**: 신규 사용자 첫 방문
1. 브라우저 시크릿 모드로 앱 접속
2. 메인 페이지에서 "로그인하기" 버튼 클릭
3. 로그인 완료 후 자동으로 `/game` 이동 확인

**시나리오 2**: 기존 사용자 재방문
1. 로그인된 상태로 앱 접속
2. 메인 페이지 대신 바로 `/game` 페이지 표시 확인
3. 사용자 정보 올바르게 표시 확인

**시나리오 3**: 비로그인 사용자 보호 경로 접근 시도
1. 로그아웃 상태에서 브라우저에 `/game` URL 직접 입력
2. `/login` 페이지로 리다이렉트 확인
3. 로그인 후 `/game` 접근 가능 확인

---

## 6. 참고 자료

- **Supabase SSR Docs**: https://supabase.com/docs/guides/auth/server-side/nextjs
- **Next.js Middleware**: https://nextjs.org/docs/app/building-your-application/routing/middleware
- **AUTH-002 SPEC**: `.moai/specs/SPEC-AUTH-002/spec.md`
- **development-guide.md**: `.moai/memory/development-guide.md` (TAG 규칙)

---

## 7. 제약 및 리스크

### 7.1 기술적 제약
- Next.js 14+ App Router 필수
- Supabase Auth 쿠키 기반 세션 의존
- Server Components 렌더링 시간 증가 가능

### 7.2 리스크
| 리스크 | 영향도 | 완화 방안 |
|-------|--------|----------|
| 무한 리다이렉트 루프 | High | Middleware matcher 정밀 설정, 테스트 강화 |
| 세션 확인 지연 | Medium | 서버 컴포넌트 캐싱, Suspense 활용 |
| 세션 만료 처리 누락 | Medium | 에러 핸들링 강화, 자동 로그아웃 |

### 7.3 향후 확장 고려사항
- 로딩 스켈레톤 UI 추가
- 세션 갱신 로직 (Refresh Token)
- 역할 기반 접근 제어 (RBAC)
- 소셜 로그인 후 리다이렉트 처리

---

**문서 끝**
