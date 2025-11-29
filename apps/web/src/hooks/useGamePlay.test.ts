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

  describe('엣지 케이스 및 통합 시나리오', () => {
    it('라이어 키워드 맞추기 단계로 전환할 수 있어야 한다', () => {
      const { result } = renderHook(() => useGamePlay())

      act(() => {
        result.current.updateGameState({
          phase: 'LIAR_GUESS',
          currentTurn: null,
          turnOrder: [1, 2, 3],
          players: [],
          speeches: [],
          liarGuess: {
            liarId: 2,
            category: '과일',
            timeLimit: 30,
          },
        })
      })

      expect(result.current.gameState?.phase).toBe('LIAR_GUESS')
      expect(result.current.gameState?.liarGuess?.liarId).toBe(2)
      expect(result.current.gameState?.liarGuess?.category).toBe('과일')
      expect(result.current.gameState?.liarGuess?.timeLimit).toBe(30)
    })

    it('게임 결과를 표시할 수 있어야 한다', () => {
      const { result } = renderHook(() => useGamePlay())

      act(() => {
        result.current.updateGameState({
          phase: 'RESULT',
          currentTurn: null,
          turnOrder: [1, 2, 3],
          players: [],
          speeches: [],
          result: {
            winner: 'CIVILIAN',
            liarId: 2,
            liarCaughtByVote: true,
            liarGuessedKeyword: false,
            keyword: { word: '사과', category: '과일' },
            voteResults: [
              { targetId: 2, nickname: 'Player2', voteCount: 2 },
              { targetId: 1, nickname: 'Player1', voteCount: 1 },
            ],
          },
        })
      })

      expect(result.current.gameState?.phase).toBe('RESULT')
      expect(result.current.gameState?.result?.winner).toBe('CIVILIAN')
      expect(result.current.gameState?.result?.liarId).toBe(2)
      expect(result.current.gameState?.result?.liarCaughtByVote).toBe(true)
      expect(result.current.gameState?.result?.liarGuessedKeyword).toBe(false)
    })

    it('플레이어 연결 끊김 상태를 처리할 수 있어야 한다', () => {
      const { result } = renderHook(() => useGamePlay())

      act(() => {
        result.current.updateGameState({
          phase: 'DISCUSSION',
          currentTurn: 1,
          turnOrder: [1, 2, 3],
          players: [
            { id: 1, nickname: 'Player1', status: 'ACTIVE' },
            { id: 2, nickname: 'Player2', status: 'ACTIVE' },
            { id: 3, nickname: 'Player3', status: 'ACTIVE' },
          ],
          speeches: [],
        })
      })

      // 플레이어 2 연결 끊김
      act(() => {
        result.current.updateGameState({
          players: [
            { id: 1, nickname: 'Player1', status: 'ACTIVE' },
            { id: 2, nickname: 'Player2', status: 'DISCONNECTED' },
            { id: 3, nickname: 'Player3', status: 'ACTIVE' },
          ],
        })
      })

      expect(result.current.gameState?.players[1].status).toBe('DISCONNECTED')
    })

    it('전체 게임 플로우를 시뮬레이션할 수 있어야 한다', () => {
      const { result } = renderHook(() => useGamePlay())

      // 1. 게임 시작 - 토론 단계
      act(() => {
        result.current.updateGameState({
          phase: 'DISCUSSION',
          currentTurn: 1,
          turnOrder: [1, 2, 3],
          totalRounds: 2,
          currentRound: 1,
          totalTurns: 6,
          currentTurnNumber: 1,
          players: [
            { id: 1, nickname: 'Player1', status: 'ACTIVE' },
            { id: 2, nickname: 'Player2', status: 'ACTIVE' },
            { id: 3, nickname: 'Player3', status: 'ACTIVE' },
          ],
          speeches: [],
          keyword: { word: '사과', category: '과일' },
        })
      })

      expect(result.current.gameState?.phase).toBe('DISCUSSION')
      expect(result.current.isCurrentTurn(1)).toBe(true)

      // 2. 발언 추가
      act(() => {
        result.current.addSpeech(1, 'Player1', '이건 빨간색이에요')
        result.current.addSpeech(2, 'Player2', '달콤해요')
        result.current.addSpeech(3, 'Player3', '건강에 좋아요')
      })

      expect(result.current.gameState?.speeches).toHaveLength(3)

      // 3. 투표 단계로 전환
      act(() => {
        result.current.updateGameState({
          phase: 'VOTING',
          votes: [
            { voterId: 1, voteStatus: 'PENDING' },
            { voterId: 2, voteStatus: 'PENDING' },
            { voterId: 3, voteStatus: 'PENDING' },
          ]
        })
      })

      expect(result.current.gameState?.phase).toBe('VOTING')
      expect(result.current.gameState?.speeches).toHaveLength(3) // 발언 유지
      expect(result.current.gameState?.votes).toHaveLength(3)

      // 4. 투표 진행
      act(() => {
        result.current.updateGameState({
          votes: [
            { voterId: 1, voteStatus: 'VOTED' },
            { voterId: 2, voteStatus: 'VOTED' },
            { voterId: 3, voteStatus: 'PENDING' },
          ]
        })
      })

      expect(result.current.gameState?.votes?.filter(v => v.voteStatus === 'VOTED')).toHaveLength(2)

      // 5. 라이어 키워드 맞추기 단계
      act(() => {
        result.current.updateGameState({
          phase: 'LIAR_GUESS',
          liarGuess: {
            liarId: 2,
            category: '과일',
            timeLimit: 30,
          },
        })
      })

      expect(result.current.gameState?.phase).toBe('LIAR_GUESS')
      expect(result.current.gameState?.liarGuess?.liarId).toBe(2)

      // 6. 결과 단계
      act(() => {
        result.current.updateGameState({
          phase: 'RESULT',
          result: {
            winner: 'CIVILIAN',
            liarId: 2,
            liarCaughtByVote: true,
            liarGuessedKeyword: false,
            keyword: { word: '사과', category: '과일' },
            voteResults: [
              { targetId: 2, nickname: 'Player2', voteCount: 2 },
              { targetId: 1, nickname: 'Player1', voteCount: 1 },
            ],
          },
          scoreChanges: [
            { userId: 1, nickname: 'Player1', previousScore: 0, scoreChange: 10, newScore: 10, reason: '시민 승리' },
            { userId: 2, nickname: 'Player2', previousScore: 0, scoreChange: 0, newScore: 0, reason: '라이어 패배' },
            { userId: 3, nickname: 'Player3', previousScore: 0, scoreChange: 10, newScore: 10, reason: '시민 승리' },
          ],
        })
      })

      expect(result.current.gameState?.phase).toBe('RESULT')
      expect(result.current.gameState?.result?.winner).toBe('CIVILIAN')
      expect(result.current.gameState?.scoreChanges).toHaveLength(3)

      // 7. 게임 종료 후 초기화
      act(() => {
        result.current.resetGamePlay()
      })

      expect(result.current.gameState).toBeNull()
    })
  })
})
