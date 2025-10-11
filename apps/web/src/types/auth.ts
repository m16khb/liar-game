// @CODE:UI-001:DATA | SPEC: SPEC-UI-001.md
import type { User } from '@supabase/supabase-js';

/**
 * 인증된 사용자 타입
 */
export interface AuthUser extends User {
  email: string;
}

/**
 * 게임 페이지 Props
 */
export interface GamePageProps {
  user: AuthUser | null;
}

/**
 * 세션 상태
 */
export type SessionStatus = 'authenticated' | 'unauthenticated' | 'loading';
