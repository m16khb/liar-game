// useGameTimer 훅 테스트
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameTimer } from './useGameTimer'

describe('useGameTimer', () => {
  describe('초기 상태', () => {
    it('remainingTime이 0으로 초기화되어야 한다', () => {
      const { result } = renderHook(() => useGameTimer('DISCUSSION'))
      expect(result.current.remainingTime).toBe(0)
    })

    it('progress가 0으로 초기화되어야 한다', () => {
      const { result } = renderHook(() => useGameTimer('DISCUSSION'))
      expect(result.current.progress).toBe(0)
    })
  })

  describe('handleTimerUpdate', () => {
    it('남은 시간과 진행률을 업데이트해야 한다', () => {
      const { result } = renderHook(() => useGameTimer('DISCUSSION'))

      act(() => {
        result.current.handleTimerUpdate(30, 60) // 60초 중 30초 남음
      })

      expect(result.current.remainingTime).toBe(30)
      expect(result.current.progress).toBe(50) // 50% 진행
    })

    it('진행률이 0-100 범위로 제한되어야 한다', () => {
      const { result } = renderHook(() => useGameTimer('DISCUSSION'))

      act(() => {
        result.current.handleTimerUpdate(-10, 60) // 음수 시간
      })

      expect(result.current.progress).toBeGreaterThanOrEqual(0)
      expect(result.current.progress).toBeLessThanOrEqual(100)
    })

    it('타이머가 0이 되면 onTimeout 콜백이 호출되어야 한다', () => {
      const onTimeout = vi.fn()
      const { result } = renderHook(() => useGameTimer('DISCUSSION', onTimeout))

      act(() => {
        result.current.handleTimerUpdate(0, 60)
      })

      expect(onTimeout).toHaveBeenCalledTimes(1)
    })

    it('남은 시간이 있으면 onTimeout이 호출되지 않아야 한다', () => {
      const onTimeout = vi.fn()
      const { result } = renderHook(() => useGameTimer('DISCUSSION', onTimeout))

      act(() => {
        result.current.handleTimerUpdate(30, 60)
      })

      expect(onTimeout).not.toHaveBeenCalled()
    })
  })

  describe('formatTime', () => {
    it('초를 분:초 형식으로 포맷해야 한다', () => {
      const { result } = renderHook(() => useGameTimer('DISCUSSION'))

      expect(result.current.formatTime(0)).toBe('00:00')
      expect(result.current.formatTime(30)).toBe('00:30')
      expect(result.current.formatTime(60)).toBe('01:00')
      expect(result.current.formatTime(90)).toBe('01:30')
      expect(result.current.formatTime(125)).toBe('02:05')
      expect(result.current.formatTime(600)).toBe('10:00')
    })

    it('한 자리 숫자에 0 패딩을 적용해야 한다', () => {
      const { result } = renderHook(() => useGameTimer('DISCUSSION'))

      expect(result.current.formatTime(5)).toBe('00:05')
      expect(result.current.formatTime(65)).toBe('01:05')
    })
  })
})
