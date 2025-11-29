// Vitest 테스트 설정 파일
import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'

// 환경 변수 모의 설정
vi.stubEnv('VITE_API_URL', 'http://localhost:4000/api')
vi.stubEnv('VITE_WS_URL', 'http://localhost:4000')
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

// React Router DOM 모킹
const mockNavigate = vi.fn()
const mockParams: Record<string, string> = {}
const mockSearchParams = new URLSearchParams()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
    useSearchParams: () => [mockSearchParams, vi.fn()],
    BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  }
})

// Socket.IO 클라이언트 모킹
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
  removeAllListeners: vi.fn(),
}

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}))

// Supabase 모킹
const mockSession = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      nickname: 'TestUser',
    },
  },
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: mockSession.user }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  signInWithGitHub: vi.fn(),
  signInWithDiscord: vi.fn(),
  signOut: vi.fn(),
  getAccessToken: vi.fn().mockResolvedValue('test-access-token'),
  refreshSession: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
  updateUserMetadata: vi.fn(),
  getCurrentSession: vi.fn().mockResolvedValue(mockSession),
}))

// fetch 모킹
global.fetch = vi.fn()

// matchMedia 모킹 (Tailwind CSS에서 사용)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// IntersectionObserver 모킹
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// ResizeObserver 모킹
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// scrollTo 모킹
Element.prototype.scrollTo = vi.fn()
Element.prototype.scrollIntoView = vi.fn()

// 테스트 전후 정리
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.resetAllMocks()
})

// 테스트 유틸리티 내보내기
export { mockNavigate, mockParams, mockSocket, mockSession }
