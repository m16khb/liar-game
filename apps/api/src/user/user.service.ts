// @CODE:USER-LIFECYCLE-001 @CODE:AUTH-PASSWORD-001 | SPEC: .moai/specs/SPEC-USER-LIFECYCLE-001/spec.md | TEST: user.service.spec.ts
/**
 * User Service
 * User management with tier system and lifecycle operations
 *
 * Implementation Status:
 * - SPEC-USER-LIFECYCLE-001: User lifecycle management ✅
 * - SPEC-AUTH-PASSWORD-001: Password management ✅
 * - User tier system ✅
 * - Password hashing with bcrypt ✅
 */

import { Injectable, Logger, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from './user.repository';
import { UserEntity, UserTier, UserRole } from './entities/user.entity';
import { PasswordValidationService } from './password-validation.service';

export interface CreateUserData {
  email: string;
  password: string | null; // OAuth 사용자는 비밀번호 없음
  tier?: UserTier;
  oauthProvider?: string; // 기본값 'email'
  oauthId?: string | null;
}

export interface UpdateUserData {
  tier?: UserTier;
  role?: UserRole;
  password?: string;
  oauthProvider?: string;
  oauthId?: string | null;
  emailVerificationCode?: string | null;
  emailVerificationCodeExpiry?: Date | null;
  deletedAt?: Date | null;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly saltRounds = 12;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordValidationService: PasswordValidationService
  ) {}

  async findOneUser(id: number): Promise<UserEntity> {
    this.logger.debug(`Finding user with id: ${id}`);

    try {
      const user = await this.userRepository.findOne(id);

      if (user) {
        this.logger.log(`User found: ${user.id}`);
      } else {
        this.logger.warn(`User not found with id: ${id}`);
      }

      return user;
    } catch (error) {
      this.logger.error(
        `Error finding user with id: ${id}`,
        error instanceof Error ? error.stack : undefined,
        { error, id }
      );
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    this.logger.debug(`Finding user with email: ${email}`);

    try {
      const user = await this.userRepository.findByEmail(email);

      if (user) {
        this.logger.log(`User found by email: ${user.id}`);
      } else {
        this.logger.debug(`User not found with email: ${email}`);
      }

      return user;
    } catch (error) {
      this.logger.error(
        `Error finding user with email: ${email}`,
        error instanceof Error ? error.stack : undefined,
        { error, email }
      );
      throw error;
    }
  }

  /**
   * soft delete된 사용자를 포함하여 이메일로 조회
   * Auth Hook에서 탈퇴한 사용자 복구 시 사용
   */
  async findByEmailWithDeleted(email: string): Promise<UserEntity | null> {
    this.logger.debug(`Finding user with email (including deleted): ${email}`);

    try {
      const user = await this.userRepository.findByEmailWithDeleted(email);

      if (user) {
        this.logger.log(`User found by email (deleted: ${!!user.deletedAt}): ${user.id}`);
      } else {
        this.logger.debug(`User not found with email: ${email}`);
      }

      return user;
    } catch (error) {
      this.logger.error(
        `Error finding user with email (including deleted): ${email}`,
        error instanceof Error ? error.stack : undefined,
        { error, email }
      );
      throw error;
    }
  }

  /**
   * email + oauthProvider 조합으로 사용자 조회
   */
  async findByEmailAndProvider(email: string, provider: string): Promise<UserEntity | null> {
    this.logger.debug(`Finding user with email and provider: ${email}, ${provider}`);

    try {
      const user = await this.userRepository.findByEmailAndProvider(email, provider);

      if (user) {
        this.logger.log(`User found by email and provider: ${user.id}`);
      } else {
        this.logger.debug(`User not found with email and provider: ${email}, ${provider}`);
      }

      return user;
    } catch (error) {
      this.logger.error(
        `Error finding user with email and provider: ${email}, ${provider}`,
        error instanceof Error ? error.stack : undefined,
        { error, email, provider }
      );
      throw error;
    }
  }

  async createUser(userData: CreateUserData): Promise<UserEntity> {
    this.logger.debug(`Creating user with email: ${userData.email}`);

    try {
      // Validate input data
      this.validateEmail(userData.email);

      // OAuth 사용자가 아닌 경우에만 비밀번호 검증
      if (userData.password !== null) {
        this.validatePassword(userData.password);
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new ConflictException(`User with email ${userData.email} already exists`);
      }

      // Hash password before storing (OAuth 사용자는 null)
      const hashedPassword = userData.password
        ? await bcrypt.hash(userData.password, this.saltRounds)
        : null;

      const user = await this.userRepository.create({
        email: userData.email.toLowerCase().trim(),
        password: hashedPassword,
        tier: userData.tier || UserTier.GUEST,
        oauthProvider: userData.oauthProvider || 'email', // 기본값 'email'
        oauthId: userData.oauthId || null,
      });

      this.logger.log(`User created successfully: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(
        `Error creating user with email: ${userData.email}`,
        error instanceof Error ? error.stack : undefined,
        { error, email: userData.email }
      );
      throw error;
    }
  }

  async updateUser(id: number, updateData: UpdateUserData): Promise<UserEntity> {
    this.logger.debug(`Updating user with id: ${id}`);

    try {
      // Validate and sanitize update data
      const sanitizedData: UpdateUserData = {};

      if (updateData.tier !== undefined) {
        if (!Object.values(UserTier).includes(updateData.tier)) {
          throw new BadRequestException('Invalid user tier');
        }
        sanitizedData.tier = updateData.tier;
      }

      if (updateData.role !== undefined) {
        if (!Object.values(UserRole).includes(updateData.role)) {
          throw new BadRequestException('Invalid user role');
        }
        sanitizedData.role = updateData.role;
      }

      if (updateData.password !== undefined) {
        this.validatePassword(updateData.password);
        sanitizedData.password = await this.hashPassword(updateData.password);
      }

      if (updateData.emailVerificationCode !== undefined) {
        sanitizedData.emailVerificationCode = updateData.emailVerificationCode;
      }

      if (updateData.emailVerificationCodeExpiry !== undefined) {
        sanitizedData.emailVerificationCodeExpiry = updateData.emailVerificationCodeExpiry;
      }

      if (updateData.deletedAt !== undefined) {
        sanitizedData.deletedAt = updateData.deletedAt;
      }

      // OAuth 관련 필드 처리 (Supabase 마이그레이션용)
      if (updateData.oauthProvider !== undefined) {
        sanitizedData.oauthProvider = updateData.oauthProvider;
      }

      if (updateData.oauthId !== undefined) {
        sanitizedData.oauthId = updateData.oauthId;
      }

      const user = await this.userRepository.update(id, sanitizedData);

      this.logger.log(`User updated successfully: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(
        `Error updating user with id: ${id}`,
        error instanceof Error ? error.stack : undefined,
        { error, id, updateData }
      );
      throw error;
    }
  }

  async updateLastLogin(id: number): Promise<void> {
    this.logger.debug(`Updating last login for user: ${id}`);

    try {
      await this.userRepository.updateLastLogin(id);
      this.logger.log(`Last login updated for user: ${id}`);
    } catch (error) {
      this.logger.error(
        `Error updating last login for user: ${id}`,
        error instanceof Error ? error.stack : undefined,
        { error, id }
      );
      throw error;
    }
  }

  async updateTier(id: number, newTier: UserTier): Promise<UserEntity> {
    this.logger.debug(`Updating user tier: ${id} to ${newTier}`);

    try {
      const user = await this.updateUser(id, { tier: newTier });
      this.logger.log(`User tier updated: ${user.id} to ${newTier}`);
      return user;
    } catch (error) {
      this.logger.error(
        `Error updating user tier: ${id} to ${newTier}`,
        error instanceof Error ? error.stack : undefined,
        { error, id, newTier }
      );
      throw error;
    }
  }

  async updateRole(id: number, newRole: UserRole): Promise<UserEntity> {
    this.logger.debug(`Updating user role: ${id} to ${newRole}`);

    try {
      const user = await this.updateUser(id, { role: newRole });
      this.logger.log(`User role updated: ${user.id} to ${newRole}`);
      return user;
    } catch (error) {
      this.logger.error(
        `Error updating user role: ${id} to ${newRole}`,
        error instanceof Error ? error.stack : undefined,
        { error, id, newRole }
      );
      throw error;
    }
  }

  async findUserByOAuthId(oauthId: string): Promise<UserEntity | null> {
    this.logger.debug(`Finding user with OAuth ID: ${oauthId}`);

    try {
      const user = await this.userRepository.findByOAuthId(oauthId);

      if (user) {
        this.logger.debug(`User found: ${user.id}`);
      }

      return user;
    } catch (error) {
      this.logger.error(
        `Error finding user with OAuth ID: ${oauthId}`,
        error instanceof Error ? error.stack : undefined,
        { error, oauthId }
      );
      throw error;
    }
  }

  async verifyEmail(id: number): Promise<UserEntity> {
    this.logger.debug(`Verifying email for user: ${id}`);

    try {
      const user = await this.updateUser(id, {
        emailVerificationCode: null,
        emailVerificationCodeExpiry: null,
      });
      this.logger.log(`Email verified for user: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(
        `Error verifying email for user: ${id}`,
        error instanceof Error ? error.stack : undefined,
        { error, id }
      );
      throw error;
    }
  }

  async deleteUser(id: number): Promise<void> {
    this.logger.debug(`Deleting user with id: ${id}`);

    try {
      await this.userRepository.delete(id);
      this.logger.log(`User deleted: ${id}`);
    } catch (error) {
      this.logger.error(
        `Error deleting user with id: ${id}`,
        error instanceof Error ? error.stack : undefined,
        { error, id }
      );
      throw error;
    }
  }

  async findAllUsers(limit?: number, offset?: number): Promise<UserEntity[]> {
    this.logger.debug(`Finding all users with limit: ${limit}, offset: ${offset}`);

    try {
      const users = await this.userRepository.findAll(limit, offset);
      this.logger.log(`Found ${users.length} users`);
      return users;
    } catch (error) {
      this.logger.error(
        `Error finding all users`,
        error instanceof Error ? error.stack : undefined,
        { error, limit, offset }
      );
      throw error;
    }
  }

  async getUserCount(): Promise<number> {
    this.logger.debug(`Getting user count`);

    try {
      const count = await this.userRepository.count();
      this.logger.log(`Total users: ${count}`);
      return count;
    } catch (error) {
      this.logger.error(
        `Error getting user count`,
        error instanceof Error ? error.stack : undefined,
        { error }
      );
      throw error;
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePasswords(plaintext: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hashed);
  }

  async updatePassword(id: number, newPassword: string): Promise<UserEntity> {
    this.logger.debug(`Updating password for user: ${id}`);

    try {
      // Validate new password
      this.validatePassword(newPassword);

      const hashedPassword = await this.hashPassword(newPassword);

      // updateUser를 직접 사용하지 않고 repository를 직접 호출하여 중복 검증 방지
      const user = await this.userRepository.update(id, { password: hashedPassword });
      this.logger.log(`Password updated for user: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(
        `Error updating password for user: ${id}`,
        error instanceof Error ? error.stack : undefined,
        { error, id }
      );
      throw error;
    }
  }

  private validateEmail(email: string): void {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Email is required and must be a string');
    }

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      throw new BadRequestException('Email cannot be empty');
    }

    if (trimmedEmail.length > 255) {
      throw new BadRequestException('Email must not exceed 255 characters');
    }

    // Basic email format validation (more comprehensive than just checking for @)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      throw new BadRequestException('Please provide a valid email address');
    }
  }

  private validatePassword(password: string): void {
    // PasswordValidationService로 위임
    this.passwordValidationService.validate(password);
  }

  private sanitizeStringField(
    value: string | undefined,
    maxLength: number,
    fieldName: string
  ): string | undefined {
    if (!value) return undefined;

    const trimmed = value.trim();
    if (!trimmed) return undefined;

    if (trimmed.length > maxLength) {
      throw new BadRequestException(`${fieldName} must not exceed ${maxLength} characters`);
    }

    return trimmed;
  }
}
