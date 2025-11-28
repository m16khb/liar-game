import { Test, TestingModule } from '@nestjs/testing';
import { TurnManagerService } from './turn-manager.service';

describe('TurnManagerService (RED Phase)', () => {
  let service: TurnManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TurnManagerService],
    }).compile();

    service = module.get<TurnManagerService>(TurnManagerService);
  });

  describe('generateTurnOrder', () => {
    /**
     * AC-2.1: 턴 순서 무작위 생성
     * Given: 게임이 시작되고 토론 단계로 진입했다
     * When: 턴 순서가 생성된다
     * Then: 모든 플레이어가 turnOrder 배열에 포함된다
     */
    it('should include all players in turn order (AC-2.1)', () => {
      const playerIds = [1, 2, 3, 4, 5, 6, 7, 8];
      const turnOrder = service.generateTurnOrder(playerIds);

      expect(turnOrder).toHaveLength(8);
      expect(new Set(turnOrder).size).toBe(8); // 중복 없음
    });

    /**
     * AC-2.1: 순서는 무작위로 생성된다 (매번 다른 순서)
     */
    it('should randomize turn order across calls (AC-2.1)', () => {
      const playerIds = [1, 2, 3, 4, 5, 6, 7, 8];
      const turnOrders: number[][] = [];

      for (let i = 0; i < 10; i++) {
        const turnOrder = service.generateTurnOrder(playerIds);
        turnOrders.push(turnOrder);
      }

      // 최소 2개 이상의 다른 순서가 있어야 함
      const uniqueOrders = new Set(turnOrders.map((to) => JSON.stringify(to)));
      expect(uniqueOrders.size).toBeGreaterThanOrEqual(2);
    });

    /**
     * 작은 플레이어 수로도 턴 순서가 생성된다
     */
    it('should generate turn order for small player count', () => {
      const playerIds = [1, 2, 3, 4];
      const turnOrder = service.generateTurnOrder(playerIds);

      expect(turnOrder).toHaveLength(4);
      expect(turnOrder.sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
    });
  });

  describe('nextTurn', () => {
    /**
     * AC-2.2: 자동 턴 전환 (30초 타이머)
     * When: 타이머가 종료된다
     * Then: 자동으로 다음 턴으로 전환된다
     */
    it('should advance to next turn', () => {
      const playerIds = [1, 2, 3, 4];
      const roomId = 1;
      const manager = service.createTurnManager(roomId, playerIds);

      const initialTurn = manager.currentTurnIndex;
      manager.nextTurn();

      expect(manager.currentTurnIndex).toBe(initialTurn + 1);
    });

    /**
     * 마지막 턴 후 처음으로 돌아간다
     */
    it('should wrap around to first player after last turn', () => {
      const playerIds = [1, 2, 3, 4];
      const roomId = 1;
      const manager = service.createTurnManager(roomId, playerIds);

      // 모든 턴을 진행
      for (let i = 0; i < playerIds.length; i++) {
        manager.nextTurn();
      }

      // 처음으로 돌아가야 함
      expect(manager.currentTurnIndex).toBe(0);
    });
  });

  describe('getCurrentPlayer', () => {
    /**
     * 현재 턴의 플레이어를 반환한다
     */
    it('should return current player', () => {
      const playerIds = [1, 2, 3, 4];
      const roomId = 1;
      const manager = service.createTurnManager(roomId, playerIds);

      const currentPlayer = manager.getCurrentPlayer();

      expect(currentPlayer).toBe(manager.turnOrder[0]);
    });
  });

  describe('getRemainingTime', () => {
    /**
     * 남은 시간을 반환한다
     */
    it('should return remaining time', () => {
      const playerIds = [1, 2, 3, 4];
      const roomId = 1;
      const manager = service.createTurnManager(roomId, playerIds, 30);

      const remaining = manager.getRemainingTime();

      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(30);
    });

    /**
     * 시간이 경과하면 남은 시간이 줄어든다
     */
    it('should decrease remaining time as time passes', async () => {
      const playerIds = [1, 2, 3, 4];
      const roomId = 1;
      const manager = service.createTurnManager(roomId, playerIds, 30);

      const initialRemaining = manager.getRemainingTime();

      // 1초 대기
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const newRemaining = manager.getRemainingTime();

      expect(newRemaining).toBeLessThan(initialRemaining);
    });
  });

  describe('skipTurn', () => {
    /**
     * AC-2.5: 연결 끊김 처리 (5초 대기 후 턴 스킵)
     * When: 플레이어가 연결을 잃으면
     * Then: 턴이 스킵된다
     */
    it('should skip turn for disconnected player (AC-2.5)', () => {
      const playerIds = [1, 2, 3, 4];
      const roomId = 1;
      const manager = service.createTurnManager(roomId, playerIds);

      const initialIndex = manager.currentTurnIndex;
      manager.skipTurn(playerIds[0]);

      expect(manager.currentTurnIndex).toBeGreaterThan(initialIndex);
    });
  });

  describe('createTurnManager', () => {
    /**
     * 턴 매니저를 생성한다
     */
    it('should create turn manager', () => {
      const playerIds = [1, 2, 3, 4];
      const roomId = 1;
      const manager = service.createTurnManager(roomId, playerIds);

      expect(manager).toBeDefined();
      expect(manager.roomId).toBe(roomId);
      expect(manager.turnOrder).toHaveLength(4);
      expect(manager.currentTurnIndex).toBe(0);
    });

    /**
     * 커스텀 턴 지속 시간으로 매니저를 생성한다
     */
    it('should create turn manager with custom duration', () => {
      const playerIds = [1, 2, 3, 4];
      const roomId = 1;
      const duration = 60;
      const manager = service.createTurnManager(roomId, playerIds, duration);

      expect(manager.turnDuration).toBe(duration);
    });
  });

  describe('getTurnManager', () => {
    /**
     * 저장된 턴 매니저를 조회한다
     */
    it('should retrieve stored turn manager', () => {
      const playerIds = [1, 2, 3, 4];
      const roomId = 1;
      const createdManager = service.createTurnManager(roomId, playerIds);

      const retrievedManager = service.getTurnManager(roomId);

      expect(retrievedManager).toEqual(createdManager);
    });

    /**
     * 없는 턴 매니저는 null을 반환한다
     */
    it('should return null for non-existent turn manager', () => {
      const manager = service.getTurnManager(9999);

      expect(manager).toBeNull();
    });
  });
});
