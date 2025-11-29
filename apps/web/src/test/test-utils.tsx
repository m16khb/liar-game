// 테스트 유틸리티 함수들
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '@/contexts/AuthContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { BrowserRouter } from 'react-router-dom'

// 모든 Provider를 포함한 래퍼 컴포넌트
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          {children}
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

// 커스텀 render 함수
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllProviders, ...options })

// 개별 Provider 래퍼들
export function renderWithAuth(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    wrapper: ({ children }) => (
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    ),
    ...options,
  })
}

export function renderWithSocket(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    wrapper: ({ children }) => (
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>{children}</SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    ),
    ...options,
  })
}

export function renderWithRouter(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    ...options,
  })
}

// 모의 데이터 팩토리
export const createMockPlayer = (overrides = {}) => ({
  id: 1,
  userId: 1,
  nickname: 'TestPlayer',
  isHost: false,
  status: 'not_ready' as const,
  joinOrder: 1,
  user: { email: 'test@example.com' },
  ...overrides,
})

export const createMockRoom = (overrides = {}) => ({
  id: 1,
  code: 'ABC123',
  title: 'Test Room',
  status: 'waiting' as const,
  difficulty: 'normal' as const,
  minPlayers: 2,
  maxPlayers: 8,
  currentPlayers: 2,
  isPrivate: false,
  hostId: 1,
  host: { id: 1, nickname: 'HostPlayer' },
  ...overrides,
})

export const createMockGameState = (overrides = {}) => ({
  phase: 'DISCUSSION' as const,
  currentTurn: 1,
  turnOrder: [1, 2, 3],
  players: [
    { id: 1, nickname: 'Player1', status: 'ACTIVE' as const },
    { id: 2, nickname: 'Player2', status: 'ACTIVE' as const },
    { id: 3, nickname: 'Player3', status: 'ACTIVE' as const },
  ],
  speeches: [],
  keyword: { word: 'apple', category: 'fruit' },
  votes: [],
  ...overrides,
})

// 모의 응답 생성
export const createMockApiResponse = <T,>(data: T, statusCode = 200) => ({
  data,
  statusCode,
})

export const createMockApiError = (message: string, statusCode = 400, code?: string) => ({
  error: { message, code },
  statusCode,
})

// re-export everything
export * from '@testing-library/react'
export { customRender as render }
