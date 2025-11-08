// 방 코드로 참가하는 컴포넌트

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRooms } from '@/hooks/useRooms';

interface JoinRoomByCodeProps {
  onClose?: () => void;
}

export default function JoinRoomByCode({ onClose }: JoinRoomByCodeProps) {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { getRoomByCode } = useRooms();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomCode.trim()) {
      setError('방 코드를 입력해주세요.');
      return;
    }

    // 로그인 체크
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', `/join?code=${roomCode}`);
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 방 코드로 방 조회
      const room = await getRoomByCode(roomCode.trim().toUpperCase());

      if (!room) {
        setError('존재하지 않는 방입니다.');
        return;
      }

      if (room.status !== 'waiting') {
        setError('이미 시작된 방입니다.');
        return;
      }

      if (room.currentPlayers >= room.maxPlayers) {
        setError('정원이 가득 찬 방입니다.');
        return;
      }

      // TODO: 향후 실제 방 참가 API 호출
      // await joinRoom(room.id, getToken!);

      // 성공적으로 방을 찾았으니 게임 페이지로 이동
      navigate(`/game/${room.code}`);
      onClose?.();
    } catch (err) {
      console.error('방 참가 실패:', err);
      const errorMessage = err instanceof Error ? err.message : '방 참가에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      width: '100%',
      maxWidth: '400px'
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        방 코드로 참가
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => {
              setRoomCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="방 코드 입력 (예: ABC123)"
            maxLength={6}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              textAlign: 'center',
              letterSpacing: '2px',
              fontWeight: '600',
              transition: 'border-color 0.2s',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
            }}
          />
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '14px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 20px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#6b7280',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            취소
          </button>

          <button
            type="submit"
            disabled={loading || !roomCode.trim()}
            style={{
              flex: 2,
              padding: '12px 20px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: loading || !roomCode.trim() ? '#9ca3af' : '#3b82f6',
              color: 'white',
              fontSize: '16px',
              fontWeight: '500',
              cursor: loading || !roomCode.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (!loading && roomCode.trim()) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = loading || !roomCode.trim() ? '#9ca3af' : '#3b82f6';
            }}
          >
            {loading ? '참가 중...' : '참가하기'}
          </button>
        </div>
      </form>
    </div>
  );
}