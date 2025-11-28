import { Injectable } from '@nestjs/common';

/**
 * 타이머 정보
 */
interface TimerInfo {
  roomId: number;
  startTime: number; // 타이머 시작 시간 (ms)
  duration: number; // 타이머 지속 시간 (초)
  timeoutCallbacks: (() => void)[]; // 타이머 종료 시 콜백
  intervalCallbacks: ((remaining: number) => void)[]; // 1초마다 호출될 콜백
  timeoutId?: NodeJS.Timeout; // setTimeout ID
}

/**
 * 게임 타이머 서비스
 * 서버 기준 시간으로 게임 타이머를 관리합니다.
 * - 재귀 setTimeout으로 높은 정확도 유지
 * - 1초마다 타이머 업데이트 이벤트 발생
 * - 여러 게임 방의 타이머를 독립적으로 관리
 */
@Injectable()
export class GameTimerService {
  private timers: Map<number, TimerInfo> = new Map();

  /**
   * 타이머를 시작합니다
   * @param roomId 방 ID
   * @param duration 타이머 지속 시간 (초)
   */
  startTimer(roomId: number, duration: number): void {
    // 기존 타이머가 있으면 중지
    this.stopTimer(roomId);

    const timerInfo: TimerInfo = {
      roomId,
      startTime: Date.now(),
      duration,
      timeoutCallbacks: [],
      intervalCallbacks: [],
    };

    this.timers.set(roomId, timerInfo);

    // 재귀 setTimeout으로 정확도 향상
    this.scheduleNextTick(roomId);
  }

  /**
   * 다음 1초 틱을 예약합니다 (재귀 구현)
   * @param roomId 방 ID
   */
  private scheduleNextTick(roomId: number): void {
    const timerInfo = this.timers.get(roomId);
    if (!timerInfo) return;

    const remaining = this.getRemainingTime(roomId);

    // 타이머가 종료되었으면 콜백 실행
    if (remaining <= 0) {
      this.executeTimeoutCallbacks(roomId);
      this.stopTimer(roomId);
      return;
    }

    // 1초마다 인터벌 콜백 실행
    timerInfo.intervalCallbacks.forEach((callback) => {
      try {
        callback(remaining);
      } catch (error) {
        console.error(`Error in interval callback: ${error}`);
      }
    });

    // 다음 틱 예약 (1초 = 1000ms)
    setTimeout(() => {
      this.scheduleNextTick(roomId);
    }, 1000);
  }

  /**
   * 타이머의 남은 시간을 반환합니다 (초 단위)
   * @param roomId 방 ID
   * @returns 남은 시간 (초) 또는 -1 (타이머 없음)
   */
  getRemainingTime(roomId: number): number {
    const timerInfo = this.timers.get(roomId);
    if (!timerInfo) return -1;

    const elapsedMs = Date.now() - timerInfo.startTime;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const remaining = timerInfo.duration - elapsedSeconds;

    return Math.max(0, remaining);
  }

  /**
   * 타이머의 진행률을 반환합니다 (0-100)
   * @param roomId 방 ID
   * @returns 진행률 (0-100) 또는 -1 (타이머 없음)
   */
  getProgress(roomId: number): number {
    const timerInfo = this.timers.get(roomId);
    if (!timerInfo) return -1;

    const remaining = this.getRemainingTime(roomId);
    const progress = ((timerInfo.duration - remaining) / timerInfo.duration) * 100;

    return Math.min(100, Math.max(0, progress));
  }

  /**
   * 타이머를 중지합니다
   * @param roomId 방 ID
   */
  stopTimer(roomId: number): void {
    const timerInfo = this.timers.get(roomId);
    if (!timerInfo) return;

    if (timerInfo.timeoutId) {
      clearTimeout(timerInfo.timeoutId);
    }

    this.timers.delete(roomId);
  }

  /**
   * 타이머가 존재하는지 확인합니다
   * @param roomId 방 ID
   * @returns 존재 여부
   */
  hasTimer(roomId: number): boolean {
    return this.timers.has(roomId);
  }

  /**
   * 타이머 종료 콜백을 등록합니다
   * @param roomId 방 ID
   * @param callback 콜백 함수
   * @returns 성공 여부
   */
  onTimeout(roomId: number, callback: () => void): boolean {
    const timerInfo = this.timers.get(roomId);
    if (!timerInfo) return false;

    timerInfo.timeoutCallbacks.push(callback);
    return true;
  }

  /**
   * 타이머 종료 콜백을 실행합니다
   * @param roomId 방 ID
   */
  private executeTimeoutCallbacks(roomId: number): void {
    const timerInfo = this.timers.get(roomId);
    if (!timerInfo) return;

    timerInfo.timeoutCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error(`Error in timeout callback: ${error}`);
      }
    });
  }

  /**
   * 매초 콜백을 등록합니다
   * @param roomId 방 ID
   * @param callback 콜백 함수 (남은 시간을 파라미터로 받음)
   * @returns 성공 여부
   */
  onEverySecond(roomId: number, callback: (remaining: number) => void): boolean {
    const timerInfo = this.timers.get(roomId);
    if (!timerInfo) return false;

    timerInfo.intervalCallbacks.push(callback);
    return true;
  }

  /**
   * 모든 타이머를 초기화합니다
   */
  clearAllTimers(): void {
    this.timers.forEach((timerInfo) => {
      if (timerInfo.timeoutId) {
        clearTimeout(timerInfo.timeoutId);
      }
    });

    this.timers.clear();
  }

  /**
   * 타이머 정보를 조회합니다 (디버깅용)
   * @param roomId 방 ID
   * @returns 타이머 정보
   */
  getTimerInfo(roomId: number): Partial<TimerInfo> | null {
    const timerInfo = this.timers.get(roomId);
    if (!timerInfo) return null;

    return {
      roomId: timerInfo.roomId,
      duration: timerInfo.duration,
      startTime: timerInfo.startTime,
    };
  }
}
