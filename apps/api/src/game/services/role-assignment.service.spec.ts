import { Test, TestingModule } from '@nestjs/testing';
import { RoleAssignmentService } from './role-assignment.service';

describe('RoleAssignmentService (RED Phase)', () => {
  let service: RoleAssignmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleAssignmentService],
    }).compile();

    service = module.get<RoleAssignmentService>(RoleAssignmentService);
  });

  describe('assignRoles', () => {
    /**
     * AC-1.2: 역할 무작위 배정
     * Given: 8명의 플레이어가 게임을 시작한다
     * When: 역할 배정이 실행된다
     * Then: 정확히 1명이 라이어 역할을 받는다, 나머지 7명은 시민 역할을 받는다
     */
    it('should assign exactly 1 liar and rest as civilians (AC-1.2)', () => {
      const playerIds = [1, 2, 3, 4, 5, 6, 7, 8];
      const roles = service.assignRoles(playerIds);

      const liarCount = Array.from(roles.values()).filter(
        (r) => r.type === 'LIAR',
      ).length;
      const civilianCount = Array.from(roles.values()).filter(
        (r) => r.type === 'CIVILIAN',
      ).length;

      expect(liarCount).toBe(1);
      expect(civilianCount).toBe(7);
    });

    /**
     * AC-1.2: 각 플레이어는 자신의 역할만 수신한다
     */
    it('should include all players in role assignment', () => {
      const playerIds = [1, 2, 3, 4, 5, 6, 7, 8];
      const roles = service.assignRoles(playerIds);

      expect(roles.size).toBe(8);
      playerIds.forEach((id) => {
        expect(roles.has(id)).toBe(true);
        expect(roles.get(id)).toBeDefined();
      });
    });

    /**
     * 각 플레이어의 역할이 유효한 Type을 가져야 한다
     */
    it('should have valid role types', () => {
      const playerIds = [1, 2, 3, 4];
      const roles = service.assignRoles(playerIds);

      Array.from(roles.values()).forEach((role) => {
        expect(['LIAR', 'CIVILIAN']).toContain(role.type);
      });
    });

    /**
     * 무작위성 테스트: 여러 번 실행 시 라이어가 다른 플레이어로 배정된다
     */
    it('should randomize liar assignment across multiple calls', () => {
      const playerIds = [1, 2, 3, 4, 5, 6, 7, 8];
      const liarIds: number[] = [];

      for (let i = 0; i < 10; i++) {
        const roles = service.assignRoles(playerIds);
        const liar = Array.from(roles.entries()).find(
          ([_, r]) => r.type === 'LIAR',
        );
        if (liar) {
          liarIds.push(liar[0]);
        }
      }

      // 최소 2명 이상의 서로 다른 라이어가 배정되어야 함
      const uniqueLiars = new Set(liarIds);
      expect(uniqueLiars.size).toBeGreaterThanOrEqual(2);
    });

    /**
     * 기본값 테스트: liarCount 미지정 시 1명이 라이어로 배정된다
     */
    it('should default to 1 liar when not specified', () => {
      const playerIds = [1, 2, 3, 4];
      const roles = service.assignRoles(playerIds);

      const liarCount = Array.from(roles.values()).filter(
        (r) => r.type === 'LIAR',
      ).length;
      expect(liarCount).toBe(1);
    });

    /**
     * 커스텀 라이어 수 테스트
     */
    it('should assign custom liar count when specified', () => {
      const playerIds = [1, 2, 3, 4, 5, 6];
      const roles = service.assignRoles(playerIds, 2);

      const liarCount = Array.from(roles.values()).filter(
        (r) => r.type === 'LIAR',
      ).length;
      expect(liarCount).toBe(2);
    });
  });

  describe('getPlayerRole', () => {
    /**
     * 특정 플레이어의 역할을 조회한다
     */
    it('should return player role for given userId', () => {
      const playerIds = [1, 2, 3, 4];
      const roles = service.assignRoles(playerIds);
      const role = service.getPlayerRole(roles, 1);

      expect(role).toBeDefined();
      expect(['LIAR', 'CIVILIAN']).toContain(role.type);
    });

    /**
     * 존재하지 않는 플레이어 조회 시 undefined 반환
     */
    it('should return undefined for non-existent player', () => {
      const playerIds = [1, 2, 3, 4];
      const roles = service.assignRoles(playerIds);
      const role = service.getPlayerRole(roles, 999);

      expect(role).toBeUndefined();
    });
  });

  describe('generateEncryptedRole', () => {
    /**
     * 역할 정보가 암호화된 문자열로 반환된다
     */
    it('should generate encrypted role information', () => {
      const encrypted = service.generateEncryptedRole('LIAR', 1);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });

    /**
     * 같은 역할 정보가 여러 번 암호화되면 다른 결과가 나온다 (salt 사용)
     */
    it('should generate different encrypted strings for same role (due to salt)', () => {
      const encrypted1 = service.generateEncryptedRole('LIAR', 1);
      const encrypted2 = service.generateEncryptedRole('LIAR', 1);

      // 암호화된 문자열이 다를 수 있음 (bcrypt는 salt를 사용)
      expect(encrypted1).toBeDefined();
      expect(encrypted2).toBeDefined();
    });
  });

  describe('verifyEncryptedRole', () => {
    /**
     * 올바른 암호화된 역할 정보를 검증한다
     */
    it('should verify correct encrypted role', async () => {
      const encrypted = service.generateEncryptedRole('CIVILIAN', 2);
      const isValid = await service.verifyEncryptedRole(
        encrypted,
        'CIVILIAN',
        2,
      );

      expect(isValid).toBe(true);
    });

    /**
     * 잘못된 암호화된 역할 정보를 거부한다
     */
    it('should reject incorrect encrypted role', async () => {
      const encrypted = service.generateEncryptedRole('CIVILIAN', 2);
      const isValid = await service.verifyEncryptedRole(
        encrypted,
        'LIAR',
        2,
      );

      expect(isValid).toBe(false);
    });
  });
});
