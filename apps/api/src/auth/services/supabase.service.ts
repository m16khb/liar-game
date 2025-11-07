// Supabase 인증 서비스
// OAuth 소셜 로그인 + Email 로그인 지원

import { Injectable } from '@nestjs/common'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
    )
  }

  /**
   * Supabase 클라이언트 인스턴스 반환
   */
  getClient(): SupabaseClient {
    return this.supabase
  }

  /**
   * JWT 토큰으로 사용자 정보 가져오기
   * @param accessToken Supabase JWT 토큰
   */
  async getUserByToken(accessToken: string) {
    const { data: { user }, error } = await this.supabase.auth.getUser(accessToken)

    if (error || !user) {
      throw new Error('유효하지 않은 토큰이거나 사용자를 찾을 수 없습니다')
    }

    return user
  }

  /**
   * OAuth 제공자별 인증 URL 생성
   * @param provider OAuth 제공자 (google, github, discord)
   * @param redirectUrl 리다이렉트 URL
   */
  async getOAuthUrl(provider: 'google' | 'github' | 'discord', redirectUrl: string) {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    })

    if (error) {
      throw new Error(`OAuth URL generation failed: ${error.message}`)
    }

    return data.url
  }

  /**
   * OAuth 콜백 처리
   * @param code OAuth 인증 코드
   */
  async handleOAuthCallback(code: string) {
    const { data, error } = await this.supabase.auth.exchangeCodeForSession(code)

    if (error || !data.user) {
      throw new Error(`OAuth callback failed: ${error?.message}`)
    }

    return {
      user: data.user,
      session: data.session,
    }
  }

  /**
   * 이메일/비밀번호 로그인
   * @param email 이메일
   * @param password 비밀번호
   */
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      throw new Error(`Email login failed: ${error?.message}`)
    }

    return {
      user: data.user,
      session: data.session,
    }
  }

  /**
   * 이메일/비밀번호 회원가입
   * @param email 이메일
   * @param password 비밀번호
   */
  async signUpWithEmail(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      throw new Error(`Email signup failed: ${error.message}`)
    }

    return data
  }

  /**
   * 로그아웃 처리
   * @param accessToken 접근 토큰
   */
  async signOut(accessToken: string) {
    const { error } = await this.supabase.auth.admin.signOut(accessToken)

    if (error) {
      throw new Error(`Sign out failed: ${error.message}`)
    }
  }

  /**
   * JWT 토큰 갱신
   * @param refreshToken 리프레시 토큰
   */
  async refreshSession(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({ refresh_token: refreshToken })

    if (error || !data.session) {
      throw new Error(`Token refresh failed: ${error.message}`)
    }

    return data.session
  }
}