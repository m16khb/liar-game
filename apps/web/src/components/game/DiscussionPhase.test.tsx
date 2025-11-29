// DiscussionPhase 컴포넌트 테스트
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiscussionPhase } from './DiscussionPhase'
import { GamePlayState } from '@/hooks/useGamePlay'

describe('DiscussionPhase', () => {
  const mockOnSpeech = vi.fn()

  const defaultGameState: GamePlayState = {
    phase: 'DISCUSSION',
    currentTurn: 1,
    turnOrder: [1, 2, 3],
    players: [
      { id: 1, nickname: 'Player1', status: 'ACTIVE' },
      { id: 2, nickname: 'Player2', status: 'ACTIVE' },
      { id: 3, nickname: 'Player3', status: 'ACTIVE' },
    ],
    speeches: [],
    keyword: { word: '사과', category: '과일' },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('렌더링', () => {
    it('토론 단계 헤더를 렌더링해야 한다', () => {
      render(
        <DiscussionPhase
          gameState={defaultGameState}
          userId={1}
          userNickname="Player1"
          userRole="CIVILIAN"
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          isCurrentTurn={true}
          onSpeech={mockOnSpeech}
        />,
      )

      expect(screen.getByText('DISCUSSION')).toBeInTheDocument()
    })

    it('사용자 역할을 표시해야 한다', () => {
      render(
        <DiscussionPhase
          gameState={defaultGameState}
          userId={1}
          userNickname="Player1"
          userRole="CIVILIAN"
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          isCurrentTurn={true}
          onSpeech={mockOnSpeech}
        />,
      )

      expect(screen.getByText('시민')).toBeInTheDocument()
    })

    it('라이어 역할을 올바르게 표시해야 한다', () => {
      render(
        <DiscussionPhase
          gameState={defaultGameState}
          userId={1}
          userNickname="Player1"
          userRole="LIAR"
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          isCurrentTurn={true}
          onSpeech={mockOnSpeech}
        />,
      )

      expect(screen.getByText('라이어')).toBeInTheDocument()
    })

    it('남은 시간을 표시해야 한다', () => {
      render(
        <DiscussionPhase
          gameState={defaultGameState}
          userId={1}
          userNickname="Player1"
          userRole="CIVILIAN"
          remainingTime={90}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          isCurrentTurn={true}
          onSpeech={mockOnSpeech}
        />,
      )

      expect(screen.getByText('1:30')).toBeInTheDocument()
    })

    it('현재 발언 중인 플레이어를 표시해야 한다', () => {
      render(
        <DiscussionPhase
          gameState={defaultGameState}
          userId={2}
          userNickname="Player2"
          userRole="CIVILIAN"
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          isCurrentTurn={false}
          onSpeech={mockOnSpeech}
        />,
      )

      expect(screen.getByText('Player1')).toBeInTheDocument()
    })

    it('다음 차례 플레이어를 표시해야 한다', () => {
      render(
        <DiscussionPhase
          gameState={defaultGameState}
          userId={1}
          userNickname="Player1"
          userRole="CIVILIAN"
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          isCurrentTurn={true}
          onSpeech={mockOnSpeech}
        />,
      )

      // Player1이 현재이면 다음은 Player2
      expect(screen.getByText('▶ 다음 차례')).toBeInTheDocument()
    })
  })

  describe('발언 목록', () => {
    it('발언이 없을 때 안내 메시지를 표시해야 한다', () => {
      render(
        <DiscussionPhase
          gameState={defaultGameState}
          userId={1}
          userNickname="Player1"
          userRole="CIVILIAN"
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          isCurrentTurn={true}
          onSpeech={mockOnSpeech}
        />,
      )

      expect(screen.getByText('아직 발언이 없습니다')).toBeInTheDocument()
    })

    it('발언 목록을 표시해야 한다', () => {
      const gameStateWithSpeeches: GamePlayState = {
        ...defaultGameState,
        speeches: [
          { userId: 1, nickname: 'Player1', content: '첫 번째 발언', timestamp: new Date() },
          { userId: 2, nickname: 'Player2', content: '두 번째 발언', timestamp: new Date() },
        ],
      }

      render(
        <DiscussionPhase
          gameState={gameStateWithSpeeches}
          userId={1}
          userNickname="Player1"
          userRole="CIVILIAN"
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          isCurrentTurn={true}
          onSpeech={mockOnSpeech}
        />,
      )

      expect(screen.getByText('첫 번째 발언')).toBeInTheDocument()
      expect(screen.getByText('두 번째 발언')).toBeInTheDocument()
    })

    it('본인 발언에 "나" 태그를 표시해야 한다', () => {
      const gameStateWithSpeeches: GamePlayState = {
        ...defaultGameState,
        speeches: [
          { userId: 1, nickname: 'Player1', content: '내 발언', timestamp: new Date() },
        ],
      }

      render(
        <DiscussionPhase
          gameState={gameStateWithSpeeches}
          userId={1}
          userNickname="Player1"
          userRole="CIVILIAN"
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          isCurrentTurn={true}
          onSpeech={mockOnSpeech}
        />,
      )

      expect(screen.getByText('나')).toBeInTheDocument()
    })
  })

  describe('발언 입력', () => {
    it('현재 턴일 때 발언 입력 영역이 활성화되어야 한다', () => {
      render(
        <DiscussionPhase
          gameState={defaultGameState}
          userId={1}
          userNickname="Player1"
          userRole="CIVILIAN"
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          isCurrentTurn={true}
          onSpeech={mockOnSpeech}
        />,
      )

      expect(screen.getByText('▶ 당신의 차례입니다!')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/발언을 입력하세요/)).toBeInTheDocument()
    })

    it('현재 턴이 아닐 때 대기 메시지를 표시해야 한다', () => {
      const gameStatePlayer2Turn: GamePlayState = {
        ...defaultGameState,
        currentTurn: 2,
      }

      render(
        <DiscussionPhase
          gameState={gameStatePlayer2Turn}
          userId={1}
          userNickname="Player1"
          userRole="CIVILIAN"
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          isCurrentTurn={false}
          onSpeech={mockOnSpeech}
        />,
      )

      expect(screen.getByText(/Player2님의 발언을 기다리는 중/)).toBeInTheDocument()
    })

    it('발언을 입력하고 제출할 수 있어야 한다', async () => {
      const user = userEvent.setup()

      render(
        <DiscussionPhase
          gameState={defaultGameState}
          userId={1}
          userNickname="Player1"
          userRole="CIVILIAN"
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          isCurrentTurn={true}
          onSpeech={mockOnSpeech}
        />,
      )

      const textarea = screen.getByPlaceholderText(/발언을 입력하세요/)
      await user.type(textarea, '테스트 발언입니다')

      const submitButton = screen.getByText('SEND MESSAGE')
      fireEvent.click(submitButton)

      expect(mockOnSpeech).toHaveBeenCalledWith('테스트 발언입니다')
    })

    it('빈 발언은 제출되지 않아야 한다', async () => {
      render(
        <DiscussionPhase
          gameState={defaultGameState}
          userId={1}
          userNickname="Player1"
          userRole="CIVILIAN"
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          isCurrentTurn={true}
          onSpeech={mockOnSpeech}
        />,
      )

      const submitButton = screen.getByText('TYPE MESSAGE FIRST')
      expect(submitButton.closest('button')).toBeDisabled()
    })

    it('Enter 키로 발언을 제출할 수 있어야 한다', async () => {
      const user = userEvent.setup()

      render(
        <DiscussionPhase
          gameState={defaultGameState}
          userId={1}
          userNickname="Player1"
          userRole="CIVILIAN"
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          isCurrentTurn={true}
          onSpeech={mockOnSpeech}
        />,
      )

      const textarea = screen.getByPlaceholderText(/발언을 입력하세요/)
      await user.type(textarea, '엔터로 제출{enter}')

      expect(mockOnSpeech).toHaveBeenCalled()
    })

    it('Shift+Enter는 줄바꿈으로 처리되어야 한다', async () => {
      const user = userEvent.setup()

      render(
        <DiscussionPhase
          gameState={defaultGameState}
          userId={1}
          userNickname="Player1"
          userRole="CIVILIAN"
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          isCurrentTurn={true}
          onSpeech={mockOnSpeech}
        />,
      )

      const textarea = screen.getByPlaceholderText(/발언을 입력하세요/)
      await user.type(textarea, '첫째 줄{shift>}{enter}{/shift}둘째 줄')

      expect(mockOnSpeech).not.toHaveBeenCalled()
    })

    it('글자수 카운터를 표시해야 한다', async () => {
      const user = userEvent.setup()

      render(
        <DiscussionPhase
          gameState={defaultGameState}
          userId={1}
          userNickname="Player1"
          userRole="CIVILIAN"
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          isCurrentTurn={true}
          onSpeech={mockOnSpeech}
        />,
      )

      const textarea = screen.getByPlaceholderText(/발언을 입력하세요/)
      await user.type(textarea, '12345')

      expect(screen.getByText('(5/200)')).toBeInTheDocument()
    })
  })

  describe('키워드 정보', () => {
    it('시민일 때 키워드 정보를 표시해야 한다', () => {
      const gameStateWithKeyword: GamePlayState = {
        ...defaultGameState,
        keyword: { word: '사과', category: '과일' },
      }

      render(
        <DiscussionPhase
          gameState={gameStateWithKeyword}
          userId={1}
          userNickname="Player1"
          userRole="CIVILIAN"
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          isCurrentTurn={true}
          onSpeech={mockOnSpeech}
        />,
      )

      // 데스크톱에서만 보이는 키워드 섹션
      expect(screen.getByText('KEYWORD')).toBeInTheDocument()
    })

    it('라이어일 때 경고 메시지를 표시해야 한다', () => {
      render(
        <DiscussionPhase
          gameState={defaultGameState}
          userId={1}
          userNickname="Player1"
          userRole="LIAR"
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          isCurrentTurn={true}
          onSpeech={mockOnSpeech}
        />,
      )

      expect(screen.getByText('WARNING')).toBeInTheDocument()
      expect(screen.getByText(/당신은 라이어입니다/)).toBeInTheDocument()
    })
  })
})
