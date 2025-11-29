// useGamePlay 훅 테스트
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGamePlay } from './useGamePlay'

describe('useGamePlay', () => {
  describe('초기 상태', () => {
    it('gameState가 null로 초기화되어야 한다', () => {
      const { result } = renderHook(() => useGamePlay())
      expect(result.current.gameState).toBeNull()
    })
  })

  describe('updateGameState', () => {
    it('게임 상태를 업데이트할 수 있어야 한다', () => {
      const { result } = renderHook(() => useGamePlay())

      act(() => {
        result.current.updateGameState({
          phase: 'DISCUSSION',
          currentTurn: 1,
          turnOrder: [1, 2, 3],
          players: [
            { id: 1, nickname: 'Player1', status: 'ACTIVE' },
            { id: 2, nickname: 'Player2', status: 'ACTIVE' },
          ],
          speeches: [],
        })
      })

      expect(result.current.gameState).not.toBeNull()
      expect(result.current.gameState?.phase).toBe('DISCUSSION')
      expect(result.current.gameState?.currentTurn).toBe(1)
      expect(result.current.gameState?.players).toHaveLength(2)
    })

    it('기존 상태에 부분 업데이트가 가능해야 한다', () => {
      const { result } = renderHook(() => useGamePlay())

      // 초기 상태 설정
      act(() => {
        result.current.updateGameState({
          phase: 'DISCUSSION',
          currentTurn: 1,
          turnOrder: [1, 2, 3],
          players: [{ id: 1, nickname: 'Player1', status: 'ACTIVE' }],
          speeches: [],
        })
      })

      // 부분 업데이트
      act(() => {
        result.current.updateGameState({
          phase: 'VOTING',
          currentTurn: 2,
        })
      })

      expect(result.current.gameState?.phase).toBe('VOTING')
      expect(result.current.gameState?.currentTurn).toBe(2)
      expect(result.current.gameState?.players).toHaveLength(1) // 유지됨
    })

    it('null 상태에서도 기본값으로 상태가 설정되어야 한다', () => {
      const { result } = renderHook(() => useGamePlay())

      act(() => {
        result.current.updateGameState({
          phase: 'VOTING',
        })
      })

      expect(result.current.gameState).not.toBeNull()
      expect(result.current.gameState?.phase).toBe('VOTING')
      expect(result.current.gameState?.speeches).toEqual([])
      expect(result.current.gameState?.players).toEqual([])
    })
  })

  describe('addSpeech', () => {
    it('새로운 발언을 추가할 수 있어야 한다', () => {
      const { result } = renderHook(() => useGamePlay())

      // 초기 상태 설정
      act(() => {
        result.current.updateGameState({
          phase: 'DISCUSSION',
          currentTurn: 1,
          turnOrder: [1, 2],
          players: [{ id: 1, nickname: 'Player1', status: 'ACTIVE' }],
          speeches: [],
        })
      })

      // 발언 추가
      act(() => {
        result.current.addSpeech(1, 'Player1', '안녕하세요!')
      })

      expect(result.current.gameState?.speeches).toHaveLength(1)
      expect(result.current.gameState?.speeches[0].userId).toBe(1)
      expect(result.current.gameState?.speeches[0].nickname).toBe('Player1')
      expect(result.current.gameState?.speeches[0].content).toBe('안녕하세요!')
      expect(result.current.gameState?.speeches[0].timestamp).toBeInstanceOf(Date)
    })

    it('여러 발언을 순차적으로 추가할 수 있어야 한다', () => {
      const { result } = renderHook(() => useGamePlay())

      act(() => {
        result.current.updateGameState({
          phase: 'DISCUSSION',
          currentTurn: 1,
          turnOrder: [1, 2],
          players: [],
          speeches: [],
        })
      })

      act(() => {
        result.current.addSpeech(1, 'Player1', '첫 번째 발언')
      })

      act(() => {
        result.current.addSpeech(2, 'Player2', '두 번째 발언')
      })

      expect(result.current.gameState?.speeches).toHaveLength(2)
      expect(result.current.gameState?.speeches[0].content).toBe('첫 번째 발언')
      expect(result.current.gameState?.speeches[1].content).toBe('두 번째 발언')
    })

    it('gameState가 null이면 발언을 추가하지 않아야 한다', () => {
      const { result } = renderHook(() => useGamePlay())

      act(() => {
        result.current.addSpeech(1, 'Player1', '테스트 발언')
      })

      expect(result.current.gameState).toBeNull()
    })
  })

  describe('isCurrentTurn', () => {
    it('현재 턴 플레이어를 올바르게 판별해야 한다', () => {
      const { result } = renderHook(() => useGamePlay())

      act(() => {
        result.current.updateGameState({
          phase: 'DISCUSSION',
          currentTurn: 1,
          turnOrder: [1, 2, 3],
          players: [],
          speeches: [],
        })
      })

      expect(result.current.isCurrentTurn(1)).toBe(true)
      expect(result.current.isCurrentTurn(2)).toBe(false)
      expect(result.current.isCurrentTurn(3)).toBe(false)
    })

    it('gameState가 null이면 false를 반환해야 한다', () => {
      const { result } = renderHook(() => useGamePlay())
      expect(result.current.isCurrentTurn(1)).toBe(false)
    })
  })

  describe('resetGamePlay', () => {
    it('게임 상태를 null로 리셋해야 한다', () => {
      const { result } = renderHook(() => useGamePlay())

      // 상태 설정
      act(() => {
        result.current.updateGameState({
          phase: 'DISCUSSION',
          currentTurn: 1,
          turnOrder: [1, 2],
          players: [],
          speeches: [],
        })
      })

      expect(result.current.gameState).not.toBeNull()

      // 리셋
      act(() => {
        result.current.resetGamePlay()
      })

      expect(result.current.gameState).toBeNull()
    })
  })
})
