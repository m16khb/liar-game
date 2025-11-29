// API 클라이언트 테스트
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiRequest, get, post, put, del, authenticatedRequest } from './client'

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('apiRequest', () => {
    it('성공적인 GET 요청을 처리해야 한다', async () => {
      const mockData = { id: 1, name: 'test' }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      })

      const response = await apiRequest('/test')

      expect(response.data).toEqual(mockData)
      expect(response.statusCode).toBe(200)
      expect(response.error).toBeUndefined()
    })

    it('204 No Content 응답을 처리해야 한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      })

      const response = await apiRequest('/test')

      expect(response.statusCode).toBe(204)
      expect(response.data).toBeUndefined()
    })

    it('에러 응답을 처리해야 한다', async () => {
      const errorData = { message: '잘못된 요청입니다', code: 'BAD_REQUEST' }
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorData),
      })

      const response = await apiRequest('/test')

      expect(response.error).toBeDefined()
      expect(response.error?.message).toBe('잘못된 요청입니다')
      expect(response.error?.code).toBe('BAD_REQUEST')
      expect(response.statusCode).toBe(400)
    })

    it('JSON 파싱 실패 시 기본 에러 메시지를 반환해야 한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      const response = await apiRequest('/test')

      expect(response.error?.message).toBe('API 요청에 실패했습니다.')
      expect(response.statusCode).toBe(500)
    })

    it('네트워크 에러를 처리해야 한다', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const response = await apiRequest('/test')

      expect(response.error?.message).toBe('Network error')
      expect(response.statusCode).toBe(0)
    })

    it('올바른 헤더와 함께 요청을 보내야 한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })

      await apiRequest('/test', {
        headers: { 'X-Custom-Header': 'custom-value' },
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom-Header': 'custom-value',
          }),
        }),
      )
    })
  })

  describe('get', () => {
    it('GET 메서드로 요청해야 한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      })

      await get('/test')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'GET' }),
      )
    })
  })

  describe('post', () => {
    it('POST 메서드와 body로 요청해야 한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 1 }),
      })

      await post('/test', { name: 'test' })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        }),
      )
    })

    it('body 없이도 요청할 수 있어야 한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({}),
      })

      await post('/test')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: undefined,
        }),
      )
    })
  })

  describe('put', () => {
    it('PUT 메서드와 body로 요청해야 한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 1, name: 'updated' }),
      })

      await put('/test/1', { name: 'updated' })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'updated' }),
        }),
      )
    })
  })

  describe('del', () => {
    it('DELETE 메서드로 요청해야 한다', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      })

      await del('/test/1')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({ method: 'DELETE' }),
      )
    })
  })

  describe('authenticatedRequest', () => {
    it('토큰이 없으면 인증 에러를 반환해야 한다', async () => {
      const getToken = () => null

      const response = await authenticatedRequest('/protected', {}, getToken)

      expect(response.error?.message).toBe('인증이 필요합니다.')
      expect(response.error?.code).toBe('AUTH_REQUIRED')
      expect(response.statusCode).toBe(401)
    })

    it('토큰과 함께 Authorization 헤더를 포함해야 한다', async () => {
      const getToken = () => 'test-token'
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'protected' }),
      })

      await authenticatedRequest('/protected', {}, getToken)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/protected'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      )
    })

    it('기존 헤더와 Authorization 헤더를 병합해야 한다', async () => {
      const getToken = () => 'test-token'
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      })

      await authenticatedRequest(
        '/protected',
        { headers: { 'X-Custom': 'value' } },
        getToken,
      )

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom': 'value',
            Authorization: 'Bearer test-token',
          }),
        }),
      )
    })
  })
})
