import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { LiarGuessPhase } from './LiarGuessPhase'
import { GamePlayState } from '@/hooks/useGamePlay'

describe('LiarGuessPhase', () => {
  let mockGameState: GamePlayState
  let mockOnGuessKeyword: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    mockOnGuessKeyword = vi.fn()

    mockGameState = {
      phase: 'LIAR_GUESS',
      currentTurn: null,
      turnOrder: [1, 2, 3],
      totalRounds: 1,
      currentRound: 1,
      totalTurns: 3,
      currentTurnNumber: 1,
      players: [
        { id: 1, nickname: 'Player1', status: 'ACTIVE' },
        { id: 2, nickname: 'Player2', status: 'ACTIVE', role: 'LIAR' },
        { id: 3, nickname: 'Player3', status: 'ACTIVE' },
      ],
      speeches: [],
      liarGuess: {
        liarId: 2,
        category: 'Fruit',
        timeLimit: 30,
      },
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering and initial state', () => {
    it('should render header and basic UI', () => {
      render(
        <LiarGuessPhase
          gameState={mockGameState}
          userId={1}
          userRole="CIVILIAN"
          onGuessKeyword={mockOnGuessKeyword}
        />
      )

      expect(screen.getByText('LIAR CAUGHT!')).toBeInTheDocument()
    })

    it('should display category correctly', () => {
      render(
        <LiarGuessPhase
          gameState={mockGameState}
          userId={1}
          userRole="CIVILIAN"
          onGuessKeyword={mockOnGuessKeyword}
        />
      )

      expect(screen.getByText('Fruit')).toBeInTheDocument()
      expect(screen.getByText('CATEGORY')).toBeInTheDocument()
    })

    it('should display initial timer', () => {
      render(
        <LiarGuessPhase
          gameState={mockGameState}
          userId={1}
          userRole="CIVILIAN"
          onGuessKeyword={mockOnGuessKeyword}
        />
      )

      expect(screen.getByText(/30/)).toBeInTheDocument()
    })
  })

  describe('liar role - keyword input', () => {
    it('should show keyword input UI for liar', () => {
      render(
        <LiarGuessPhase
          gameState={mockGameState}
          userId={2}
          userRole="LIAR"
          onGuessKeyword={mockOnGuessKeyword}
        />
      )

      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('should allow typing keyword', () => {
      render(
        <LiarGuessPhase
          gameState={mockGameState}
          userId={2}
          userRole="LIAR"
          onGuessKeyword={mockOnGuessKeyword}
        />
      )

      const input = screen.getByRole('textbox') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'Apple' } })

      expect(input.value).toBe('Apple')
    })

    it('should call onGuessKeyword on submit', () => {
      render(
        <LiarGuessPhase
          gameState={mockGameState}
          userId={2}
          userRole="LIAR"
          onGuessKeyword={mockOnGuessKeyword}
        />
      )

      const input = screen.getByRole('textbox')
      const button = screen.getByRole('button')

      fireEvent.change(input, { target: { value: 'Apple' } })
      fireEvent.click(button)

      expect(mockOnGuessKeyword).toHaveBeenCalledWith('Apple')
      expect(mockOnGuessKeyword).toHaveBeenCalledTimes(1)
    })

    it('should submit on Enter key', () => {
      render(
        <LiarGuessPhase
          gameState={mockGameState}
          userId={2}
          userRole="LIAR"
          onGuessKeyword={mockOnGuessKeyword}
        />
      )

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'Banana' } })
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 })

      expect(mockOnGuessKeyword).toHaveBeenCalledWith('Banana')
    })

    it('should not submit empty keyword', () => {
      render(
        <LiarGuessPhase
          gameState={mockGameState}
          userId={2}
          userRole="LIAR"
          onGuessKeyword={mockOnGuessKeyword}
        />
      )

      const button = screen.getByRole('button') as HTMLButtonElement

      expect(button.disabled).toBe(true)

      fireEvent.click(button)
      expect(mockOnGuessKeyword).not.toHaveBeenCalled()
    })

    it('should trim whitespace on submit', () => {
      render(
        <LiarGuessPhase
          gameState={mockGameState}
          userId={2}
          userRole="LIAR"
          onGuessKeyword={mockOnGuessKeyword}
        />
      )

      const input = screen.getByRole('textbox')
      const button = screen.getByRole('button')

      fireEvent.change(input, { target: { value: '  Grape  ' } })
      fireEvent.click(button)

      expect(mockOnGuessKeyword).toHaveBeenCalledWith('Grape')
    })
  })

  describe('civilian role - waiting screen', () => {
    it('should show waiting screen for civilian', () => {
      render(
        <LiarGuessPhase
          gameState={mockGameState}
          userId={1}
          userRole="CIVILIAN"
          onGuessKeyword={mockOnGuessKeyword}
        />
      )

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })
  })

  describe('timer behavior', () => {
    it('should display initial time correctly', () => {
      render(
        <LiarGuessPhase
          gameState={mockGameState}
          userId={2}
          userRole="LIAR"
          onGuessKeyword={mockOnGuessKeyword}
        />
      )

      expect(screen.getByText(/30/)).toBeInTheDocument()
    })

    it('should display custom time limit correctly', () => {
      const customState = {
        ...mockGameState,
        liarGuess: { ...mockGameState.liarGuess!, timeLimit: 60 }
      }

      render(
        <LiarGuessPhase
          gameState={customState}
          userId={2}
          userRole="LIAR"
          onGuessKeyword={mockOnGuessKeyword}
        />
      )

      expect(screen.getByText(/60/)).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should render when userRole is null', () => {
      render(
        <LiarGuessPhase
          gameState={mockGameState}
          userId={1}
          userRole={null}
          onGuessKeyword={mockOnGuessKeyword}
        />
      )

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('should render with default values when liarGuess is undefined', () => {
      const stateWithoutLiarGuess = {
        ...mockGameState,
        liarGuess: undefined,
      }

      render(
        <LiarGuessPhase
          gameState={stateWithoutLiarGuess}
          userId={1}
          userRole="CIVILIAN"
          onGuessKeyword={mockOnGuessKeyword}
        />
      )

      expect(screen.getByText('???')).toBeInTheDocument()
      expect(screen.getByText(/30/)).toBeInTheDocument()
    })
  })
})
