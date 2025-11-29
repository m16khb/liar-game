// ErrorPage 컴포넌트 테스트
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorPage from './ErrorPage'

describe('ErrorPage', () => {
  describe('렌더링', () => {
    it('기본 타이틀과 메시지를 렌더링해야 한다', () => {
      render(<ErrorPage message="테스트 에러 메시지" />)

      expect(screen.getByText('ERROR!')).toBeInTheDocument()
      expect(screen.getByText('ACCESS DENIED')).toBeInTheDocument()
      expect(screen.getByText('테스트 에러 메시지')).toBeInTheDocument()
    })

    it('커스텀 타이틀을 렌더링해야 한다', () => {
      render(<ErrorPage title="NOT FOUND" message="페이지를 찾을 수 없습니다" />)

      expect(screen.getByText('NOT FOUND')).toBeInTheDocument()
    })

    it('기본 버튼 텍스트를 렌더링해야 한다', () => {
      render(<ErrorPage message="에러" />)

      expect(screen.getByText('BACK TO LOGIN')).toBeInTheDocument()
    })

    it('커스텀 버튼 텍스트를 렌더링해야 한다', () => {
      render(<ErrorPage message="에러" buttonText="방 목록으로 돌아가기" />)

      expect(screen.getByText('방 목록으로 돌아가기')).toBeInTheDocument()
    })
  })

  describe('상호작용', () => {
    it('버튼 클릭 시 기본 동작(홈으로 이동)을 수행해야 한다', () => {
      // window.location.href 모킹
      const originalLocation = window.location
      delete (window as any).location
      window.location = { ...originalLocation, href: '' }

      render(<ErrorPage message="에러" />)
      const button = screen.getByRole('button')

      fireEvent.click(button)

      expect(window.location.href).toBe('/')

      // 복원
      window.location = originalLocation
    })

    it('커스텀 onButtonClick 핸들러를 호출해야 한다', () => {
      const handleClick = vi.fn()

      render(<ErrorPage message="에러" onButtonClick={handleClick} />)
      const button = screen.getByRole('button')

      fireEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('스타일 및 접근성', () => {
    it('에러 아이콘이 표시되어야 한다', () => {
      render(<ErrorPage message="에러" />)

      // 두개골 이모지 확인
      expect(screen.getByText('💀')).toBeInTheDocument()
    })

    it('버튼이 클릭 가능해야 한다', () => {
      const handleClick = vi.fn()

      render(<ErrorPage message="에러" onButtonClick={handleClick} />)
      const button = screen.getByRole('button')

      expect(button).not.toBeDisabled()
    })
  })
})
