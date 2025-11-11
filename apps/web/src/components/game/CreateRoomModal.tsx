import { useState } from 'react'
import { GameDifficulty } from '@/types/api'

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateRoom: (roomData: CreateRoomRequest) => Promise<void>
  creating?: boolean
}

export interface CreateRoomRequest {
  title: string
  minPlayers: number
  maxPlayers: number
  difficulty: GameDifficulty
  isPrivate: boolean
  password?: string
  description?: string
  timeLimit?: number
}

export default function CreateRoomModal({
  isOpen,
  onClose,
  onCreateRoom,
  creating = false
}: CreateRoomModalProps) {
  const [formData, setFormData] = useState<CreateRoomRequest>({
    title: '',
    minPlayers: 4,
    maxPlayers: 8,
    difficulty: GameDifficulty.NORMAL,
    isPrivate: false,
    password: '',
    description: '',
    timeLimit: undefined
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 유효성 검사
    if (!formData.title.trim()) {
      alert('방 제목을 입력해주세요.')
      return
    }

    if (formData.minPlayers > formData.maxPlayers) {
      alert('최소 인원수는 최대 인원수보다 작거나 같아야 합니다.')
      return
    }

    if (formData.isPrivate && !formData.password?.trim()) {
      alert('비공개 방은 비밀번호를 설정해야 합니다.')
      return
    }

    try {
      await onCreateRoom(formData)
      onClose()
    } catch (error) {
      console.error('방 생성 실패:', error)
    }
  }

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
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          marginBottom: '20px',
          color: '#1f2937'
        }}>
          새 방 생성
        </h2>

        <form onSubmit={handleSubmit}>
          {/* 방 제목 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              방 제목 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="방 제목을 입력하세요"
              maxLength={100}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db'
              }}
            />
          </div>

          {/* 인원수 설정 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              인원수 설정
            </label>
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  최소 인원
                </label>
                <select
                  value={formData.minPlayers}
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    setFormData({
                      ...formData,
                      minPlayers: value,
                      maxPlayers: Math.max(value, formData.maxPlayers)
                    })
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  {[4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num}명</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  최대 인원
                </label>
                <select
                  value={formData.maxPlayers}
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    setFormData({
                      ...formData,
                      maxPlayers: value,
                      minPlayers: Math.min(formData.minPlayers, value)
                    })
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  {[4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num} disabled={num < formData.minPlayers}>
                      {num}명
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              marginTop: '4px'
            }}>
              최소 {formData.minPlayers}명이 준비해야 게임을 시작할 수 있습니다.
            </p>
          </div>

          {/* 난이도 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              난이도
            </label>
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              {Object.values(GameDifficulty).map(difficulty => (
                <button
                  key={difficulty}
                  type="button"
                  onClick={() => setFormData({ ...formData, difficulty })}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: `1px solid ${formData.difficulty === difficulty ? '#3b82f6' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    backgroundColor: formData.difficulty === difficulty ? '#eff6ff' : 'white',
                    color: formData.difficulty === difficulty ? '#3b82f6' : '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {difficulty === 'easy' ? '쉬움' :
                   difficulty === 'normal' ? '보통' : '어려움'}
                </button>
              ))}
            </div>
          </div>

          {/* 비공개 방 설정 */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer'
                }}
              />
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}>
                비공개 방
              </span>
            </label>
          </div>

          {/* 비밀번호 (비공개 방일 때만) */}
          {formData.isPrivate && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                비밀번호 *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="비밀번호를 입력하세요"
                maxLength={20}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db'
                }}
              />
            </div>
          )}

          {/* 방 설명 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              방 설명 (선택)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="방에 대한 설명을 입력하세요"
              maxLength={500}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db'
              }}
            />
          </div>

          {/* 버튼 */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              style={{
                padding: '10px 20px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: 'white',
                color: '#374151',
                cursor: creating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={creating}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: creating ? '#9ca3af' : '#3b82f6',
                color: 'white',
                cursor: creating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {creating ? '생성 중...' : '방 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}