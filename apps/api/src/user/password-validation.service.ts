// @CODE:PASSWORD-VALIDATION-001 | SPEC: Password validation service | TEST: services/password-validation.service.spec.ts
/**
 * 비밀번호 검증 서비스
 *
 * TDD History:
 * - GREEN (2025-10-16): 비밀번호 검증 로직 구현
 * - REFACTOR (2025-10-16): 상수 추출 및 가독성 개선
 *
 * 단일 책임: 비밀번호 검증 로직만 담당
 * UserService에서 분리하여 테스트 용이성 및 재사용성 향상
 */

import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class PasswordValidationService {
  // 비밀번호 정책 상수
  private readonly MIN_LENGTH = 8;
  private readonly MAX_LENGTH = 128;
  private readonly UPPERCASE_PATTERN = /[A-Z]/;
  private readonly LOWERCASE_PATTERN = /[a-z]/;
  private readonly NUMBER_PATTERN = /\d/;
  private readonly SPECIAL_CHAR_PATTERN = /[@$!%*?&]/;

  /**
   * 비밀번호 유효성 검증
   *
   * @param password - 검증할 비밀번호
   * @throws {BadRequestException} 검증 실패 시
   */
  validate(password: string): void {
    this.validateRequired(password);
    this.validateLength(password);
    this.validateComplexity(password);
  }

  /**
   * 필수값 및 타입 검증
   */
  private validateRequired(password: string): void {
    if (!password || typeof password !== 'string') {
      throw new BadRequestException('Password is required and must be a string');
    }
  }

  /**
   * 길이 검증 (8~128자)
   */
  private validateLength(password: string): void {
    if (password.length < this.MIN_LENGTH) {
      throw new BadRequestException(`Password must be at least ${this.MIN_LENGTH} characters long`);
    }

    if (password.length > this.MAX_LENGTH) {
      throw new BadRequestException(`Password must not exceed ${this.MAX_LENGTH} characters`);
    }
  }

  /**
   * 복잡도 검증 (대문자, 소문자, 숫자, 특수문자)
   */
  private validateComplexity(password: string): void {
    const hasUppercase = this.UPPERCASE_PATTERN.test(password);
    const hasLowercase = this.LOWERCASE_PATTERN.test(password);
    const hasNumber = this.NUMBER_PATTERN.test(password);
    const hasSpecialChar = this.SPECIAL_CHAR_PATTERN.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
      );
    }
  }
}
