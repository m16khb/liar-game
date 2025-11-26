// 방 관련 상태 관리 훅

import { useState, useEffect, useCallback } from 'react';
import { fetchRooms, fetchRoomById, createRoom } from '@/api/rooms';
import { RoomResponse, CreateRoomRequest, RoomStatus } from '@/types/api';
import { useAuth } from './useAuth';

export function useRooms(initialStatus?: RoomStatus) {
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, getAuthToken } = useAuth();

  // 방 목록 조회
  const loadRooms = useCallback(async (status?: RoomStatus) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchRooms(status);

      if (response.error) {
        setError(response.error.message);
        setRooms([]);
      } else if (response.data) {
        setRooms(response.data);
      }
    } catch (err) {
      console.error('방 목록 조회 실패:', err);
      setError('방 목록을 불러오는데 실패했습니다.');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 새로고침
  const refresh = useCallback(() => {
    return loadRooms(initialStatus);
  }, [loadRooms, initialStatus]);

  // 방 생성
  const createNewRoom = useCallback(async (data: CreateRoomRequest) => {
    if (!isAuthenticated) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const response = await createRoom(data, getAuthToken);

      if (response.error) {
        throw new Error(response.error.message);
      }

      // 방 생성 후 방 목록 새로고침
      await loadRooms(initialStatus);

      return response.data;
    } catch (err) {
      console.error('방 생성 실패:', err);
      throw err;
    }
  }, [isAuthenticated, getAuthToken, loadRooms, initialStatus]);

  // 특정 방 조회
  const getRoomById = useCallback(async (id: string) => {
    try {
      const response = await fetchRoomById(id);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (err) {
      console.error('방 조회 실패:', err);
      throw err;
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    loadRooms(initialStatus);
  }, [loadRooms, initialStatus]);

  return {
    rooms,
    loading,
    error,
    refresh,
    createRoom: createNewRoom,
    getRoomById,
    setError,
  };
}