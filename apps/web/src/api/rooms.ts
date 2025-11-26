// 방 관련 API 함수들

import { get, post, authenticatedRequest } from './client';
import { RoomResponse, CreateRoomRequest, RoomStatus } from '@/types/api';

// 방 목록 조회 (인증 불필요)
export function fetchRooms(status?: RoomStatus) {
  const query = status ? `?status=${status}` : '';
  return get<RoomResponse[]>(`/rooms${query}`);
}

// 방 검색 (인증 불필요)
export function searchRooms(keyword: string) {
  return get<RoomResponse[]>(`/rooms/search?q=${encodeURIComponent(keyword)}`);
}

// 방 ID로 조회 (인증 불필요)
export function fetchRoomById(id: string) {
  return get<RoomResponse>(`/rooms/${id}`);
}

// 방 생성 (인증 필요)
export async function createRoom(
  data: CreateRoomRequest,
  getToken: () => Promise<string | null>
) {
  const token = await getToken();

  if (!token) {
    return Promise.resolve({
      error: {
        message: '인증이 필요합니다.',
        code: 'AUTH_REQUIRED',
      },
      statusCode: 401,
    });
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const statusCode = response.status;
  const responseData = await response.json().catch(() => null);

  if (response.ok) {
    return {
      data: responseData,
      statusCode,
    };
  }

  return {
    error: {
      message: responseData?.message || responseData?.error || '방 생성에 실패했습니다.',
      code: responseData?.code,
      details: responseData,
    },
    statusCode,
  };
}

// 방 참가 (향후 구현)
export function joinRoom(roomId: string, getToken: () => string | null) {
  return authenticatedRequest(`/rooms/${roomId}/join`, {
    method: 'POST',
  }, getToken);
}

// 방 나가기 (향후 구현)
export function leaveRoom(roomId: string, getToken: () => string | null) {
  return authenticatedRequest(`/rooms/${roomId}/leave`, {
    method: 'POST',
  }, getToken);
}