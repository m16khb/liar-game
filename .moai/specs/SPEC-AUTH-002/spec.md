---
id: AUTH-002
version: 0.1.0
status: completed
created: 2025-10-11
updated: 2025-10-11
author: @Goos
priority: high

category: feature
labels:
  - authentication
  - oauth
  - supabase
  - google
  - kakao
  - social-login

depends_on:
  - INFRA-001

related_specs:
  - AUTH-001

scope:
  packages:
    - apps/api/src/auth
    - apps/web/src/lib
    - apps/web/src/app/login
    - packages/types/src/auth.ts
  files:
    - supabase-auth.service.ts
    - supabase-jwt.guard.ts
    - supabase.ts
    - login/page.tsx
    - auth/callback/route.ts
---

# @SPEC:AUTH-002: Supabase 소셜 로그인 통합 (Google, Kakao) + Anonymous Auth

## HISTORY

### v0.1.0 (2025-10-11)
- **COMPLETED**: TDD 구현 완료 (RED → GREEN → REFACTOR)
- **SCOPE**: Supabase OAuth, Anonymous Auth, JWT 검증
- **TESTS**: 4개 테스트 파일 작성
  - tests/auth/supabase-oauth.test.ts (Google/GitHub/Discord OAuth)
  - tests/auth/anonymous.test.ts (Anonymous Auth)
  - tests/auth/jwt-validation.test.ts (JWT 검증)
  - tests/auth/profile-sync.test.ts (프로필 동기화)
- **CODE**: 7개 구현 파일 완료
  - apps/api/src/auth/supabase-auth.service.ts
  - apps/api/src/auth/supabase-jwt.guard.ts
  - apps/api/src/auth/supabase-auth.controller.ts
  - apps/web/src/lib/supabase.ts
  - apps/web/src/app/login/page.tsx
  - apps/web/src/app/auth/callback/route.ts
  - packages/types/src/supabase-auth.ts
- **AUTHOR**: @Goos

### v0.0.1 (2025-10-11)
- **INITIAL**: Supabase 소셜 로그인 통합 명세 최초 작성
- **AUTHOR**: @Goos
- **SCOPE**: Google/Kakao OAuth, Anonymous Auth, JWT 시스템 제거
- **CONTEXT**: 빠른 진입 UX를 위한 소셜 로그인 중심 아키텍처 전환
- **MIGRATION**: AUTH-001 (JWT) → AUTH-002 (Supabase Auth)

---

## 1. 개요

### 1.1 목적
라이어 게임의 제로 프릭션 진입을 위해 Supabase Auth 기반 소셜 로그인 시스템을 구축합니다.
기존 JWT 인증 시스템을 제거하고, Google/Kakao OAuth와 Anonymous Auth로 통일하여
사용자 경험을 극대화합니다.

### 1.2 범위
- **Supabase Auth 통합**: OAuth 프로바이더 자동 처리
- **Google OAuth 2.0**: Google 계정 소셜 로그인
- **Kakao OAuth 2.0**: Kakao 계정 소셜 로그인
- **Anonymous Auth**: 게스트 로그인 (기존 게스트 인증 대체)
- **JWT 자동 발급**: Supabase가 자동으로 JWT 발급 및 갱신
- **세션 관리**: Supabase Session (Redis 선택적 유지)
- **프로필 동기화**: OAuth 프로필 → PostgreSQL/Supabase DB

### 1.3 제외사항
- **이메일+비밀번호 로그인**: 소셜 로그인으로 통일
- **기존 JWT 시스템**: Supabase JWT로 대체
- **Redis 세션**: Supabase Session으로 대체 (선택적 캐싱 유지 가능)
- **Discord OAuth**: 별도 SPEC (AUTH-003)
- **Apple Sign-In**: 별도 SPEC (AUTH-004)

---

## 2. EARS 요구사항

### 2.1 Environment (환경)
- Supabase 프로젝트 (무료 티어)
- Google Cloud Console (OAuth 2.0 클라이언트)
- Kakao Developers (OAuth 앱)
- NestJS 11.x + Fastify
- Next.js 15.x (App Router)
- PostgreSQL 16.x (Supabase 관리형 또는 기존 INFRA-001)

### 2.2 Assumptions (가정)
1. 사용자의 95%가 Google 또는 Kakao 계정 보유
2. 소셜 로그인 전환율이 이메일 로그인보다 3배 높음
3. OAuth 프로바이더 장애는 드물며, 다중 프로바이더로 완화 가능
4. 게스트 사용자는 Anonymous Auth로 충분히 대체 가능

### 2.3 Requirements (EARS 구조)

#### 2.3.1 Ubiquitous (기본 요구사항)

**REQ-001**: 시스템은 Supabase Auth SDK로 인증을 처리해야 한다
- **근거**: OAuth 자동화, 토큰 관리 자동화, Revoke 자동 지원
- **검증**: `@supabase/supabase-js` 패키지 설치 및 초기화

**REQ-002**: 시스템은 Google OAuth 로그인을 제공해야 한다
- **근거**: 국내 Gmail 사용률 70% 이상
- **검증**: "Google로 시작" 버튼 → Google OAuth 화면 → 콜백 성공

**REQ-003**: 시스템은 Kakao OAuth 로그인을 제공해야 한다
- **근거**: 국내 카카오톡 MAU 4,700만 (95% 보급률)
- **검증**: "Kakao로 시작" 버튼 → Kakao OAuth 화면 → 콜백 성공

**REQ-004**: 시스템은 Anonymous Auth를 제공해야 한다
- **근거**: 제로 프릭션 진입 (기존 게스트 인증 대체)
- **검증**: "게스트로 시작" 버튼 → 즉시 게임 입장 (닉네임 입력 불필요)

**REQ-005**: 시스템은 Supabase JWT를 자동 발급해야 한다
- **근거**: 기존 JWT 시스템 제거, Supabase 자동 관리
- **검증**: 로그인 후 `session.access_token` 존재 확인

#### 2.3.2 Event-driven (이벤트 기반)

**REQ-006**: WHEN 사용자가 소셜 로그인 버튼을 클릭하면, 시스템은 OAuth 인증 페이지로 리다이렉트해야 한다
- **조건**: Google/Kakao 버튼 클릭
- **동작**: Supabase SDK가 OAuth URL 생성 → 새 창 또는 리다이렉트
- **검증**: OAuth 동의 화면 표시

**REQ-007**: WHEN OAuth 콜백이 수신되면, 시스템은 사용자 정보를 가져오고 JWT를 발급해야 한다
- **조건**: `/auth/callback?code=xxx` 콜백 수신
- **동작**: Supabase가 자동으로 사용자 생성/로그인 → JWT 발급
- **검증**: `supabase.auth.getSession()` 성공, 사용자 프로필 조회 가능

**REQ-008**: WHEN 소셜 계정 이메일이 기존 계정과 일치하면, 시스템은 자동으로 연동해야 한다
- **조건**: 같은 이메일로 다른 프로바이더 로그인 시도
- **동작**: Supabase가 자동으로 동일 사용자 인식 (이메일 기준)
- **검증**: 두 프로바이더로 로그인 시 동일한 `user.id` 반환

**REQ-009**: WHEN JWT가 만료되면, 시스템은 자동으로 갱신해야 한다
- **조건**: Access Token 만료 (Supabase 기본: 1시간)
- **동작**: Supabase SDK가 Refresh Token으로 자동 갱신
- **검증**: 만료 5분 전 자동 갱신, 사용자 재로그인 불필요

#### 2.3.3 State-driven (상태 기반)

**REQ-010**: WHILE 로그인 상태일 때, 시스템은 모든 API 요청에 JWT를 첨부해야 한다
- **상태**: `supabase.auth.getSession()` 성공
- **동작**: Authorization 헤더 자동 첨부
- **검증**: API 요청 헤더에 `Bearer <supabase_jwt>` 존재

**REQ-011**: WHILE Anonymous 상태일 때, 시스템은 소셜 계정 연동을 제안해야 한다
- **상태**: `user.is_anonymous === true`
- **동작**: 게임 종료 후 "진행 상황 저장하려면 로그인하세요" 메시지
- **검증**: Anonymous → Google/Kakao 연동 시 진행 상황 유지

#### 2.3.4 Constraints (제약사항)

**CON-001**: OAuth 리다이렉트 URL은 Supabase/GCP/Kakao에 등록되어야 한다
- **화이트리스트**:
  - 개발: `http://localhost:3000/auth/callback`
  - 프로덕션: `https://liar-game.com/auth/callback`

**CON-002**: Supabase JWT는 Row Level Security (RLS)로 권한을 제어해야 한다
- **이유**: 수동 권한 검증 제거, DB 레벨 보안
- **구현**: PostgreSQL 정책 설정 (예: 자신의 프로필만 수정 가능)

**CON-003**: Anonymous 사용자는 프로필 정보를 최소화해야 한다
- **이유**: GDPR 준수, 익명성 보장
- **제한**: 닉네임, 게임 히스토리만 저장 (이메일, 프로필 사진 없음)

**CON-004**: OAuth 프로바이더 장애 시 다른 프로바이더를 제안해야 한다
- **이유**: 단일 장애점 방지
- **구현**: "Google 로그인 실패 시 Kakao를 시도해보세요" 메시지

---

## 3. 상세 명세 (Specifications)

### 3.1 데이터 모델

#### 옵션 A: Supabase DB 사용 (추천)

```sql
-- Supabase는 auth.users 자동 제공
-- 커스텀 프로필: public.profiles 테이블

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  profile_picture_url TEXT,
  level INT DEFAULT 1,
  oauth_provider VARCHAR(20), -- 'google', 'kakao', 'anonymous'
  last_login TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### 옵션 B: 기존 PostgreSQL 연동

```sql
-- 기존 users 테이블에 Supabase 연동
ALTER TABLE users ADD COLUMN supabase_user_id UUID UNIQUE;
ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(20);
ALTER TABLE users DROP COLUMN password_hash; -- 비밀번호 제거
```

### 3.2 API 설계

#### NestJS 엔드포인트 (최소화)

1. `GET /api/auth/session` - 현재 세션 조회 (Supabase JWT 검증)
2. `POST /api/auth/logout` - 로그아웃 (Supabase 세션 무효화)
3. `GET /api/auth/profile` - 사용자 프로필 조회

**제거된 엔드포인트** (Supabase가 처리):
- ❌ `/api/auth/register` - Supabase 자동 처리
- ❌ `/api/auth/login` - Supabase 자동 처리
- ❌ `/api/auth/refresh` - Supabase SDK 자동 갱신
- ❌ `/api/auth/guest` - Supabase Anonymous로 대체

#### 프론트엔드 플로우

**로그인 페이지** (`apps/web/src/app/login/page.tsx`):
```typescript
'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) console.error('Google login failed:', error);
  };

  const handleKakaoLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) console.error('Kakao login failed:', error);
  };

  const handleGuestLogin = async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (!error) {
      router.push('/game');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-8">
      <button onClick={handleGoogleLogin} className="btn-google">
        Google로 시작
      </button>
      <button onClick={handleKakaoLogin} className="btn-kakao">
        Kakao로 시작
      </button>
      <button onClick={handleGuestLogin} className="btn-guest">
        게스트로 시작
      </button>
    </div>
  );
}
```

**OAuth 콜백 처리** (`apps/web/src/app/auth/callback/route.ts`):
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${requestUrl.origin}/game`);
}
```

### 3.3 NestJS 통합

**supabase-auth.service.ts**:
```typescript
import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY // 서버용 키
    );
  }

  async verifyToken(token: string) {
    const { data: { user }, error } = await this.supabase.auth.getUser(token);
    if (error) throw new UnauthorizedException('Invalid token');
    return user;
  }

  async getUserProfile(userId: string) {
    const { data } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data;
  }

  async signOut(token: string) {
    await this.supabase.auth.admin.signOut(token);
  }
}
```

**supabase-jwt.guard.ts**:
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { SupabaseAuthService } from './supabase-auth.service';

@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  constructor(private authService: SupabaseAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) return false;

    try {
      const user = await this.authService.verifyToken(token);
      request.user = user;
      return true;
    } catch {
      return false;
    }
  }
}
```

### 3.4 보안 설계

1. **CSRF 방어**: Supabase가 자동으로 `state` 매개변수 생성 및 검증
2. **PKCE 지원**: Kakao OAuth PKCE 자동 처리
3. **JWT 검증**: Supabase가 서명 검증 자동 처리
4. **Row Level Security (RLS)**: PostgreSQL 정책으로 권한 자동 제어
5. **Anonymous → Social 전환**: `supabase.auth.updateUser()` 또는 `linkIdentity()`

### 3.5 마이그레이션 계획

**Phase 1: Supabase 설정** (30분)
- Supabase 프로젝트 생성
- Google OAuth 설정 (GCP Console)
- Kakao OAuth 설정 (Kakao Developers)

**Phase 2: 백엔드 마이그레이션** (4시간)
- 기존 auth.service.ts → supabase-auth.service.ts 재작성
- jwt.strategy.ts 제거
- session.service.ts 수정 (Redis 선택적 유지)
- supabase-jwt.guard.ts 추가

**Phase 3: 프론트엔드 마이그레이션** (2시간)
- lib/supabase.ts 추가
- 로그인 페이지 재작성
- OAuth 콜백 핸들러 추가

**Phase 4: 테스트 재작성** (3시간)
- AUTH-001 테스트 37개 → AUTH-002 새 테스트
- E2E 테스트: OAuth 플로우

**Phase 5: DB 마이그레이션** (1시간)
- 기존 users → Supabase auth.users 매핑
- profiles 테이블 생성
- RLS 정책 설정

**총 예상 시간**: 10.5시간

---

## 4. Traceability (추적성)

### TAG 체인
- **@SPEC:AUTH-002**: 이 문서
- **@TEST:AUTH-002**: TDD 단계에서 작성 예정
  - `tests/auth/supabase-oauth.test.ts` - OAuth 플로우 테스트
  - `tests/auth/anonymous.test.ts` - Anonymous Auth 테스트
  - `tests/auth/profile-sync.test.ts` - 프로필 동기화 테스트
- **@CODE:AUTH-002**: TDD 구현 단계에서 작성 예정
  - `apps/api/src/auth/supabase-auth.service.ts`
  - `apps/api/src/auth/supabase-jwt.guard.ts`
  - `apps/web/src/lib/supabase.ts`
  - `apps/web/src/app/login/page.tsx`
  - `apps/web/src/app/auth/callback/route.ts`
- **@DOC:AUTH-002**: 문서 동기화 단계에서 작성 예정
  - `docs/api/supabase-auth.md` - Supabase Auth 가이드
  - `docs/migration/auth-v1-to-v2.md` - 마이그레이션 가이드

---

## 5. 검증 및 인수 기준

### 핵심 검증 항목
1. ✅ Google OAuth 로그인 성공률 ≥95%
2. ✅ Kakao OAuth 로그인 성공률 ≥95%
3. ✅ Anonymous Auth 생성 시간 <100ms
4. ✅ OAuth 콜백 처리 시간 <500ms
5. ✅ JWT 자동 갱신 실패율 <0.1%
6. ✅ 소셜 계정 연동 성공률 ≥98%
7. ✅ RLS 정책 100% 통과 (권한 테스트)
8. ✅ Anonymous → Social 전환 시 데이터 100% 유지

---

## 6. 다음 단계

1. **TDD 구현** (`/alfred:2-build SPEC-AUTH-002`)
   - RED: Supabase OAuth 테스트 작성
   - GREEN: 최소 구현 (supabase-auth.service)
   - REFACTOR: 코드 품질 개선

2. **문서 동기화** (`/alfred:3-sync`)
   - Living Document 업데이트
   - TAG 체인 검증
   - 마이그레이션 가이드 작성

3. **후속 SPEC 작성**
   - AUTH-003: Discord OAuth 추가
   - AUTH-004: Apple Sign-In 추가
