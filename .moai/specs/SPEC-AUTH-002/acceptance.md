# @SPEC:AUTH-002 인수 기준

## 시나리오 1: Google OAuth 로그인

### AC-001: 신규 사용자 Google 로그인
**Given**: 신규 사용자가 로그인 페이지에 접속했다
**When**: "Google로 시작" 버튼을 클릭한다
**Then**:
- Google OAuth 동의 화면이 표시된다
- 사용자가 권한 승인 후 게임 페이지로 리다이렉트된다
- Supabase `auth.users` 테이블에 새 사용자 생성된다
- `profiles` 테이블에 프로필이 생성된다 (Google 이름, 프로필 사진)
- JWT가 localStorage에 저장된다

### AC-002: 기존 사용자 Google 로그인
**Given**: 이미 Google로 가입한 사용자가 로그아웃 상태다
**When**: "Google로 시작" 버튼을 클릭하고 동일한 Google 계정으로 로그인한다
**Then**:
- 기존 사용자 프로필이 로드된다 (레벨, 게임 히스토리 유지)
- 새 JWT가 발급된다
- 게임 페이지로 즉시 리다이렉트된다

---

## 시나리오 2: Kakao OAuth 로그인

### AC-003: Kakao 로그인 성공
**Given**: 사용자가 로그인 페이지에 있다
**When**: "Kakao로 시작" 버튼을 클릭한다
**Then**:
- Kakao OAuth 동의 화면이 표시된다
- 권한 승인 후 프로필 생성 (Kakao 닉네임, 프로필 사진)
- JWT 발급 및 게임 페이지 진입

### AC-004: 이메일 중복 처리
**Given**: 사용자가 Google로 `user@example.com`으로 가입했다
**When**: 동일한 이메일로 Kakao 로그인을 시도한다
**Then**:
- Supabase가 동일한 사용자로 인식한다 (이메일 기준)
- 기존 프로필에 Kakao 정보가 추가된다
- Google/Kakao 둘 다로 로그인 가능하다

---

## 시나리오 3: Anonymous Auth (게스트)

### AC-005: 게스트 로그인
**Given**: 사용자가 소셜 계정 연동을 원하지 않는다
**When**: "게스트로 시작" 버튼을 클릭한다
**Then**:
- 즉시 게임 페이지로 진입한다 (OAuth 화면 없음)
- Supabase Anonymous Auth 세션 생성된다
- `profiles` 테이블에 익명 프로필 생성 (랜덤 닉네임)
- 게임 플레이 가능 (레벨, 히스토리 저장)

### AC-006: Anonymous → Google 전환
**Given**: 게스트로 10게임을 플레이했다 (레벨 5)
**When**: 게임 종료 후 "진행 상황 저장" 버튼 → Google 로그인
**Then**:
- 기존 게스트 데이터가 Google 계정에 연동된다
- 레벨 5, 10게임 히스토리 유지된다
- 다음 로그인부터 Google 계정으로 접속 가능

---

## 시나리오 4: JWT 자동 갱신

### AC-007: Access Token 만료 시 자동 갱신
**Given**: 사용자가 로그인한 지 55분이 지났다 (Access Token 만료 5분 전)
**When**: 게임 API 요청을 보낸다
**Then**:
- Supabase SDK가 자동으로 Refresh Token으로 갱신한다
- 새 Access Token이 발급된다
- API 요청이 중단 없이 성공한다
- 사용자는 재로그인할 필요가 없다

### AC-008: Refresh Token 만료 시 재로그인
**Given**: 사용자가 7일간 접속하지 않았다 (Refresh Token 만료)
**When**: 앱에 접속한다
**Then**:
- 로그인 페이지로 리다이렉트된다
- "세션이 만료되었습니다. 다시 로그인해주세요" 메시지 표시
- 재로그인 후 정상 접속

---

## 시나리오 5: 로그아웃 및 Revoke

### AC-009: 로그아웃 시 Supabase 세션 무효화
**Given**: 사용자가 로그인 상태다
**When**: "로그아웃" 버튼을 클릭한다
**Then**:
- Supabase `signOut()` 호출된다
- JWT가 localStorage에서 삭제된다
- Supabase 세션이 무효화된다
- 로그인 페이지로 리다이렉트된다

### AC-010: OAuth 토큰 Revoke (선택)
**Given**: 사용자가 계정 삭제를 요청했다
**When**: "계정 삭제" 버튼을 클릭한다
**Then**:
- Supabase가 Google/Kakao OAuth 토큰을 revoke한다
- `auth.users` 및 `profiles` 테이블에서 사용자 삭제된다
- 모든 게임 히스토리가 삭제된다 (GDPR 준수)

---

## 시나리오 6: 에러 처리

### AC-011: OAuth 프로바이더 장애
**Given**: Google OAuth 서버에 일시적 장애가 발생했다
**When**: "Google로 시작" 버튼을 클릭한다
**Then**:
- "Google 로그인에 실패했습니다. Kakao를 시도해보세요" 메시지 표시
- Kakao 로그인 버튼 강조 표시
- 5초 후 자동으로 재시도 옵션 제공

### AC-012: 네트워크 오류
**Given**: 사용자의 네트워크 연결이 불안정하다
**When**: OAuth 콜백 처리 중 네트워크 오류 발생
**Then**:
- "네트워크 오류가 발생했습니다. 다시 시도해주세요" 메시지 표시
- 로그인 페이지로 리다이렉트
- 오류 로그 Sentry에 전송

---

## 비기능 요구사항

### 성능 (Performance)
- [ ] Google OAuth 로그인 총 시간 <3초 (P95)
- [ ] Kakao OAuth 로그인 총 시간 <3초 (P95)
- [ ] Anonymous Auth 생성 시간 <100ms (P95)
- [ ] JWT 검증 시간 <10ms (P95)
- [ ] OAuth 콜백 처리 시간 <500ms (P95)

### 보안 (Security)
- [ ] Supabase JWT 서명 검증 100% 통과
- [ ] RLS 정책 100% 통과 (권한 테스트)
- [ ] CSRF 공격 방어 (Supabase `state` 자동 검증)
- [ ] HTTPS 강제 (프로덕션)
- [ ] OAuth 리다이렉트 URL 화이트리스트 검증

### 사용성 (Usability)
- [ ] 소셜 로그인 버튼 명확성 (A/B 테스트)
- [ ] OAuth 에러 메시지 친화적 ("Google 로그인 실패 시 Kakao 시도")
- [ ] Anonymous → Social 전환 유도 메시지 (게임 종료 후)
- [ ] 로딩 스피너 표시 (OAuth 처리 중)

### 호환성 (Compatibility)
- [ ] Chrome 90+, Safari 14+, Firefox 88+ 지원
- [ ] 모바일 브라우저 지원 (iOS Safari, Android Chrome)
- [ ] 다크 모드 지원 (로그인 버튼)
- [ ] 반응형 디자인 (320px ~ 1920px)

### 가용성 (Availability)
- [ ] OAuth 프로바이더 장애 시 대체 프로바이더 제안
- [ ] Supabase 무료 티어 제한 모니터링 (MAU 50,000)
- [ ] 에러 로그 Sentry 연동

---

## 테스트 체크리스트

### 단위 테스트 (Unit Tests)
- [ ] `SupabaseAuthService.verifyToken()` - 유효/무효 토큰 검증
- [ ] `SupabaseAuthService.getUserProfile()` - 프로필 조회
- [ ] `SupabaseJwtGuard.canActivate()` - 가드 통과/차단 테스트

### 통합 테스트 (Integration Tests)
- [ ] Google OAuth 플로우 (로그인 → 콜백 → JWT 발급)
- [ ] Kakao OAuth 플로우 (로그인 → 콜백 → JWT 발급)
- [ ] Anonymous Auth 플로우 (게스트 생성 → 게임 입장)
- [ ] Anonymous → Google 전환 (데이터 유지 검증)

### E2E 테스트 (End-to-End Tests)
- [ ] 신규 사용자 Google 로그인 전체 플로우
- [ ] 기존 사용자 Kakao 로그인 (프로필 유지)
- [ ] 게스트 로그인 → 10게임 플레이 → Google 연동
- [ ] 로그아웃 → 재로그인 (세션 유지)

### 수동 테스트 (Manual Tests)
- [ ] Google 로그인 UI/UX 검증
- [ ] Kakao 로그인 UI/UX 검증
- [ ] 에러 메시지 표시 검증
- [ ] 다크 모드 호환성 검증

---

## Definition of Done (완료 조건)

### 개발 완료 기준
1. ✅ 모든 API 엔드포인트 구현 완료
2. ✅ Google/Kakao OAuth 설정 완료
3. ✅ Supabase 프로젝트 설정 완료
4. ✅ 프론트엔드 로그인 페이지 구현 완료
5. ✅ 단위 테스트 커버리지 ≥85%

### QA 완료 기준
1. ✅ E2E 테스트 100% 통과
2. ✅ 성능 벤치마크 목표 달성 (P95 <3초)
3. ✅ 보안 스캔 통과 (RLS, CSRF 방어)
4. ✅ 크로스 브라우저 테스트 통과

### 배포 완료 기준
1. ✅ 프로덕션 환경 OAuth 리다이렉트 URL 등록
2. ✅ Supabase 프로덕션 프로젝트 설정
3. ✅ 모니터링 대시보드 설정 (Supabase Dashboard)
4. ✅ 에러 로깅 Sentry 연동

---

## 측정 지표 (Metrics)

### 주요 지표 (Primary Metrics)
- **소셜 로그인 전환율**: 로그인 페이지 방문 → 로그인 성공 (목표: ≥60%)
- **OAuth 성공률**: OAuth 시도 → 성공 (목표: ≥95%)
- **Anonymous 전환율**: Anonymous → Social 연동 (목표: ≥30%)

### 성능 지표 (Performance Metrics)
- **P50 로그인 시간**: <1.5초
- **P95 로그인 시간**: <3초
- **P99 로그인 시간**: <5초

### 보안 지표 (Security Metrics)
- **JWT 검증 실패율**: <0.1%
- **RLS 정책 위반 시도**: 0건 (자동 차단)
- **CSRF 공격 차단율**: 100%
