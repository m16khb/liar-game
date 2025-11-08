// 마이페이지 모달 컴포넌트
// 사용자 정보 표시 및 로그아웃 기능

import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      onClose()
      window.location.href = '/'
    } catch (error) {
      console.error('로그아웃 실패:', error)
      setIsLoggingOut(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '400px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{
          padding: '24px 24px 16px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0
            }}>
              마이페이지
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                color: '#6b7280',
                cursor: 'pointer',
                padding: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* 프로필 정보 */}
        <div style={{ padding: '24px' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            {/* 아바타 */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <span style={{
                fontSize: '32px',
                color: 'white',
                fontWeight: '600'
              }}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>

            {/* 이메일 */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                이메일
              </p>
              <p style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                wordBreak: 'break-word',
                maxWidth: '280px'
              }}>
                {user?.email || '이메일 정보 없음'}
              </p>
            </div>

            {/* 닉네임 */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                닉네임
              </p>
              <p style={{
                fontSize: '14px',
                color: '#1f2937'
              }}>
                {user?.user_metadata?.nickname || user?.email?.split('@')[0] || '플레이어'}
              </p>
            </div>

            {/* 가입일 */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                가입일
              </p>
              <p style={{
                fontSize: '14px',
                color: '#1f2937'
              }}>
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : new Date().toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                }
              </p>
            </div>

            {/* 상태 */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 12px',
              backgroundColor: '#dcfce7',
              color: '#166534',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#22c55e',
                borderRadius: '50%',
                marginRight: '6px'
              }} />
              활동 중
            </div>
          </div>

          {/* 통계 정보 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#3b82f6',
                marginBottom: '4px'
              }}>
                0
              </p>
              <p style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                참가한 게임
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#10b981',
                marginBottom: '4px'
              }}>
                0
              </p>
              <p style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                승리 횟수
              </p>
            </div>
          </div>

          {/* 설정 메뉴 */}
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <button
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'transparent',
                border: 'none',
                textAlign: 'left',
                fontSize: '14px',
                color: '#4b5563',
                cursor: 'pointer',
                borderRadius: '6px',
                transition: 'all 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <span>⚙️ 설정</span>
              <span style={{ color: '#9ca3af' }}>›</span>
            </button>
            <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '8px 0' }} />
            <button
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'transparent',
                border: 'none',
                textAlign: 'left',
                fontSize: '14px',
                color: '#4b5563',
                cursor: 'pointer',
                borderRadius: '6px',
                transition: 'all 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <span>📝 게임 기록</span>
              <span style={{ color: '#9ca3af' }}>›</span>
            </button>
          </div>

          {/* 로그아웃 버튼 */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isLoggingOut ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: isLoggingOut ? '0.7' : '1'
            }}
            onMouseOver={(e) => {
              if (!isLoggingOut) {
                e.currentTarget.style.backgroundColor = '#dc2626'
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444'
            }}
          >
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
          </button>

          {/* 버전 정보 */}
          <p style={{
            fontSize: '11px',
            color: '#9ca3af',
            textAlign: 'center',
            marginTop: '16px'
          }}>
            라이어 게임 v1.0.0
          </p>
        </div>
      </div>
    </div>
  )
}