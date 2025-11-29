import { Test, TestingModule } from '@nestjs/testing';
import { GameTimerService } from './game-timer.service';

/**
 * 게임 타이머 서비스 테스트
 * 서버 기준 시간 관리 및 자동 단계 전환을 검증합니다.
 */
describe('GameTimerService', () => {
  let service: GameTimerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameTimerService],
    }).compile();

    service = module.get<GameTimerService>(GameTimerService);
  });

  describe('타이머 생성 및 관리', () => {
    /**
     * 게임 타이머를 생성합니다
     */
    describe('startTimer', () => {
      it('타이머를 시작해야 한다', async () => {
        const roomId = 1;
        const duration = 60; // 60초

        service.startTimer(roomId, duration);

        const remaining = service.getRemainingTime(roomId);
        expect(remaining).toBeLessThanOrEqual(duration);
        expect(remaining).toBeGreaterThan(0);
      });

      it('같은 roomId에 대해 기존 타이머를 대체해야 한다', async () => {
        const roomId = 1;

        service.startTimer(roomId, 60);
        const firstRemaining = service.getRemainingTime(roomId);

        service.startTimer(roomId, 120);
        const secondRemaining = service.getRemainingTime(roomId);

        expect(secondRemaining).toBeGreaterThan(firstRemaining);
      });
    });

    /**
     * 타이머의 남은 시간을 조회합니다
     */
    describe('getRemainingTime', () => {
      it('남은 시간을 초 단위로 반환해야 한다', async () => {
        const roomId = 1;
        const duration = 60;

        service.startTimer(roomId, duration);

        const remaining = service.getRemainingTime(roomId);

        expect(remaining).toBeLessThanOrEqual(duration);
        expect(remaining).toBeGreaterThan(0);
      });

      it('존재하지 않는 타이머는 -1을 반환해야 한다', async () => {
        const remaining = service.getRemainingTime(9999);

        expect(remaining).toBe(-1);
      });

      it('타이머가 종료되면 0을 반환해야 한다', async () => {
        jest.useFakeTimers();

        const roomId = 1;
        service.startTimer(roomId, 10);

        jest.advanceTimersByTime(10000);

        const remaining = service.getRemainingTime(roomId);

        expect(remaining).toBeLessThanOrEqual(0);

        jest.useRealTimers();
      });
    });

    /**
     * AC-5.4: 타이머 정확도
     * 타이머가 정확한 간격으로 업데이트되는지 검증합니다
     */
    describe('타이머 정확도', () => {
      it('1초마다 정확하게 업데이트되어야 한다 (±50ms 오차)', async () => {
        jest.useFakeTimers();

        const roomId = 1;
        const duration = 10; // 10초
        const updateTimes: number[] = [];

        service.startTimer(roomId, duration);

        // 10초간 타이머 값 기록
        for (let i = 0; i < 10; i++) {
          jest.advanceTimersByTime(1000);
          updateTimes.push(Date.now());
        }

        // 간격 검증
        for (let i = 1; i < updateTimes.length; i++) {
          const interval = updateTimes[i] - updateTimes[i - 1];
          expect(interval).toBeGreaterThanOrEqual(950); // 950ms
          expect(interval).toBeLessThanOrEqual(1050); // 1050ms
        }

        jest.useRealTimers();
      });
    });

    /**
     * 타이머를 중지합니다
     */
    describe('stopTimer', () => {
      it('실행 중인 타이머를 중지해야 한다', async () => {
        const roomId = 1;

        service.startTimer(roomId, 60);
        const beforeStop = service.getRemainingTime(roomId);

        service.stopTimer(roomId);

        const remaining = service.getRemainingTime(roomId);

        expect(beforeStop).toBeGreaterThan(0);
        expect(remaining).toBe(-1);
      });

      it('존재하지 않는 타이머를 중지해도 에러가 나지 않아야 한다', async () => {
        expect(() => service.stopTimer(9999)).not.toThrow();
      });
    });

    /**
     * 타이머가 존재하는지 확인합니다
     */
    describe('hasTimer', () => {
      it('활성 타이머는 true를 반환해야 한다', async () => {
        const roomId = 1;

        service.startTimer(roomId, 60);

        expect(service.hasTimer(roomId)).toBe(true);
      });

      it('중지된 타이머는 false를 반환해야 한다', async () => {
        const roomId = 1;

        service.startTimer(roomId, 60);
        service.stopTimer(roomId);

        expect(service.hasTimer(roomId)).toBe(false);
      });
    });
  });

  describe('타이머 콜백', () => {
    /**
     * 타이머 종료 시 콜백이 실행됩니다
     */
    describe('onTimeout', () => {
      it('타이머가 종료되면 콜백을 실행해야 한다', async () => {
        jest.useFakeTimers();

        const roomId = 1;
        const callback = jest.fn();

        service.startTimer(roomId, 5);
        service.onTimeout(roomId, callback);

        jest.advanceTimersByTime(5000);
        jest.runAllTimers();

        expect(callback).toHaveBeenCalled();

        jest.useRealTimers();
      });

      it('여러 콜백을 등록할 수 있어야 한다', async () => {
        jest.useFakeTimers();

        const roomId = 1;
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        service.startTimer(roomId, 5);
        service.onTimeout(roomId, callback1);
        service.onTimeout(roomId, callback2);

        jest.advanceTimersByTime(5000);
        jest.runAllTimers();

        expect(callback1).toHaveBeenCalled();
        expect(callback2).toHaveBeenCalled();

        jest.useRealTimers();
      });

      it('타이머가 없으면 콜백 등록이 실패해야 한다', async () => {
        const callback = jest.fn();

        const result = service.onTimeout(9999, callback);

        expect(result).toBe(false);
      });
    });
  });

  describe('진행률 계산', () => {
    /**
     * 타이머의 진행률을 계산합니다
     */
    describe('getProgress', () => {
      it('진행률을 0-100 범위로 반환해야 한다', async () => {
        jest.useFakeTimers();

        const roomId = 1;
        const duration = 100; // 100초

        service.startTimer(roomId, duration);

        // 25초 경과
        jest.advanceTimersByTime(25000);
        const progress25 = service.getProgress(roomId);

        // 50초 경과
        jest.advanceTimersByTime(25000);
        const progress50 = service.getProgress(roomId);

        // 75초 경과
        jest.advanceTimersByTime(25000);
        const progress75 = service.getProgress(roomId);

        expect(progress25).toBeCloseTo(25, 1);
        expect(progress50).toBeCloseTo(50, 1);
        expect(progress75).toBeCloseTo(75, 1);

        jest.useRealTimers();
      });

      it('존재하지 않는 타이머는 -1을 반환해야 한다', async () => {
        const progress = service.getProgress(9999);

        expect(progress).toBe(-1);
      });

      it('타이머가 종료 직전에는 100에 가까운 값을 반환해야 한다', async () => {
        jest.useFakeTimers();

        const roomId = 1;

        service.startTimer(roomId, 10);
        // 9초 경과 - 타이머 종료 직전
        jest.advanceTimersByTime(9000);

        const progress = service.getProgress(roomId);

        // 90% 진행률이어야 함
        expect(progress).toBeGreaterThanOrEqual(90);
        expect(progress).toBeLessThanOrEqual(100);

        jest.useRealTimers();
      });

      it('타이머가 종료되면 (삭제된 후) -1을 반환해야 한다', async () => {
        jest.useFakeTimers();

        const roomId = 1;
        const callback = jest.fn();

        service.startTimer(roomId, 10);
        service.onTimeout(roomId, callback);

        // 타이머 종료 시간 경과
        jest.advanceTimersByTime(10000);
        jest.runAllTimers();

        // 타이머 종료 후 삭제되어 -1 반환
        const progress = service.getProgress(roomId);
        expect(progress).toBe(-1);

        jest.useRealTimers();
      });
    });
  });

  describe('타이머 이벤트 스트림', () => {
    /**
     * 1초마다 타이머 업데이트 이벤트를 발생시킵니다
     */
    describe('onEverySecond', () => {
      it('1초마다 콜백이 호출되어야 한다', async () => {
        jest.useFakeTimers();

        const roomId = 1;
        const callback = jest.fn();

        service.startTimer(roomId, 5);
        service.onEverySecond(roomId, callback);

        jest.advanceTimersByTime(5000);
        jest.runAllTimers();

        // 최소 4번은 호출되어야 함 (1초, 2초, 3초, 4초... 그리고 5초 종료)
        expect(callback.mock.calls.length).toBeGreaterThanOrEqual(4);

        jest.useRealTimers();
      });

      it('콜백에서 남은 시간을 받아야 한다', async () => {
        jest.useFakeTimers();

        const roomId = 1;
        const callback = jest.fn();

        service.startTimer(roomId, 3);
        service.onEverySecond(roomId, callback);

        jest.advanceTimersByTime(1000);
        jest.runAllTimers();

        expect(callback).toHaveBeenCalledWith(expect.any(Number));

        jest.useRealTimers();
      });
    });
  });

  describe('여러 타이머 관리', () => {
    /**
     * 여러 개의 타이머를 동시에 관리합니다
     */
    describe('멀티타이머 지원', () => {
      it('여러 roomId의 타이머를 독립적으로 시작할 수 있어야 한다', async () => {
        // 두 개의 독립적인 타이머 생성
        service.startTimer(1, 10);
        service.startTimer(2, 20);

        // 두 타이머 모두 존재해야 함
        expect(service.hasTimer(1)).toBe(true);
        expect(service.hasTimer(2)).toBe(true);

        // 각 타이머의 남은 시간이 다르게 설정되어야 함
        const remaining1 = service.getRemainingTime(1);
        const remaining2 = service.getRemainingTime(2);

        expect(remaining1).toBeLessThanOrEqual(10);
        expect(remaining2).toBeLessThanOrEqual(20);
        expect(remaining2).toBeGreaterThan(remaining1);
      });

      it('한 타이머 종료가 다른 타이머에 영향을 주지 않아야 한다', async () => {
        jest.useFakeTimers();

        const room1Callback = jest.fn();

        // room1만 타이머 시작
        service.startTimer(1, 3);
        service.onTimeout(1, room1Callback);

        // room2 타이머 시작 (더 긴 시간)
        service.startTimer(2, 100);

        // room1 타이머가 종료될 때까지 대기
        jest.advanceTimersByTime(3000);
        jest.runOnlyPendingTimers();

        // room1 콜백이 호출되었는지 확인
        expect(room1Callback).toHaveBeenCalled();

        // room1은 종료되어 삭제됨
        expect(service.hasTimer(1)).toBe(false);

        // room2는 여전히 존재
        expect(service.hasTimer(2)).toBe(true);

        jest.useRealTimers();
      });

      it('한 타이머를 중지해도 다른 타이머는 영향을 받지 않아야 한다', async () => {
        jest.useFakeTimers();

        service.startTimer(1, 10);
        service.startTimer(2, 10);

        service.stopTimer(1);

        expect(service.hasTimer(1)).toBe(false);
        expect(service.hasTimer(2)).toBe(true);

        jest.useRealTimers();
      });
    });
  });

  describe('타이머 초기화', () => {
    /**
     * 타이머 서비스의 모든 상태를 초기화합니다
     */
    describe('clearAllTimers', () => {
      it('모든 타이머를 삭제해야 한다', async () => {
        service.startTimer(1, 60);
        service.startTimer(2, 60);
        service.startTimer(3, 60);

        service.clearAllTimers();

        expect(service.hasTimer(1)).toBe(false);
        expect(service.hasTimer(2)).toBe(false);
        expect(service.hasTimer(3)).toBe(false);
      });
    });
  });
});
