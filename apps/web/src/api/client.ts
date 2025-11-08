// API 클라이언트 - HTTP 요청을 위한 기본 설정

import { ApiResponse } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// API 요청을 위한 기본 fetch 래퍼
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  // 기본 헤더 설정
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // 요청 옵션 병합
  const config: RequestInit = {
    headers: defaultHeaders,
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const statusCode = response.status;

    // 응답이 비어있는 경우 (204 No Content 등)
    if (response.status === 204) {
      return { statusCode };
    }

    // JSON 파싱
    const data = await response.json().catch(() => null);

    // 성공 응답 (2xx)
    if (response.ok) {
      return {
        data,
        statusCode,
      };
    }

    // 에러 응답
    return {
      error: {
        message: data?.message || data?.error || 'API 요청에 실패했습니다.',
        code: data?.code,
        details: data,
      },
      statusCode,
    };
  } catch (error) {
    // 네트워크 에러 등
    return {
      error: {
        message: error instanceof Error ? error.message : '네트워크 에러가 발생했습니다.',
        details: error,
      },
      statusCode: 0,
    };
  }
}

// GET 요청
export function get<T = any>(endpoint: string, options?: RequestInit) {
  return apiRequest<T>(endpoint, { method: 'GET', ...options });
}

// POST 요청
export function post<T = any>(endpoint: string, data?: any, options?: RequestInit) {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
}

// PUT 요청
export function put<T = any>(endpoint: string, data?: any, options?: RequestInit) {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
}

// DELETE 요청
export function del<T = any>(endpoint: string, options?: RequestInit) {
  return apiRequest<T>(endpoint, { method: 'DELETE', ...options });
}

// 인증이 필요한 요청을 위한 함수
export function authenticatedRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  getToken: () => string | null
) {
  const token = getToken();

  if (!token) {
    return Promise.resolve({
      error: {
        message: '인증이 필요합니다.',
        code: 'AUTH_REQUIRED',
      },
      statusCode: 401,
    });
  }

  return apiRequest<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}