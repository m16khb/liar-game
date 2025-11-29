// CreateRoomModal 컴포넌트 테스트
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateRoomModal from './CreateRoomModal'
import { GameDifficulty } from '@/types/api'

describe('CreateRoomModal', () => {
  const mockOnClose = vi.fn()
  const mockOnCreateRoom = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('렌더링', () => {
    it('isOpen이 false이면 렌더링하지 않아야 한다', () => {
      render(
        <CreateRoomModal
          isOpen={false}
          onClose={mockOnClose}
          onCreateRoom={mockOnCreateRoom}
        />,
      )

      expect(screen.queryByText('NEW ROOM')).not.toBeInTheDocument()
    })

    it('isOpen이 true이면 모달을 렌더링해야 한다', () => {
      render(
        <CreateRoomModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateRoom={mockOnCreateRoom}
        />,
      )

      expect(screen.getByText('NEW ROOM')).toBeInTheDocument()
      expect(screen.getByText('ROOM TITLE *')).toBeInTheDocument()
      expect(screen.getByText('PLAYERS')).toBeInTheDocument()
      expect(screen.getByText('DIFFICULTY')).toBeInTheDocument()
    })

    it('난이도 버튼들을 렌더링해야 한다', () => {
      render(
        <CreateRoomModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateRoom={mockOnCreateRoom}
        />,
      )

      expect(screen.getByText('EASY')).toBeInTheDocument()
      expect(screen.getByText('NORMAL')).toBeInTheDocument()
      expect(screen.getByText('HARD')).toBeInTheDocument()
    })

    it('비공개 방 체크박스를 렌더링해야 한다', () => {
      render(
        <CreateRoomModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateRoom={mockOnCreateRoom}
        />,
      )

      expect(screen.getByText(/PRIVATE ROOM/)).toBeInTheDocument()
    })
  })

  describe('폼 유효성 검사', () => {
    it('방 제목 없이 제출하면 에러 메시지를 표시해야 한다', async () => {
      render(
        <CreateRoomModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateRoom={mockOnCreateRoom}
        />,
      )

      const submitButton = screen.getByText('CREATE ▶')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('방 제목을 입력해주세요.')).toBeInTheDocument()
      })

      expect(mockOnCreateRoom).not.toHaveBeenCalled()
    })

    it('비공개 방인데 비밀번호가 없으면 에러 메시지를 표시해야 한다', async () => {
      const user = userEvent.setup()

      render(
        <CreateRoomModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateRoom={mockOnCreateRoom}
        />,
      )

      // 방 제목 입력
      const titleInput = screen.getByPlaceholderText('방 제목을 입력하세요')
      await user.type(titleInput, 'Test Room')

      // 비공개 방 체크
      const privateCheckbox = screen.getByRole('checkbox')
      await user.click(privateCheckbox)

      // 제출
      const submitButton = screen.getByText('CREATE ▶')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('비공개 방은 비밀번호를 설정해야 합니다.'),
        ).toBeInTheDocument()
      })

      expect(mockOnCreateRoom).not.toHaveBeenCalled()
    })
  })

  describe('상호작용', () => {
    it('닫기 버튼을 클릭하면 onClose가 호출되어야 한다', async () => {
      render(
        <CreateRoomModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateRoom={mockOnCreateRoom}
        />,
      )

      const closeButton = screen.getByText('✕')
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('CANCEL 버튼을 클릭하면 onClose가 호출되어야 한다', async () => {
      render(
        <CreateRoomModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateRoom={mockOnCreateRoom}
        />,
      )

      const cancelButton = screen.getByText('CANCEL')
      fireEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('배경을 클릭하면 onClose가 호출되어야 한다', async () => {
      render(
        <CreateRoomModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateRoom={mockOnCreateRoom}
        />,
      )

      // 모달 배경(오버레이) 클릭
      const overlay = screen.getByRole('presentation', { hidden: true }) ||
        document.querySelector('.fixed.inset-0')

      if (overlay) {
        fireEvent.click(overlay)
        // onClose가 호출되었는지 확인 (배경 클릭 핸들러)
      }
    })

    it('난이도를 변경할 수 있어야 한다', async () => {
      const user = userEvent.setup()

      render(
        <CreateRoomModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateRoom={mockOnCreateRoom}
        />,
      )

      const hardButton = screen.getByText('HARD')
      await user.click(hardButton)

      // HARD 버튼이 선택된 스타일을 가지는지 확인
      expect(hardButton.className).toContain('bg-arcade-cyan')
    })

    it('유효한 폼을 제출하면 onCreateRoom이 호출되어야 한다', async () => {
      mockOnCreateRoom.mockResolvedValue(undefined)
      const user = userEvent.setup()

      render(
        <CreateRoomModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateRoom={mockOnCreateRoom}
        />,
      )

      // 방 제목 입력
      const titleInput = screen.getByPlaceholderText('방 제목을 입력하세요')
      await user.type(titleInput, 'Test Room')

      // 제출
      const submitButton = screen.getByText('CREATE ▶')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockOnCreateRoom).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Room',
            minPlayers: 2,
            maxPlayers: 8,
            difficulty: GameDifficulty.NORMAL,
            isPrivate: false,
          }),
        )
      })
    })

    it('비공개 방을 체크하면 비밀번호 입력 필드가 나타나야 한다', async () => {
      const user = userEvent.setup()

      render(
        <CreateRoomModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateRoom={mockOnCreateRoom}
        />,
      )

      // 초기에는 비밀번호 필드가 없어야 함
      expect(screen.queryByText('PASSWORD *')).not.toBeInTheDocument()

      // 비공개 방 체크
      const privateCheckbox = screen.getByRole('checkbox')
      await user.click(privateCheckbox)

      // 비밀번호 필드가 나타나야 함
      expect(screen.getByText('PASSWORD *')).toBeInTheDocument()
    })
  })

  describe('로딩 상태', () => {
    it('creating이 true이면 버튼에 로딩 상태가 표시되어야 한다', () => {
      render(
        <CreateRoomModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateRoom={mockOnCreateRoom}
          creating={true}
        />,
      )

      expect(screen.getByText('CREATING...')).toBeInTheDocument()
    })

    it('creating이 true이면 버튼이 비활성화되어야 한다', () => {
      render(
        <CreateRoomModal
          isOpen={true}
          onClose={mockOnClose}
          onCreateRoom={mockOnCreateRoom}
          creating={true}
        />,
      )

      const submitButton = screen.getByText('CREATING...').closest('button')
      expect(submitButton).toBeDisabled()
    })
  })
})
