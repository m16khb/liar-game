// useRooms 훅 테스트
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useRooms } from './useRooms'
import * as roomsApi from '@/api/rooms'
import { RoomStatus, GameDifficulty } from '@/types/api'

// API 모듈 모킹
vi.mock('@/api/rooms', () => ({
  fetchRooms: vi.fn(),
  fetchRoomByCode: vi.fn(),
  createRoom: vi.fn(),
}))

// useAuth 모킹
vi.mock('./useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    getAuthToken: vi.fn().mockResolvedValue('test-token'),
    user: { id: 'test-user', email: 'test@example.com' },
  }),
}))

const mockRooms = [
  {
    id: '1',
    code: 'ABC123',
    title: 'Test Room 1',
    status: RoomStatus.WAITING,
    difficulty: GameDifficulty.NORMAL,
    maxPlayers: 8,
    currentPlayers: 2,
    isPrivate: false,
    host: { id: '1', nickname: 'Host1' },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    code: 'DEF456',
    title: 'Test Room 2',
    status: RoomStatus.WAITING,
    difficulty: GameDifficulty.HARD,
    maxPlayers: 6,
    currentPlayers: 4,
    isPrivate: true,
    host: { id: '2', nickname: 'Host2' },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

describe('useRooms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('초기 로드', () => {
    it('컴포넌트 마운트 시 방 목록을 로드해야 한다', async () => {
      vi.mocked(roomsApi.fetchRooms).mockResolvedValue({
        data: mockRooms,
        statusCode: 200,
      })

      const { result } = renderHook(() => useRooms())

      // 초기 로딩 상태
      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.rooms).toHaveLength(2)
      expect(result.current.error).toBeNull()
    })

    it('특정 상태의 방만 필터링하여 로드할 수 있어야 한다', async () => {
      vi.mocked(roomsApi.fetchRooms).mockResolvedValue({
        data: mockRooms,
        statusCode: 200,
      })

      renderHook(() => useRooms(RoomStatus.WAITING))

      await waitFor(() => {
        expect(roomsApi.fetchRooms).toHaveBeenCalledWith(RoomStatus.WAITING)
      })
    })

    it('API 에러 시 에러 상태를 설정해야 한다', async () => {
      vi.mocked(roomsApi.fetchRooms).mockResolvedValue({
        error: { message: '서버 에러' },
        statusCode: 500,
      })

      const { result } = renderHook(() => useRooms())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('서버 에러')
      expect(result.current.rooms).toHaveLength(0)
    })

    it('네트워크 에러 시 에러 메시지를 설정해야 한다', async () => {
      vi.mocked(roomsApi.fetchRooms).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useRooms())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('방 목록을 불러오는데 실패했습니다.')
    })
  })

  describe('refresh', () => {
    it('방 목록을 새로고침할 수 있어야 한다', async () => {
      vi.mocked(roomsApi.fetchRooms).mockResolvedValue({
        data: mockRooms,
        statusCode: 200,
      })

      const { result } = renderHook(() => useRooms())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // 새로고침
      await act(async () => {
        await result.current.refresh()
      })

      expect(roomsApi.fetchRooms).toHaveBeenCalledTimes(2)
    })
  })

  describe('createRoom', () => {
    it('새 방을 생성할 수 있어야 한다', async () => {
      const newRoom = { ...mockRooms[0], id: '3', code: 'NEW123' }

      vi.mocked(roomsApi.fetchRooms).mockResolvedValue({
        data: mockRooms,
        statusCode: 200,
      })

      vi.mocked(roomsApi.createRoom).mockResolvedValue({
        data: newRoom,
        statusCode: 201,
      })

      const { result } = renderHook(() => useRooms())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const createRoomData = {
        title: 'New Room',
        maxPlayers: 8,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
      }

      await act(async () => {
        const createdRoom = await result.current.createRoom(createRoomData)
        expect(createdRoom).toEqual(newRoom)
      })
    })

    it('방 생성 실패 시 에러를 던져야 한다', async () => {
      vi.mocked(roomsApi.fetchRooms).mockResolvedValue({
        data: mockRooms,
        statusCode: 200,
      })

      vi.mocked(roomsApi.createRoom).mockResolvedValue({
        error: { message: '방 생성 실패' },
        statusCode: 400,
      })

      const { result } = renderHook(() => useRooms())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const createRoomData = {
        title: 'New Room',
        maxPlayers: 8,
        difficulty: GameDifficulty.NORMAL,
        isPrivate: false,
      }

      await expect(
        act(async () => {
          await result.current.createRoom(createRoomData)
        }),
      ).rejects.toThrow('방 생성 실패')
    })
  })

  describe('getRoomByCode', () => {
    it('코드로 방을 조회할 수 있어야 한다', async () => {
      vi.mocked(roomsApi.fetchRooms).mockResolvedValue({
        data: mockRooms,
        statusCode: 200,
      })

      vi.mocked(roomsApi.fetchRoomByCode).mockResolvedValue({
        data: mockRooms[0],
        statusCode: 200,
      })

      const { result } = renderHook(() => useRooms())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let room
      await act(async () => {
        room = await result.current.getRoomByCode('ABC123')
      })

      expect(room).toEqual(mockRooms[0])
      expect(roomsApi.fetchRoomByCode).toHaveBeenCalledWith('ABC123')
    })

    it('존재하지 않는 방 코드 조회 시 에러를 던져야 한다', async () => {
      vi.mocked(roomsApi.fetchRooms).mockResolvedValue({
        data: mockRooms,
        statusCode: 200,
      })

      vi.mocked(roomsApi.fetchRoomByCode).mockResolvedValue({
        error: { message: '방을 찾을 수 없습니다' },
        statusCode: 404,
      })

      const { result } = renderHook(() => useRooms())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.getRoomByCode('INVALID')
        }),
      ).rejects.toThrow('방을 찾을 수 없습니다')
    })
  })

  describe('setError', () => {
    it('에러 상태를 수동으로 설정할 수 있어야 한다', async () => {
      vi.mocked(roomsApi.fetchRooms).mockResolvedValue({
        data: mockRooms,
        statusCode: 200,
      })

      const { result } = renderHook(() => useRooms())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.setError('커스텀 에러 메시지')
      })

      expect(result.current.error).toBe('커스텀 에러 메시지')
    })

    it('에러 상태를 null로 초기화할 수 있어야 한다', async () => {
      vi.mocked(roomsApi.fetchRooms).mockResolvedValue({
        error: { message: '에러 발생' },
        statusCode: 500,
      })

      const { result } = renderHook(() => useRooms())

      await waitFor(() => {
        expect(result.current.error).toBe('에러 발생')
      })

      act(() => {
        result.current.setError(null)
      })

      expect(result.current.error).toBeNull()
    })
  })
})
