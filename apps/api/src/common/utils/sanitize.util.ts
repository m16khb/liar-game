
/**
 * 입력값 Sanitization 유틸리티
 * XSS 및 SQL Injection 방지를 위한 문자열 정제
 */
export class SanitizeUtil {
  /**
   * HTML 태그 및 특수문자 제거
   */
  static sanitizeHtml(input: string): string {
    if (!input) return '';

    return input
      // HTML 태그 제거
      .replace(/<[^>]*>/g, '')
      // &lt;, &gt;, &amp; 등의 HTML 엔티티 디코딩
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      // 자바스크립트: 제거
      .replace(/javascript:/gi, '')
      // on* 이벤트 핸들러 제거 (onclick, onload 등)
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      // data:* URL 제거
      .replace(/data:(?:image|text)\/[^;]+;base64,[a-zA-Z0-9+/=]+/gi, '')
      // vbscript: 제거
      .replace(/vbscript:/gi, '')
      // 스크립트 태그 제거
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Iframe 제거
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      // Object 제거
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      // Embed 제거
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      // 스타일 태그 제거
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // 메타 태그 제거
      .replace(/<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi, '')
      // Link 태그 제거
      .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
      .trim();
  }

  /**
   * SQL Injection 패턴 제거
   */
  static sanitizeSql(input: string): string {
    if (!input) return '';

    return input
      // SQL 주석 제거
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      // SQL 명령어 패턴 제거
      .replace(/\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b/gi, '')
      // 세미콜론 제거
      .replace(/;/g, '')
      .trim();
  }

  /**
   * 방 제목 Sanitization
   */
  static sanitizeRoomTitle(title: string): string {
    if (!title) return '';

    // 1. HTML 태그 및 스크립트 제거
    let sanitized = this.sanitizeHtml(title);

    // 2. SQL Injection 패턴 제거
    sanitized = this.sanitizeSql(sanitized);

    // 3. 특수문자 제한 (알파벳, 숫자, 한글, 일부 특수문자만 허용)
    sanitized = sanitized.replace(/[<>]/g, '');

    // 4. 연속된 공백 제거
    sanitized = sanitized.replace(/\s+/g, ' ');

    // 5. 앞뒤 공백 제거
    sanitized = sanitized.trim();

    // 6. 길이 제한 (100자)
    if (sanitized.length > 100) {
      sanitized = sanitized.substring(0, 100).trim();
    }

    return sanitized;
  }

  /**
   * 방 설명 Sanitization
   */
  static sanitizeRoomDescription(description: string): string {
    if (!description) return '';

    // 설명은 좀 더 유연하게 허용하지만 위험한 패턴은 제거
    let sanitized = this.sanitizeHtml(description);
    sanitized = this.sanitizeSql(sanitized);
    sanitized = sanitized.replace(/[<>]/g, '');
    sanitized = sanitized.replace(/\s+/g, ' ');
    sanitized = sanitized.trim();

    // 길이 제한 (500자)
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 500).trim();
    }

    return sanitized;
  }

  /**
   * 검색어 Sanitization
   */
  static sanitizeSearchKeyword(keyword: string): string {
    if (!keyword) return '';

    // 검색어는 좀 더 유연하게 허용
    let sanitized = this.sanitizeHtml(keyword);
    sanitized = sanitized.replace(/[<>]/g, '');
    sanitized = sanitized.trim();

    // 길이 제한 (50자)
    if (sanitized.length > 50) {
      sanitized = sanitized.substring(0, 50).trim();
    }

    return sanitized;
  }

  /**
   * 방 코드 검증
   */
  static validateRoomCode(code: string): boolean {
    if (!code) return false;

    // 32자리 16진수 문자열인지 확인
    return /^[a-f0-9]{32}$/i.test(code);
  }

  /**
   * 비밀번호 복잡도 검증
   */
  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!password) {
      errors.push('비밀번호는 필수입니다.');
      return { isValid: false, errors };
    }

    if (password.length < 4) {
      errors.push('비밀번호는 최소 4자 이상이어야 합니다.');
    }

    if (password.length > 20) {
      errors.push('비밀번호는 최대 20자 이하여야 합니다.');
    }

    // XSS 방지를 위한 기본 검증
    if (/<script|javascript:|on\w+=/i.test(password)) {
      errors.push('비밀번호에 사용할 수 없는 문자가 포함되어 있습니다.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 플레이어 수 검증
   */
  static validatePlayerCount(min: number, max: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (min < 2) {
      errors.push('최소 인원은 2명 이상이어야 합니다.');
    }

    if (max > 10) {
      errors.push('최대 인원은 10명 이하여야 합니다.');
    }

    if (min > max) {
      errors.push('최소 인원은 최대 인원보다 작거나 같아야 합니다.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 게임 설정 JSON 검증
   */
  static validateGameSettings(settings: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!settings || typeof settings !== 'object') {
      errors.push('게임 설정은 객체 형태여야 합니다.');
      return { isValid: false, errors };
    }

    // JSON 크기 제한 (1KB)
    const jsonSize = JSON.stringify(settings).length;
    if (jsonSize > 1024) {
      errors.push('게임 설정이 너무 큽니다. (최대 1KB)');
    }

    // 위험한 키 값 검증
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    for (const key of Object.keys(settings)) {
      if (dangerousKeys.includes(key)) {
        errors.push(`사용할 수 없는 설정 키: ${key}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}