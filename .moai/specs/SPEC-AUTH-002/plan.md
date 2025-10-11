# @SPEC:AUTH-002 구현 계획

## Phase 1: 기반 구축

### 1.1 Supabase 프로젝트 생성
- [ ] https://supabase.com 계정 생성
- [ ] 새 프로젝트 생성: "liar-game"
- [ ] Database 비밀번호 설정
- [ ] Project URL 및 API Key 복사

### 1.2 Google OAuth 설정
- [ ] Google Cloud Console 접속
- [ ] OAuth 2.0 클라이언트 ID 생성
  - 애플리케이션 유형: 웹 애플리케이션
  - 승인된 리디렉션 URI: `https://<project-id>.supabase.co/auth/v1/callback`
- [ ] Client ID/Secret 복사
- [ ] Supabase Dashboard → Authentication → Providers → Google 설정

### 1.3 Kakao OAuth 설정
- [ ] Kakao Developers 접속 (https://developers.kakao.com)
- [ ] 앱 생성: "라이어 게임"
- [ ] 플랫폼 설정 → Web → 사이트 도메인 등록
- [ ] Redirect URI 등록: `https://<project-id>.supabase.co/auth/v1/callback`
- [ ] REST API Key 복사
- [ ] Supabase Dashboard → Authentication → Providers → Kakao 설정

### 1.4 환경 변수 설정
```bash
# .env.local (프론트엔드)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# .env (백엔드)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Phase 2: 백엔드 마이그레이션

### 2.1 Supabase 클라이언트 설정
- [ ] `pnpm add @supabase/supabase-js` (apps/api)
- [ ] `apps/api/src/auth/supabase-auth.service.ts` 생성
- [ ] Supabase 클라이언트 초기화

### 2.2 기존 코드 제거
- [ ] `auth.service.ts` - JWT 발급 로직 제거
- [ ] `jwt.strategy.ts` - Passport JWT 전략 제거
- [ ] `bcrypt` 관련 코드 제거 (비밀번호 해싱 불필요)

### 2.3 새 인증 가드 구현
- [ ] `supabase-jwt.guard.ts` 생성
- [ ] `SupabaseJwtGuard` 구현 (Supabase JWT 검증)
- [ ] 기존 `JwtAuthGuard` → `SupabaseJwtGuard` 교체

### 2.4 API 엔드포인트 수정
- [ ] `GET /api/auth/session` - 현재 세션 조회
- [ ] `POST /api/auth/logout` - Supabase 세션 무효화
- [ ] `GET /api/auth/profile` - 사용자 프로필 조회
- [ ] 불필요한 엔드포인트 제거 (register, login, refresh)

### 2.5 Redis 세션 처리 (선택)
- [ ] 옵션 A: Redis 완전 제거 (Supabase Session으로 통일)
- [ ] 옵션 B: Redis를 캐싱 목적으로만 유지 (게임 상태 캐싱)

---

## Phase 3: 프론트엔드 구현

### 3.1 Supabase 클라이언트 설정
- [ ] `pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs` (apps/web)
- [ ] `apps/web/src/lib/supabase.ts` 생성
- [ ] Supabase 클라이언트 초기화

### 3.2 로그인 페이지 재작성
- [ ] `app/login/page.tsx` 수정
- [ ] "Google로 시작" 버튼 구현
- [ ] "Kakao로 시작" 버튼 구현
- [ ] "게스트로 시작" 버튼 구현 (Anonymous Auth)

### 3.3 OAuth 콜백 핸들러
- [ ] `app/auth/callback/route.ts` 생성
- [ ] OAuth 코드 교환 처리
- [ ] 프로필 페이지로 리다이렉트

### 3.4 인증 상태 관리
- [ ] `hooks/useAuth.ts` 수정 (Supabase SDK 사용)
- [ ] 로그인 상태 확인: `supabase.auth.getSession()`
- [ ] 자동 토큰 갱신 설정

---

## Phase 4: 데이터베이스 마이그레이션

### 4.1 Supabase DB 스키마 생성
- [ ] Supabase SQL Editor 접속
- [ ] `profiles` 테이블 생성
- [ ] RLS 정책 설정 (자신의 프로필만 수정 가능)

### 4.2 기존 사용자 마이그레이션 (선택)
- [ ] 기존 users 테이블 백업
- [ ] Supabase auth.users 매핑 스크립트 작성
- [ ] 마이그레이션 실행 (기존 사용자 → Supabase)

---

## Phase 5: 테스트 및 검증

### 5.1 단위 테스트 작성
- [ ] `supabase-auth.service.spec.ts` - JWT 검증 테스트
- [ ] `supabase-jwt.guard.spec.ts` - 가드 테스트

### 5.2 E2E 테스트 작성
- [ ] `tests/auth/google-oauth.e2e.ts` - Google OAuth 플로우
- [ ] `tests/auth/kakao-oauth.e2e.ts` - Kakao OAuth 플로우
- [ ] `tests/auth/anonymous.e2e.ts` - Anonymous Auth 플로우

### 5.3 수동 테스트
- [ ] Google 로그인 → 프로필 확인
- [ ] Kakao 로그인 → 프로필 확인
- [ ] 게스트 로그인 → 게임 입장
- [ ] Anonymous → Google 연동 → 데이터 유지 확인

---

## 리스크 및 완화 방안

| 리스크 | 영향 | 확률 | 완화 방안 |
|--------|------|------|----------|
| Supabase 프로젝트 생성 실패 | 높음 | 낮음 | 무료 티어 제한 확인 |
| OAuth 설정 오류 | 높음 | 중간 | 공식 문서 참조, Redirect URI 정확히 입력 |
| 기존 사용자 마이그레이션 실패 | 중간 | 중간 | 백업 필수, 단계적 마이그레이션 |
| RLS 정책 오류 | 높음 | 낮음 | 테스트 환경에서 충분히 검증 |
| Anonymous → Social 전환 실패 | 중간 | 낮음 | Supabase 공식 가이드 참조 |

---

## 기술 스택

### 백엔드
- **인증**: Supabase Auth SDK
- **프레임워크**: NestJS 11.x + Fastify
- **DB**: PostgreSQL 16.x (Supabase 또는 기존 INFRA-001)

### 프론트엔드
- **프레임워크**: Next.js 15.x (App Router)
- **인증 클라이언트**: @supabase/auth-helpers-nextjs
- **상태 관리**: Supabase Session (자동)

### OAuth 프로바이더
- **Google**: OAuth 2.0 (GCP Console)
- **Kakao**: REST API OAuth 2.0
- **Anonymous**: Supabase Anonymous Auth

---

## 마일스톤

### 1차 목표: 기반 구축 (우선순위: Critical)
- Supabase 프로젝트 생성 및 OAuth 설정
- 환경 변수 설정 완료
- 의존성: 없음

### 2차 목표: 백엔드 마이그레이션 (우선순위: High)
- Supabase Auth 서비스 구현
- 기존 JWT 시스템 제거
- 의존성: 1차 목표 완료

### 3차 목표: 프론트엔드 구현 (우선순위: High)
- 로그인 페이지 재작성
- OAuth 콜백 핸들러 구현
- 의존성: 1차 목표 완료

### 4차 목표: DB 마이그레이션 (우선순위: Medium)
- profiles 테이블 생성
- RLS 정책 설정
- 의존성: 2차 목표 완료

### 최종 목표: 테스트 및 검증 (우선순위: High)
- 단위 테스트 + E2E 테스트 작성
- 수동 테스트 완료
- 의존성: 2차, 3차, 4차 목표 완료

---

## 참고 문서

- [Supabase Auth 공식 문서](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 가이드](https://developers.google.com/identity/protocols/oauth2)
- [Kakao Login REST API](https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api)
- [Next.js 15 App Router 인증](https://nextjs.org/docs/app/building-your-application/authentication)
