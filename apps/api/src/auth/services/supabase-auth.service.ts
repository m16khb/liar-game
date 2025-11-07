import dayjs from 'dayjs';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { UserRole } from '../entities/user.entity';

/**
 * Supabase Auth Service
 * Supabase 인증 시스템과의 연동을 담당합니다.
 *
 * 주요 기능:
 * - Custom Access Token Hook 처리
 * - 사용자 탈퇴 처리 (Supabase 세션 무효화)
 * - JWT 토큰 검증 및 정보 추출
 */
@Injectable()
export class SupabaseAuthService {
  private readonly logger = new Logger(SupabaseAuthService.name);
  private supabaseAdmin: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {
    // Supabase Admin Client 초기화
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseServiceKey) {
      this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      this.logger.log('Supabase Admin Client initialized');
    } else {
      this.logger.warn('Supabase credentials not configured - OAuth will not work');
    }
  }

  /**
   * Supabase Auth Hook 처리 (Custom Access Token Hook)
   * Hook이 호출할 때 사용 - Supabase JWT claims에 Backend 정보 추가
   *
   * @note soft delete된 사용자가 재로그인 시도 시 ForbiddenException 발생
   */
  async handleSupabaseAuthHook(
    userId: string,
    claims: Record<string, any>,
    authMethod: string
  ): Promise<{ claims: Record<string, any> }> {
    this.logger.debug(`Supabase Auth Hook: user_id=${userId}, method=${authMethod}`);

    try {
      const email = claims.email;
      if (!email) {
        throw new BadRequestException('Email not found in claims');
      }

      // 1. Mock 사용자 조회 (실제로는 UserService를 통해 DB 조회 필요)
      // 여기서는 임시로 사용자 정보 생성
      let user = await this.findMockUser(email);

      if (!user) {
        // OAuth Provider 추출: app_metadata.provider에서 실제 provider 정보 추출
        const provider = claims.app_metadata?.provider || 'email';

        // 신규 사용자 생성 (실제로는 UserService.createUser 호출 필요)
        user = {
          id: Math.floor(Math.random() * 100000), // 임시 ID 생성
          email,
          tier: 'MEMBER',
          role: UserRole.USER,
          oauthProvider: provider,
          oauthId: userId,
          deletedAt: null,
        };
        this.logger.log(`New user created via Auth Hook: ${user.id} (provider: ${provider})`);
      } else if (user.deletedAt) {
        // 2. soft delete된 사용자는 로그인 차단
        this.logger.warn(`Deleted user attempted to login: ${user.id} (${email})`);
        throw new UnprocessableEntityException(
          '탈퇴한 계정입니다. 고객센터에 문의하여 계정 복구를 요청하세요.'
        );
      }

      // 3. lastLoginAt 업데이트 (실제로는 UserService.updateLastLogin 호출 필요)

      // 4. Claims에 Backend 정보 추가 (JWT는 포함하지 않음)
      return {
        claims: {
          ...claims, // 기존 Supabase claims 유지
          // Backend 사용자 정보만 추가
          user_tier: user.tier,
          user_role: user.role,
          user_id: user.id, // MySQL user.id
        },
      };
    } catch (error) {
      this.logger.error(
        'Supabase Auth Hook failed',
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  /**
   * Supabase 사용자의 모든 세션 무효화 (Global Sign Out)
   * tier/role 변경 시 즉시 권한 변경을 반영하기 위해 사용
   *
   * @param userId - Backend User ID
   * @throws BadRequestException - Supabase Admin Client가 초기화되지 않은 경우
   * @throws Error - Supabase API 호출 실패 시
   *
   * @note 클라이언트는 401 에러를 받으면 자동으로 refresh token으로 새 토큰 발급
   * @note 새 토큰에는 업데이트된 tier/role이 custom claims에 포함됨
   */
  async revokeUserSupabaseTokens(userId: number): Promise<void> {
    this.logger.debug(`Revoking Supabase tokens for user: ${userId}`);

    if (!this.supabaseAdmin) {
      throw new BadRequestException('Supabase Admin Client is not initialized');
    }

    try {
      // 1. Backend User 조회 (Mock - 실제로는 UserService.findOneUser 호출 필요)
      const user = await this.findMockUserById(userId);
      if (!user || !user.oauthId) {
        this.logger.warn(`User ${userId} does not have Supabase OAuth ID`);
        return;
      }

      // 2. Supabase Global Sign Out (모든 디바이스의 모든 세션 무효화)
      const { error } = await this.supabaseAdmin.auth.admin.signOut(user.oauthId, 'global');

      if (error) {
        this.logger.error(`Failed to revoke Supabase tokens for user ${userId}`, error.message);
        throw new Error(`Supabase token revocation failed: ${error.message}`);
      }

      this.logger.log(
        `Successfully revoked all Supabase tokens for user: ${userId} (Supabase ID: ${user.oauthId})`
      );
    } catch (error) {
      this.logger.error(
        `Error revoking Supabase tokens for user: ${userId}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  /**
   * Check if email is registered in system
   * Used for pre-registration validation
   *
   * @param email - Email address to check
   * @returns Object with isExist status and isWithdrawn flag
   */
  async checkEmailRegistration(email: string): Promise<{ isExist: boolean; isWithdrawn: boolean }> {
    this.logger.debug(`Checking email registration: ${email}`);

    try {
      const normalizedEmail = email.toLowerCase().trim();

      // 1. Check Backend Database (Mock - 실제로는 UserService.findByEmailWithDeleted 호출 필요)
      const backendUser = await this.findMockUser(normalizedEmail);
      let isExist = !!backendUser;

      // Check if user is soft-deleted (withdrawn)
      const isWithdrawn = !!backendUser?.deletedAt;

      // 2. Check Supabase Auth (only in non-production environments)
      if (isDevelopment() && this.supabaseAdmin && !isExist) {
        const registeredInSupabase = await this.checkSupabaseUserByEmail(normalizedEmail);
        isExist = isExist || registeredInSupabase;
      }

      this.logger.log(
        `Email check result: ${normalizedEmail} - isExist: ${isExist}, withdrawn: ${isWithdrawn}`
      );

      return { isExist, isWithdrawn };
    } catch (error) {
      this.logger.error(
        `Error checking email registration: ${email}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  // Mock 메소드들 (실제로는 UserService로 대체)
  private async findMockUser(email: string): Promise<{
    id: number;
    email: string;
    tier: string;
    role: UserRole;
    oauthProvider?: string;
    oauthId?: string;
    deletedAt?: Date | null;
  } | null> {
    // Mock 데이터 - 실제로는 DB 조회
    if (email === 'test@example.com') {
      return {
        id: 1,
        email: 'test@example.com',
        tier: 'MEMBER',
        role: UserRole.USER,
        oauthId: 'mock-supabase-id',
        deletedAt: null,
      };
    }
    return null;
  }

  private async findMockUserById(userId: number): Promise<{
    id: number;
    oauthId?: string;
  } | null> {
    // Mock 데이터 - 실제로는 DB 조회
    if (userId === 1) {
      return {
        id: 1,
        oauthId: 'mock-supabase-id',
      };
    }
    return null;
  }

  /**
   * Check if user exists in Supabase Auth by email
   *
   * @param email - Normalized email address (lowercase, trimmed)
   * @returns true if user found, false otherwise
   */
  private async checkSupabaseUserByEmail(email: string): Promise<boolean> {
    if (!this.supabaseAdmin) {
      return false;
    }

    try {
      const { data, error } = await this.supabaseAdmin.auth.admin.listUsers();

      if (error) {
        this.logger.warn(`Supabase listUsers error: ${error.message}`);
        return false;
      }

      if (!data?.users) {
        return false;
      }

      // Search for email in all users
      const found = data.users.some((user: SupabaseUser) =>
        user.email?.toLowerCase() === email
      );

      if (found) {
        this.logger.debug(`Email found in Supabase: ${email}`);
      }

      return found;
    } catch (error) {
      this.logger.error(
        `Error checking Supabase user by email: ${email}`,
        error instanceof Error ? error.stack : undefined
      );
      return false; // Fail gracefully
    }
  }
}

/**
 * 현재 환경이 개발 환경인지 확인
 */
function isDevelopment(): boolean {
  const nodeEnv = process.env.NODE_ENV || 'development';
  return ['development', 'dev', 'local'].includes(nodeEnv);
}