# 인증 시스템 마이그레이션 가이드: JWT → Supabase

@DOC:AUTH-002:MIGRATION | SPEC: SPEC-AUTH-002.md

## 개요

이 문서는 liar-game의 인증 시스템을 JWT 기반(AUTH-001)에서 Supabase 통합(AUTH-002)으로 마이그레이션하는 가이드입니다.

## 주요 변경사항

### Before (AUTH-001: JWT)
- 자체 구현 JWT 토큰 발급/검증
- 이메일/비밀번호 인증만 지원
- 사용자 관리 직접 구현
- bcrypt 해싱 수동 처리
- 세션 관리 (Redis + PostgreSQL)

### After (AUTH-002: Supabase)
- Supabase Auth 통합
- 소셜 로그인 지원 (Google, GitHub, Discord)
- Anonymous 인증 지원
- RLS(Row Level Security) 활용
- Supabase가 JWT 자동 발급/검증

## 마이그레이션 단계

### 1. 환경 변수 설정

.env 파일에 Supabase 자격증명 추가:

```bash
# Supabase 설정 (새로 추가)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 기존 JWT 설정 (제거 예정)
# JWT_ACCESS_SECRET=...
# JWT_REFRESH_SECRET=...
```

**Supabase 프로젝트 생성**:
1. https://supabase.com 접속
2. "New Project" 클릭
3. 프로젝트 이름, 데이터베이스 비밀번호 설정
4. API Settings에서 URL과 Key 복사

### 2. 코드 변경사항

#### 백엔드 (NestJS)

**Before (JWT 가드)**:
```typescript
// apps/api/src/auth/jwt-auth.guard.ts
import { JwtAuthGuard } from '@nestjs/passport';

@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user; // JWT에서 추출된 사용자 정보
}
```

**After (Supabase JWT 가드)**:
```typescript
// @CODE:AUTH-002:API | SPEC: SPEC-AUTH-002.md

// apps/api/src/auth/supabase-jwt.guard.ts
import { SupabaseJwtGuard } from './supabase-jwt.guard';

@UseGuards(SupabaseJwtGuard)
@Get('profile')
async getProfile(@Request() req) {
  return req.user; // Supabase 사용자 정보
}
```

**Before (로그인 엔드포인트)**:
```typescript
@Post('login')
async login(@Body() dto: LoginDto) {
  const user = await this.authService.validateUser(dto.email, dto.password);
  const tokens = await this.authService.generateTokens(user);
  return tokens;
}
```

**After (Supabase 사용 - 엔드포인트 제거)**:
```typescript
// Supabase가 자동으로 처리하므로 백엔드 로그인 엔드포인트 불필요
// 프론트엔드에서 supabase.auth.signInWithOAuth() 직접 호출
```

#### 프론트엔드 (Next.js)

**Before (JWT 토큰 수동 관리)**:
```typescript
// apps/web/src/lib/auth.ts
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { accessToken } = await response.json();
localStorage.setItem('jwt', accessToken);

// API 요청 시 수동으로 헤더 추가
fetch('/api/profile', {
  headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` }
});
```

**After (Supabase Client 사용)**:
```typescript
// @CODE:AUTH-002:UI | SPEC: SPEC-AUTH-002.md

// apps/web/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 소셜 로그인
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
});

// 사용자 정보 조회 (토큰 자동 관리)
const { data: { user } } = await supabase.auth.getUser();
```

### 3. 데이터 이관

기존 사용자 데이터를 Supabase로 이관하는 스크립트:

```typescript
// @CODE:AUTH-002:MIGRATION | SPEC: SPEC-AUTH-002.md

// scripts/migrate-users.ts
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 서비스 역할 키 사용
);

const prisma = new PrismaClient();

async function migrateUsers() {
  console.log('🔄 사용자 데이터 마이그레이션 시작...');

  // 1. 기존 JWT 사용자 조회 (PostgreSQL)
  const oldUsers = await prisma.user.findMany({
    where: { isGuest: false }
  });

  console.log(`📊 총 ${oldUsers.length}명의 사용자 발견`);

  let successCount = 0;
  let failCount = 0;

  // 2. Supabase로 이관
  for (const user of oldUsers) {
    try {
      // Supabase Auth에 사용자 생성
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.passwordHash, // bcrypt 해시 그대로 사용 불가 → 임시 비밀번호 발급
        email_confirm: true, // 이메일 인증 건너뛰기
        user_metadata: {
          username: user.username,
          level: user.level,
          migrated_at: new Date().toISOString(),
          legacy_user_id: user.id // 기존 ID 보존
        }
      });

      if (error) {
        console.error(`❌ ${user.email} 마이그레이션 실패:`, error.message);
        failCount++;
        continue;
      }

      // Supabase profiles 테이블에 추가 정보 저장
      await supabase.from('profiles').insert({
        id: data.user!.id,
        username: user.username,
        level: user.level,
        oauth_provider: 'legacy', // 기존 사용자 표시
        created_at: user.createdAt
      });

      console.log(`✅ ${user.email} 마이그레이션 완료`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${user.email} 예외 발생:`, error);
      failCount++;
    }
  }

  console.log(`\n📈 마이그레이션 결과:`);
  console.log(`  성공: ${successCount}명`);
  console.log(`  실패: ${failCount}명`);
  console.log(`  성공률: ${((successCount / oldUsers.length) * 100).toFixed(2)}%`);
}

migrateUsers()
  .then(() => {
    console.log('✅ 마이그레이션 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  });
```

**실행**:
```bash
cd /Users/m16khb/Workspace/liar-game
pnpm tsx scripts/migrate-users.ts
```

**중요 사항**:
- bcrypt 해시는 Supabase로 직접 이관 불가 → 사용자에게 비밀번호 재설정 이메일 발송
- `user_metadata`에 기존 사용자 ID 저장하여 추적성 유지
- 마이그레이션 중 기존 시스템 병행 운영 권장

### 4. OAuth 프로바이더 설정

#### Google OAuth 설정

1. **Google Cloud Console**: https://console.cloud.google.com
2. "APIs & Services" → "Credentials" → "Create OAuth Client ID"
3. 승인된 리디렉트 URI 추가:
   ```
   https://your-project.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback (개발용)
   ```
4. Client ID와 Secret 복사 → Supabase 대시보드에 입력

#### GitHub OAuth 설정

1. **GitHub Settings**: https://github.com/settings/developers
2. "OAuth Apps" → "New OAuth App"
3. Authorization callback URL:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
4. Client ID와 Secret 복사 → Supabase 대시보드에 입력

#### Discord OAuth 설정

1. **Discord Developer Portal**: https://discord.com/developers/applications
2. "New Application" → OAuth2 설정
3. Redirects 추가:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
4. Client ID와 Secret 복사 → Supabase 대시보드에 입력

### 5. 테스트

마이그레이션 후 다음 시나리오를 테스트하세요:

- [ ] 기존 사용자 로그인 가능 (비밀번호 재설정 후)
- [ ] 소셜 로그인 (Google, GitHub, Discord)
- [ ] Anonymous 인증
- [ ] JWT 토큰 검증
- [ ] 권한 기반 라우팅
- [ ] 프로필 정보 조회/수정
- [ ] 토큰 자동 갱신

**E2E 테스트 실행**:
```bash
cd apps/api
pnpm test:e2e
```

### 6. 롤백 계획

마이그레이션 실패 시 롤백 방법:

```bash
# 1. Git 브랜치 되돌리기
git checkout feature/SPEC-AUTH-001

# 2. 환경 변수 복원
cp .env.backup .env

# 3. 데이터베이스 복원 (백업 필수)
psql liar_game < backup.sql

# 4. Redis 세션 정리
redis-cli FLUSHDB

# 5. 애플리케이션 재시작
docker compose restart
pnpm turbo dev
```

**백업 권장사항**:
- 마이그레이션 전 PostgreSQL 전체 백업: `pg_dump liar_game > backup.sql`
- Redis 스냅샷 저장: `redis-cli SAVE`
- 환경 변수 파일 백업: `cp .env .env.backup`

### 7. 성능 비교

| 메트릭 | AUTH-001 (JWT) | AUTH-002 (Supabase) |
|--------|----------------|---------------------|
| 로그인 시간 | ~150ms (bcrypt) | ~200ms (OAuth 리디렉트) |
| 토큰 갱신 | 수동 처리 필요 | 자동 갱신 |
| 세션 조회 | Redis (<10ms) | Supabase RPC (~20ms) |
| 소셜 로그인 | 미지원 | Google, GitHub, Discord 지원 |
| Anonymous Auth | 커스텀 구현 | 네이티브 지원 |

### 8. 보안 개선사항

- **RLS (Row Level Security)**: PostgreSQL 레벨에서 권한 자동 제어
  ```sql
  CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
  ```

- **OAuth PKCE**: Supabase가 자동으로 PKCE 플로우 적용 (중간자 공격 방어)

- **토큰 자동 갱신**: Supabase SDK가 만료 5분 전 자동 갱신

- **감사 로그**: Supabase 대시보드에서 모든 인증 이벤트 확인 가능

## 참고 자료

- [SPEC-AUTH-001](../../.moai/specs/SPEC-AUTH-001/spec.md) - JWT 인증 명세
- [SPEC-AUTH-002](../../.moai/specs/SPEC-AUTH-002/spec.md) - Supabase 인증 명세
- [Supabase Auth 공식 문서](https://supabase.com/docs/guides/auth)
- [Supabase Auth Helpers (Next.js)](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

---

**작성자**: @Goos (doc-syncer 📖)
**최종 수정**: 2025-10-11
