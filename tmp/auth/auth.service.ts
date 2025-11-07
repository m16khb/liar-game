import dayjs from 'dayjs';

// @CODE:AUTH-PASSWORD-001 @CODE:USER-LIFECYCLE-001 | SPEC: .moai/specs/SPEC-AUTH-PASSWORD-001/spec.md, SPEC-USER-LIFECYCLE-001/spec.md
/**
 * Auth Service
 * Supabase authentication integration with password management and user lifecycle
 *
 * Implementation Status:
 * - SPEC-AUTH-PASSWORD-001: Password authentication ✅
 * - SPEC-USER-LIFECYCLE-001: User withdrawal ✅
 * - Supabase JWT integration ✅
 * - Custom claims injection ✅
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UserRole, UserTier } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { EnvironmentService } from '@/core/services';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabaseAdmin: SupabaseClient | null = null;

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly environmentService: EnvironmentService
  ) {
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

  // @CODE:USER-LIFECYCLE-001 | SPEC: SPEC-USER-LIFECYCLE-001.md
  /**
   * 회원 탈퇴 - Supabase 세션 무효화 및 Backend 계정 비활성화
   * User withdrawal - Revoke all Supabase sessions and soft delete Backend account
   *
   * @note Supabase 사용자는 유지되며, 모든 세션만 무효화됨
   * @note Backend는 soft delete만 수행 (deletedAt 설정)
   */
  async withdrawUser(userId: number): Promise<void> {
    this.logger.debug(`Withdrawal request for user: ${userId}`);

    try {
      // 1. 사용자 조회
      const user = await this.userService.findOneUser(userId);

      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다');
      }

      // 2. ADMIN 역할 차단
      if (user.role === UserRole.ADMIN) {
        throw new ForbiddenException('관리자 계정은 직접 탈퇴할 수 없습니다');
      }

      const now = dayjs().toDate();

      // 3. Supabase 모든 세션 무효화 (사용자는 유지)
      if (this.supabaseAdmin && user.oauthId) {
        try {
          await this.revokeUserSupabaseTokens(user.id);
          this.logger.log(
            `All Supabase sessions revoked for user: ${user.oauthId} (Backend ID: ${userId})`
          );
        } catch (supabaseError) {
          this.logger.error(
            `Error revoking Supabase sessions: ${supabaseError instanceof Error ? supabaseError.message : 'Unknown'}`,
            supabaseError instanceof Error ? supabaseError.stack : undefined
          );
          // Supabase 세션 무효화 실패해도 계속 진행 (Backend soft delete는 수행)
        }
      }

      // 4. Backend Soft Delete
      await this.userService.updateUser(user.id, {
        deletedAt: now,
      });

      this.logger.log(`User withdrawal completed: ${userId}`);
    } catch (error) {
      this.logger.error(
        `User withdrawal failed for user: ${userId}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }

  // @CODE:AUTH-OAUTH-001 | SPEC: SPEC-AUTH-OAUTH-001.md
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

      // 1. MySQL에서 사용자 조회 (soft delete된 사용자 포함)
      let user = await this.userService.findByEmailWithDeleted(email);

      if (!user) {
        // OAuth Provider 추출: app_metadata.provider에서 실제 provider 정보 추출
        // 가능한 값: 'email', 'google', 'kakao', 'github', 'facebook' 등
        const provider = claims.app_metadata?.provider || 'email';

        // 신규 사용자 생성
        user = await this.userService.createUser({
          email,
          password: null,
          tier: UserTier.MEMBER,
          oauthProvider: provider,
          oauthId: userId,
        });
        this.logger.log(`New user created via Auth Hook: ${user.id} (provider: ${provider})`);
      } else if (user.deletedAt) {
        // 2. soft delete된 사용자는 로그인 차단
        this.logger.warn(`Deleted user attempted to login: ${user.id} (${email})`);
        throw new UnprocessableEntityException(
          '탈퇴한 계정입니다. 고객센터에 문의하여 계정 복구를 요청하세요.'
        );
      }

      // 3. lastLoginAt 업데이트
      await this.userService.updateLastLogin(user.id);

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
      // 1. Backend User 조회
      const user = await this.userService.findOneUser(userId);
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
   *
   * @note Environment-specific behavior:
   *       - local/dev/stg: Checks both Backend and Supabase (shared account scenario)
   *       - prod: Only checks Backend (Auth Hook auto-syncs on login)
   */
  async checkEmailRegistration(email: string): Promise<{ isExist: boolean; isWithdrawn: boolean }> {
    this.logger.debug(`Checking email registration: ${email}`);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const shouldCheckSupabase = this.environmentService.isLocalOrDevelopmentOrStaging();

      // 1. Check Backend Database (including soft-deleted users)
      const backendUser = await this.userService.findByEmailWithDeleted(normalizedEmail);
      let isExist = !!backendUser;

      // Check if user is soft-deleted (withdrawn)
      const isWithdrawn = !!backendUser?.deletedAt;

      // 2. Check Supabase Auth (only in non-production environments)
      if (shouldCheckSupabase && this.supabaseAdmin && !isExist) {
        // Only check Supabase if not found in Backend (optimization)
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

  /**
   * Check if user exists in Supabase Auth by email
   *
   * @param email - Normalized email address (lowercase, trimmed)
   * @returns true if user found, false otherwise
   *
   * @note Only used in dev/stg environments where user count is low
   *       Loads all users at once for simplicity
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
      const found = data.users.some(user => user.email?.toLowerCase() === email);

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
