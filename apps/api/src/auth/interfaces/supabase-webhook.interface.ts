/**
 * Supabase Webhook 페이로드 인터페이스
 * Custom Access Token Hook에서 사용하는 데이터 구조
 */
export interface SupabaseCustomAccessTokenHookPayload {
  /**
   * Supabase 사용자 ID (UUID)
   */
  user_id: string;

  /**
   * 인증 방법 ('password', 'email', 'phone', 'oauth', 'saml', 'magiclink' 등)
   */
  authentication_method: string;

  /**
   * 사용자 레코드 정보
   */
  record: {
    /**
     * 사용자 이메일
     */
    email: string;

    /**
     * 사용자 전화번호
     */
    phone?: string;

    /**
     * 앱 메타데이터
     */
    app_metadata: {
      provider?: string;
      providers?: string[];
      [key: string]: any;
    };

    /**
     * 사용자 메타데이터
     */
    user_metadata: Record<string, any>;

    /**
     * 계정 생성 시간
     */
    created_at: string;

    /**
     * 마지막 업데이트 시간
     */
    updated_at: string;

    /**
     * 이메일 인증 여부
     */
    email_confirmed_at?: string;

    /**
     * 전화번호 인증 여부
     */
    phone_confirmed_at?: string;

    /**
     * 마지막 로그인 시간
     */
    last_sign_in_at?: string;

    [key: string]: any;
  };
}

/**
 * Supabase Auth Hook 응답 인터페이스
 * JWT claims에 추가할 사용자 정보
 */
export interface SupabaseAuthHookResponse {
  claims: {
    // 기존 Supabase claims 유지
    [key: string]: any;

    // Backend 사용자 정보 추가
    user_tier: string;
    user_role: string;
    user_id: number;
  };
}

/**
 * Supabase Auth Hook 처리 옵션
 */
export interface SupabaseAuthHookOptions {
  /**
   * 사용자 정보를 강제로 업데이트할지 여부
   */
  forceUpdate?: boolean;

  /**
   * 신규 사용자 생성 시 기본 설정
   */
  defaultUserSettings?: {
    tier?: string;
    role?: string;
  };
}