/**
 * 게임 관련 유틸리티 함수들
 * 반복되는 로직을 캡슐화하여 코드 중복을 줄입니다.
 */
export class GameUtil {
  /**
   * 게임 방 제목 Sanitization
   */
  static sanitizeRoomTitle(title: string): string {
    if (!title || typeof title !== 'string') {
      return '';
    }
    return title.trim().slice(0, 100);
  }

  /**
   * 게임 방 설명 Sanitization
   */
  static sanitizeRoomDescription(description: string): string {
    if (!description || typeof description !== 'string') {
      return '';
    }
    return description.trim().slice(0, 500);
  }

  /**
   * 플레이어 수 검증
   */
  static validatePlayerCount(minPlayers: number, maxPlayers: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (minPlayers < 2) {
      errors.push('최소 인원수는 2명 이상이어야 합니다.');
    }

    if (maxPlayers > 12) {
      errors.push('최대 인원수는 12명 이하이어야 합니다.');
    }

    if (minPlayers > maxPlayers) {
      errors.push('최소 인원수는 최대 인원수보다 작거나 같아야 합니다.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 비밀번호 복잡도 검증
   */
  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!password || typeof password !== 'string') {
      errors.push('비밀번호는 필수입니다.');
      return { isValid: false, errors };
    }

    if (password.length < 6) {
      errors.push('비밀번호는 6자 이상이어야 합니다.');
    }

    if (!/[a-zA-Z]/.test(password)) {
      errors.push('비밀번호에는 영문자가 포함되어야 합니다.');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('비밀번호에는 숫자가 포함되어야 합니다.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 게임 설정 검증
   */
  static validateGameSettings(settings: Record<string, any>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (settings.roundTime && (settings.roundTime < 30 || settings.roundTime > 600)) {
      errors.push('라운드 시간은 30초에서 600초 사이여야 합니다.');
    }

    if (settings.maxRounds && (settings.maxRounds < 1 || settings.maxRounds > 20)) {
      errors.push('최대 라운드 수는 1에서 20 사이여야 합니다.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 고유한 게임 코드 생성
   */
  static generateGameCode(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * 역할 타입의 우선순위 비교
   */
  static compareRolePriority(roleType1: string, roleType2: string): number {
    const priorityOrder = ['LIAR', 'DETECTIVE', 'WITNESS', 'SPECIALIST', 'CITIZEN'];
    const index1 = priorityOrder.indexOf(roleType1);
    const index2 = priorityOrder.indexOf(roleType2);

    if (index1 === -1 || index2 === -1) {
      return 0;
    }

    return index1 - index2;
  }

  /**
   * 게임 시간 포맷팅
   */
  static formatGameTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}분 ${remainingSeconds}초`;
    }
    return `${remainingSeconds}초`;
  }
}