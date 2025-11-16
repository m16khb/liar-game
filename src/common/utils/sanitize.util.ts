/**
 * 문자열 Sanitization 유틸리티
 */

export class SanitizeUtil {
  /**
   * HTML 태그 제거
   */
  static sanitizeHtml(value: string): string {
    if (!value) return '';
    return value.replace(/<[^>]*>/g, '');
  }

  /**
   * 자바스크립트 제거
   */
  static sanitizeJavascript(value: string): string {
    if (!value) return '';
    return value.replace(/javascript:/gi, '');
  }

  /**
   * SQL Injection 방어
   */
  static sanitizeSql(value: string): string {
    if (!value) return '';
    return value.replace(/['"\;\\n\\r\\t]/g, '');
  }

  /**
   * XSS 방어를 위한 완전한 Sanitization
   */
  static sanitize(value: string): string {
    if (!value) return '';
    return this.sanitizeSql(this.sanitizeJavascript(this.sanitizeHtml(value.trim())));
  }

  /**
   * 방 제목 Sanitization (길이 제한 포함)
   */
  static sanitizeRoomTitle(title: string): string {
    return this.sanitize(title).slice(0, 100);
  }

  /**
   * 방 설명 Sanitization (길이 제한 포함)
   */
  static sanitizeRoomDescription(description: string): string {
    return this.sanitize(description).slice(0, 500);
  }
}
