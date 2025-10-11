// @CODE:AUTH-002 | SPEC: SPEC-AUTH-002.md | TEST: test/auth/supabase-*.test.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

/**
 * @CODE:AUTH-002:DOMAIN - Supabase Auth 서비스
 * Google/Kakao OAuth 및 Anonymous Auth 처리
 */
@Injectable()
export class SupabaseAuthService {
  private readonly logger = new Logger(SupabaseAuthService.name);
  private supabase: SupabaseClient;

  constructor() {
    // Supabase 클라이언트 초기화 (서버용 Service Key)
    const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'placeholder-key';

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // 서버에서는 세션 유지 안 함
      },
    });
  }

  /**
   * @CODE:AUTH-002:API - JWT 토큰 검증
   * Supabase JWT를 검증하고 사용자 정보 반환
   */
  async verifyToken(token: string): Promise<User> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException('Invalid token');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * @CODE:AUTH-002:DATA - 사용자 프로필 조회
   * Supabase profiles 테이블에서 사용자 정보 가져오기
   */
  async getUserProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * @CODE:AUTH-002:API - 로그아웃
   * Supabase 세션 무효화
   */
  async signOut(token: string): Promise<void> {
    await this.supabase.auth.admin.signOut(token);
  }

  /**
   * @CODE:AUTH-002:API - Anonymous Auth
   * 게스트 로그인 (익명 사용자 생성)
   */
  async signInAnonymously() {
    const { data, error } = await this.supabase.auth.signInAnonymously();

    if (error) {
      throw new Error('Anonymous sign-in failed');
    }

    return data;
  }
}
