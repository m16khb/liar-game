# 메인페이지 히어로 섹션 및 Supabase 로그인 기능 연구

## 연구 개요

라이어 게임 프로젝트에 메인페이지 히어로 섹션과 Supabase 기반 로그인 기능을 구현하기 위한 기술적 구현 방안 연구

## 프로젝트 현황 분석

### 현재 기술 스택
- **프론트엔드**: React 18 + TypeScript + Vite
- **스타일링**: 기본 CSS (CSS Reset 적용)
- **상태 관리**: 미구현 (React Context API 필요)
- **라우팅**: 미구현 (react-router-dom 필요)
- **인증**: Supabase 클라이언트 설정 완료, UI 미구현

### Supabase 인프라 상태
- **백엔드 연동**: 완벽하게 구현됨 (NestJS + Supabase Auth)
- **환경 변수**: 완전히 설정됨 (URL, 키, 웹훅 등)
- **클라이언트**: 모든 OAuth 제공자 함수 준비됨
- **웹훅 처리**: 백엔드에서 완벽하게 처리됨

## 기술 결정 및 근거

### 1. 히어로 섹션 구현 방식

**결정**: Styled Components + CSS-in-JS 방식 선택

**근거**:
- 현재 프로젝트에 스타일링 라이브러리가 없음
- TypeScript와 완벽한 호환성
- 동적 스타일링 및 테마 지원 용이
- 컴포넌트 단위 스타일 캡슐화

**대안 considered**:
- Tailwind CSS (설정 복잡성)
- CSS Modules (동적 스타일링 한계)
- Emotion (Styled Components와 유사하지만 API 복잡성)

### 2. 라우팅 솔루션

**결정**: React Router DOM v6 선택

**근거**:
- OAuth 콜백 처리 필수
- 보호된 라우팅 필요
- 업계 표준 라이브러리
- TypeScript 완벽 지원

### 3. 상태 관리

**결정**: React Context API + useReducer 선택

**근거**:
- 인증 상태 관리에 적합
- 별도 라이브러리 불필요 (최소 구현 원칙)
- React 18과 완벽 호환
- 서버 권한 모델과 잘 맞음

### 4. 인증 UI/UX 패턴

**결정**: 중앙 집중식 로그인 모달

**근거**:
- 사용자 경험 향상 (페이지 이동 없음)
- 모바일 친화적 디자인
- OAuth 흐름과 잘 맞는 패턴

## 구현 아키텍처

### 히어로 섹션 구조
```typescript
HeroSection/
├── index.tsx           // 메인 컴포넌트
├── HeroSection.tsx     // 히어로 콘텐츠
├── CTAButton.tsx       // 행동 유도 버튼
├── GamePreview.tsx     // 게임 미리보기
└── styles.ts           // Styled Components
```

### 인증 시스템 구조
```typescript
Auth/
├── context/
│   ├── AuthContext.tsx     // 인증 컨텍스트
│   └── AuthProvider.tsx    // 인증 프로바이더
├── components/
│   ├── LoginModal.tsx      // 로그인 모달
│   ├── LoginForm.tsx       // 이메일 로그인 폼
│   ├── SocialButtons.tsx   // 소셜 로그인 버튼
│   └── ProtectedRoute.tsx  // 보호된 라우트
└── hooks/
    └── useAuth.ts          // 인증 훅
```

## 필요한 의존성 추가

### 설치할 패키지
```bash
# 스타일링 및 라우팅
pnpm --filter @liar-game/web add styled-components @types/styled-components react-router-dom @types/react-router-dom

# 선택적 애니메이션 (성능 고려)
pnpm --filter @liar-game/web add framer-motion
```

## 구현 단계 계획

### 1단계: 기반 구축 (1-2일)
1. 의존성 설치
2. 기본 라우팅 구조 설정
3. AuthContext 구현
4. ProtectedRoute 구현

### 2단계: 인증 UI (2-3일)
1. 로그인 모달 컴포넌트
2. 소셜 로그인 버튼
3. 이메일 로그인 폼
4. OAuth 콜백 처리

### 3단계: 히어로 섹션 (2-3일)
1. 히어로 컴포넌트 구조
2. 반응형 스타일링
3. 애니메이션 효과
4. CTA 버튼과 인증 연동

### 4단계: 통합 및 최적화 (1일)
1. 전체 흐름 테스트
2. 성능 최적화
3. 접근성 검토
4. 에러 핸들링

## 보안 고려사항

### 1. PKCE Flow
- Supabase가 자동으로 처리
- 리디렉션 URI 설정 확인 필요

### 2. CSRF 방지
- Supabase SDK 내장 기능 활용
- SameSite 쿠키 설정

### 3. 세션 관리
- Supabase 자동 토큰 갱신 활용
- secure storage 사용

## 성능 최적화 방안

### 1. 코드 스플리팅
- 라우트 기반 코드 분할
- 인증 컴포넌트 지연 로딩

### 2. 이미지 최적화
- 히어로 섹션 이미지 WebP 포맷
- lazy loading 적용

### 3. 렌더링 최적화
- React.memo 사용
- 불필요한 리렌더링 방지

## 접근성 고려사항

### 1. 키보드 내비게이션
- 모든 인터랙티브 요소 포커스 가능
- 논리적 탭 순서

### 2. 스크린 리더 지원
- 적절한 ARIA 라벨
- 시맨틱 HTML 사용

### 3. 색상 대비
- WCAG 2.1 AA 준수
- 고대비 모드 지원

## 테스트 전략

### 1. 단위 테스트
- 인증 훅 테스트
- 컴포넌트 렌더링 테스트

### 2. 통합 테스트
- 로그인 흐름 테스트
- 라우팅 동작 테스트

### 3. 접근성 테스트
- axe-core 사용
- 키보드 내비게이션 테스트

## 예상 완성 시점

- **총 예상 기간**: 6-9일
- **MVP 버전**: 4-5일 (기본 기능만)
- **완전한 버전**: 6-9일 (애니메이션 및 UX 개선 포함)

## 기술적 위험 및 완화 방안

### 1. 난이도: 낮음
- 모든 인프라가 준비됨
- Supabase SDK가 복잡한 부분 처리

### 2. 잠재적 문제
- OAuth 리디렉션 URI 설정
- CORS 정책 충돌
- 모바일 반응형 이슈

### 3. 완화 방안
- 개발 환경에서 충분한 테스트
- 점진적 구현 접근
- 철저한 에러 핸들링

## 결론

라이어 게임 프로젝트의 메인페이지 히어로 섹션과 Supabase 로그인 기능은 **기술적으로 구현 가능성이 매우 높음**. 완벽하게 구축된 Supabase 백엔드 인프라를 기반으로, 프론트엔드 개발에 집중하여 빠르게 구현할 수 있습니다.

**핵심 성공 요인**:
1. 최소 구현 원칙 준수
2. 점진적 개발 접근
3. 사용자 경험 중심 설계
4. 보안 및 성능 고려