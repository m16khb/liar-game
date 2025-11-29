// VotingPhase 컴포넌트 테스트
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VotingPhase } from './VotingPhase'
import { GamePlayState } from '@/hooks/useGamePlay'

describe('VotingPhase', () => {
  const mockOnVote = vi.fn()

  const defaultGameState: GamePlayState = {
    phase: 'VOTING',
    currentTurn: null,
    turnOrder: [1, 2, 3],
    players: [
      { id: 1, nickname: 'Player1', status: 'ACTIVE' },
      { id: 2, nickname: 'Player2', status: 'ACTIVE' },
      { id: 3, nickname: 'Player3', status: 'ACTIVE' },
    ],
    speeches: [],
    votes: [{ voterId: 1, voteStatus: 'PENDING' }],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('렌더링', () => {
    it('투표 단계 헤더를 렌더링해야 한다', () => {
      render(
        <VotingPhase
          gameState={defaultGameState}
          userId={1}
          remainingTime={60}
          progress={50}
          formatTime={(s) => `0${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          onVote={mockOnVote}
        />,
      )

      expect(screen.getByText('VOTING PHASE')).toBeInTheDocument()
      expect(screen.getByText('라이어를 찾아라!')).toBeInTheDocument()
    })

    it('자신을 제외한 플레이어들만 투표 대상으로 표시해야 한다', () => {
      render(
        <VotingPhase
          gameState={defaultGameState}
          userId={1}
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          onVote={mockOnVote}
        />,
      )

      // 자신(Player1)은 목록에 없어야 함
      expect(screen.queryByText('Player1')).not.toBeInTheDocument()
      // 다른 플레이어들은 있어야 함
      expect(screen.getByText('Player2')).toBeInTheDocument()
      expect(screen.getByText('Player3')).toBeInTheDocument()
    })

    it('연결 끊긴 플레이어는 투표 대상에서 제외되어야 한다', () => {
      const gameStateWithDisconnected: GamePlayState = {
        ...defaultGameState,
        players: [
          { id: 1, nickname: 'Player1', status: 'ACTIVE' },
          { id: 2, nickname: 'Player2', status: 'DISCONNECTED' },
          { id: 3, nickname: 'Player3', status: 'ACTIVE' },
        ],
      }

      render(
        <VotingPhase
          gameState={gameStateWithDisconnected}
          userId={1}
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          onVote={mockOnVote}
        />,
      )

      // 연결 끊긴 Player2는 목록에 없어야 함
      expect(screen.queryByText('Player2')).not.toBeInTheDocument()
      expect(screen.getByText('Player3')).toBeInTheDocument()
    })

    it('남은 시간을 표시해야 한다', () => {
      render(
        <VotingPhase
          gameState={defaultGameState}
          userId={1}
          remainingTime={65}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          onVote={mockOnVote}
        />,
      )

      expect(screen.getByText('1:05')).toBeInTheDocument()
    })

    it('투표 진행 상황을 표시해야 한다', () => {
      const gameStateWithVotes: GamePlayState = {
        ...defaultGameState,
        votes: [
          { voterId: 1, voteStatus: 'VOTED' },
          { voterId: 2, voteStatus: 'PENDING' },
          { voterId: 3, voteStatus: 'PENDING' },
        ],
      }

      render(
        <VotingPhase
          gameState={gameStateWithVotes}
          userId={1}
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          onVote={mockOnVote}
        />,
      )

      expect(screen.getByText('1')).toBeInTheDocument() // 투표 완료 수
      expect(screen.getByText('3')).toBeInTheDocument() // 전체 플레이어 수
    })
  })

  describe('상호작용', () => {
    it('플레이어를 클릭하면 선택 상태가 변경되어야 한다', () => {
      render(
        <VotingPhase
          gameState={defaultGameState}
          userId={1}
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          onVote={mockOnVote}
        />,
      )

      const player2Button = screen.getByText('Player2').closest('button')
      fireEvent.click(player2Button!)

      // 선택된 플레이어가 강조 표시되어야 함
      expect(player2Button?.className).toContain('border-arcade-pink')
    })

    it('투표 버튼을 클릭하면 onVote가 호출되어야 한다', () => {
      render(
        <VotingPhase
          gameState={defaultGameState}
          userId={1}
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          onVote={mockOnVote}
        />,
      )

      // 플레이어 선택
      const player2Button = screen.getByText('Player2').closest('button')
      fireEvent.click(player2Button!)

      // 투표 제출
      const voteButton = screen.getByText('Player2에게 투표하기')
      fireEvent.click(voteButton)

      expect(mockOnVote).toHaveBeenCalledWith(2) // Player2의 ID
    })

    it('플레이어를 선택하지 않으면 투표 버튼이 비활성화되어야 한다', () => {
      render(
        <VotingPhase
          gameState={defaultGameState}
          userId={1}
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          onVote={mockOnVote}
        />,
      )

      const voteButton = screen.getByText('플레이어를 선택하세요')
      expect(voteButton.closest('button')).toBeDisabled()
    })

    it('투표 완료 후 플레이어 선택이 비활성화되어야 한다', () => {
      render(
        <VotingPhase
          gameState={defaultGameState}
          userId={1}
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          onVote={mockOnVote}
        />,
      )

      // 플레이어 선택
      const player2Button = screen.getByText('Player2').closest('button')
      fireEvent.click(player2Button!)

      // 투표 제출
      const voteButton = screen.getByText('Player2에게 투표하기')
      fireEvent.click(voteButton)

      // 투표 완료 메시지 표시
      expect(screen.getByText(/투표가 완료되었습니다/)).toBeInTheDocument()

      // 플레이어 버튼이 비활성화됨
      expect(player2Button).toBeDisabled()
    })
  })

  describe('투표 완료 상태', () => {
    it('투표 완료 후 완료 메시지를 표시해야 한다', () => {
      render(
        <VotingPhase
          gameState={defaultGameState}
          userId={1}
          remainingTime={60}
          progress={50}
          formatTime={(s) => `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`}
          onVote={mockOnVote}
        />,
      )

      // 플레이어 선택 및 투표
      const player2Button = screen.getByText('Player2').closest('button')
      fireEvent.click(player2Button!)

      const voteButton = screen.getByText('Player2에게 투표하기')
      fireEvent.click(voteButton)

      expect(screen.getByText(/투표가 완료되었습니다/)).toBeInTheDocument()
      expect(screen.getByText(/다른 플레이어의 투표를 기다리는 중/)).toBeInTheDocument()
    })
  })
})
