// 새 방 생성 모달 - Retro Arcade Theme

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
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError('방 제목을 입력해주세요.')
      return
    }

    if (formData.minPlayers > formData.maxPlayers) {
      setError('최소 인원수는 최대 인원수보다 작거나 같아야 합니다.')
      return
    }

    if (formData.isPrivate && !formData.password?.trim()) {
      setError('비공개 방은 비밀번호를 설정해야 합니다.')
      return
    }

    try {
      await onCreateRoom(formData)
      onClose()
    } catch (err) {
      console.error('방 생성 실패:', err)
      setError('방 생성에 실패했습니다.')
    }
  }

  const difficultyLabels: Record<GameDifficulty, string> = {
    [GameDifficulty.EASY]: 'EASY',
    [GameDifficulty.NORMAL]: 'NORMAL',
    [GameDifficulty.HARD]: 'HARD'
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-arcade-dark border-4 border-arcade-pink p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative animate-in shadow-[0_0_60px_rgba(255,42,109,0.4)]">
        {/* 모달 장식 */}
        <span className="absolute -top-3 left-5 text-xl text-arcade-yellow">◆</span>
        <span className="absolute -top-3 right-5 text-xl text-arcade-yellow">◆</span>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 font-pixel text-pixel-sm text-arcade-pink hover:text-arcade-yellow transition-colors"
        >
          ✕
        </button>

        {/* 제목 */}
        <h2 className="font-pixel text-pixel-lg text-arcade-yellow mb-6 pr-8"
            style={{ textShadow: '2px 2px 0 #ff2a6d' }}>
          NEW ROOM
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 방 제목 */}
          <div>
            <label className="block font-pixel text-pixel-xs text-arcade-cyan uppercase mb-2">
              ROOM TITLE *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="방 제목을 입력하세요"
              maxLength={100}
              className="w-full font-retro text-retro-base bg-arcade-dark text-white border-3 border-arcade-cyan px-4 py-3 focus:border-arcade-yellow focus:shadow-neon-yellow transition-all placeholder:text-arcade-cyan/50"
            />
          </div>

          {/* 인원수 설정 */}
          <div>
            <label className="block font-pixel text-pixel-xs text-arcade-cyan uppercase mb-2">
              PLAYERS
            </label>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <label className="block font-retro text-retro-sm text-arcade-cyan/70 mb-1">
                  MIN
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
                  className="w-full font-retro text-retro-base bg-arcade-dark text-white border-3 border-arcade-blue px-4 py-3 arcade-select focus:border-arcade-cyan"
                >
                  {[4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              <span className="font-retro text-retro-lg text-arcade-cyan mt-6">~</span>
              <div className="flex-1">
                <label className="block font-retro text-retro-sm text-arcade-cyan/70 mb-1">
                  MAX
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
                  className="w-full font-retro text-retro-base bg-arcade-dark text-white border-3 border-arcade-blue px-4 py-3 arcade-select focus:border-arcade-cyan"
                >
                  {[4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num} disabled={num < formData.minPlayers}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="font-retro text-retro-sm text-arcade-cyan/50 mt-2">
              최소 {formData.minPlayers}명이 준비해야 게임을 시작할 수 있습니다.
            </p>
          </div>

          {/* 난이도 */}
          <div>
            <label className="block font-pixel text-pixel-xs text-arcade-cyan uppercase mb-2">
              DIFFICULTY
            </label>
            <div className="flex gap-2">
              {Object.values(GameDifficulty).map(difficulty => (
                <button
                  key={difficulty}
                  type="button"
                  onClick={() => setFormData({ ...formData, difficulty })}
                  className={`flex-1 font-pixel text-pixel-xs py-3 border-3 transition-all ${
                    formData.difficulty === difficulty
                      ? 'bg-arcade-cyan text-arcade-black border-white shadow-neon-cyan'
                      : 'bg-arcade-dark text-arcade-cyan border-arcade-blue hover:border-arcade-cyan'
                  }`}
                >
                  {difficultyLabels[difficulty]}
                </button>
              ))}
            </div>
          </div>

          {/* 비공개 방 설정 */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                className="arcade-checkbox"
              />
              <span className="font-pixel text-pixel-xs text-arcade-cyan group-hover:text-arcade-yellow transition-colors">
                PRIVATE ROOM 🔒
              </span>
            </label>
          </div>

          {/* 비밀번호 */}
          {formData.isPrivate && (
            <div>
              <label className="block font-pixel text-pixel-xs text-arcade-cyan uppercase mb-2">
                PASSWORD *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="비밀번호를 입력하세요"
                maxLength={20}
                className="w-full font-retro text-retro-base bg-arcade-dark text-white border-3 border-arcade-pink px-4 py-3 focus:border-arcade-yellow focus:shadow-neon-yellow transition-all placeholder:text-arcade-pink/50"
              />
            </div>
          )}

          {/* 방 설명 */}
          <div>
            <label className="block font-pixel text-pixel-xs text-arcade-cyan uppercase mb-2">
              DESCRIPTION
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="방에 대한 설명을 입력하세요 (선택)"
              maxLength={500}
              rows={3}
              className="w-full font-retro text-retro-base bg-arcade-dark text-white border-3 border-arcade-blue px-4 py-3 arcade-textarea focus:border-arcade-cyan transition-all placeholder:text-arcade-cyan/50"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-arcade-dark border-3 border-arcade-pink">
              <p className="font-retro text-retro-base text-arcade-pink">⚠️ {error}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="flex-1 font-pixel text-pixel-xs py-4 bg-transparent text-arcade-cyan border-3 border-arcade-cyan hover:bg-arcade-cyan/20 transition-all disabled:opacity-50"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-[2] font-pixel text-pixel-xs py-4 bg-arcade-green text-arcade-black border-4 border-white hover:translate-y-[-2px] hover:shadow-[0_6px_30px_rgba(0,255,65,0.5)] transition-all disabled:opacity-50 disabled:transform-none"
            >
              {creating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="arcade-spinner w-4 h-4" />
                  CREATING...
                </span>
              ) : (
                'CREATE ▶'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
