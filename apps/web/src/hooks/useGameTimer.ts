import { useState, useEffect, useCallback } from 'react';

/**
 * 게임 타이머 훅
 * 서버에서 전송하는 타이머 업데이트 이벤트를 처리합니다
 */
export function useGameTimer(phase: string, onTimeout?: () => void) {
  const [remainingTime, setRemainingTime] = useState(0);
  const [progress, setProgress] = useState(0);

  /**
   * 타이머 업데이트 처리
   */
  const handleTimerUpdate = useCallback((remaining: number, totalTime: number) => {
    setRemainingTime(remaining);
    const newProgress = ((totalTime - remaining) / totalTime) * 100;
    setProgress(Math.min(100, Math.max(0, newProgress)));

    // 타이머 완료 시 콜백
    if (remaining <= 0 && onTimeout) {
      onTimeout();
    }
  }, [onTimeout]);

  /**
   * 분:초 형식으로 포맷팅
   */
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  return {
    remainingTime,
    progress,
    handleTimerUpdate,
    formatTime,
  };
}
