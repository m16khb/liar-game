import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/**
 * 역할 정보
 */
interface Role {
  type: 'LIAR' | 'CIVILIAN';
  userId: number;
  encrypted: string;
}

/**
 * 역할 배정 서비스
 * 게임에서 플레이어들에게 역할을 무작위로 배정합니다.
 * 라이어와 시민 역할을 관리하며, 역할 정보를 암호화하여 전송합니다.
 */
@Injectable()
export class RoleAssignmentService {
  /**
   * 플레이어들에게 역할을 배정합니다
   * @param playerIds 플레이어 ID 배열
   * @param liarCount 라이어 수 (기본값: 1)
   * @returns 역할 정보 Map (userId -> Role)
   */
  assignRoles(
    playerIds: number[],
    liarCount: number = 1,
  ): Map<number, { type: 'LIAR' | 'CIVILIAN'; userId: number; encrypted: string }> {
    // Fisher-Yates 셔플 알고리즘으로 플레이어 순서를 무작위화
    const shuffledIds = this.shuffleArray([...playerIds]);

    const roles = new Map<
      number,
      { type: 'LIAR' | 'CIVILIAN'; userId: number; encrypted: string }
    >();

    shuffledIds.forEach((userId, index) => {
      const isLiar = index < liarCount;
      const roleType: 'LIAR' | 'CIVILIAN' = isLiar ? 'LIAR' : 'CIVILIAN';
      const encrypted = this.generateEncryptedRole(roleType, userId);

      roles.set(userId, {
        type: roleType,
        userId,
        encrypted,
      });
    });

    return roles;
  }

  /**
   * 특정 플레이어의 역할을 조회합니다
   * @param roles 역할 정보 Map
   * @param userId 플레이어 ID
   * @returns 플레이어의 역할 또는 undefined
   */
  getPlayerRole(
    roles: Map<number, { type: 'LIAR' | 'CIVILIAN'; userId: number; encrypted: string }>,
    userId: number,
  ): { type: 'LIAR' | 'CIVILIAN'; userId: number; encrypted: string } | undefined {
    return roles.get(userId);
  }

  /**
   * 역할 정보를 암호화합니다
   * @param roleType 역할 타입
   * @param userId 플레이어 ID
   * @returns 암호화된 역할 정보
   */
  generateEncryptedRole(roleType: 'LIAR' | 'CIVILIAN', userId: number): string {
    // bcrypt 검증을 위해 roleType:userId만 사용 (타임스탬프 제외)
    const roleData = `${roleType}:${userId}`;
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(roleData, salt);
  }

  /**
   * 암호화된 역할 정보를 검증합니다
   * @param encrypted 암호화된 데이터
   * @param expectedRoleType 예상 역할 타입
   * @param userId 플레이어 ID
   * @returns 검증 여부
   */
  async verifyEncryptedRole(
    encrypted: string,
    expectedRoleType: 'LIAR' | 'CIVILIAN',
    userId: number,
  ): Promise<boolean> {
    try {
      // 역할 정보는 "{roleType}:{userId}:{timestamp}" 형식으로 암호화됨
      // bcrypt.compare는 해시를 검증함
      // 역할 타입과 userId가 일치하는지 확인
      const roleData = `${expectedRoleType}:${userId}`;

      // bcrypt.compare는 해시된 값과 평문 값을 비교하는데,
      // 이 경우 해시된 데이터에서 역할 정보를 추출하기 위해 별도 검증 필요
      // 실제 검증: encrypted 해시가 expectedRoleType:userId로 생성되었는지 확인
      // 임시 구현: 서버에서만 암호화 데이터를 저장하고 검증
      const isValid = await bcrypt.compare(roleData, encrypted);
      return isValid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Fisher-Yates 셔플 알고리즘으로 배열을 무작위화합니다
   * @param array 무작위화할 배열
   * @returns 무작위화된 배열
   */
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
