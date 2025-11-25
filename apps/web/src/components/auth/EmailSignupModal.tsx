// 이메일 인증 모달 컴포넌트 - Retro Arcade Theme
// Supabase 이메일 인증 처리

import { useState } from 'react'
import { sendEmailVerification } from '../../lib/supabase'

interface EmailSignupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EmailSignupModal({
  isOpen,
  onClose,
  onSuccess
}: EmailSignupModalProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail('')
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    if (!email || !validateEmail(email)) {
      setError('유효한 이메일 주소를 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await sendEmailVerification(email)
      setSuccess(true)

      setTimeout(() => {
        window.location.href = `/otp-verification?email=${encodeURIComponent(email)}`
      }, 2000)
    } catch (error) {
      console.error('이메일 인증 실패:', error)
      setError('이메일 전송에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
         onClick={handleClose}>
      <div className="bg-arcade-dark border-4 border-arcade-yellow max-w-md w-full p-8 relative shadow-[0_0_60px_rgba(249,240,2,0.4)] animate-in"
           onClick={(e) => e.stopPropagation()}>
        {/* 장식 */}
        <span className="absolute -top-3 left-5 text-xl text-arcade-pink">◆</span>
        <span className="absolute -top-3 right-5 text-xl text-arcade-pink">◆</span>

        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 font-pixel text-pixel-sm text-arcade-yellow hover:text-arcade-pink transition-colors disabled:opacity-50"
        >
          ✕
        </button>

        <div className="text-center">
          {!success ? (
            <>
              {/* 제목 */}
              <h3 className="font-pixel text-pixel-lg text-arcade-yellow mb-2"
                  style={{ textShadow: '2px 2px 0 #ff2a6d' }}>
                EMAIL SIGNUP
              </h3>
              <p className="font-retro text-retro-base text-arcade-cyan mb-6">
                ENTER YOUR EMAIL<br />GET VERIFICATION CODE
              </p>

              {/* 에러 메시지 */}
              {error && (
                <div className="mb-4 p-3 bg-arcade-dark border-3 border-arcade-pink">
                  <p className="font-retro text-retro-base text-arcade-pink">
                    ⚠️ {error}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="YOUR@EMAIL.COM"
                  disabled={isSubmitting}
                  className="w-full font-retro text-retro-base bg-arcade-black text-white border-3 border-arcade-yellow px-4 py-3 focus:border-arcade-pink focus:shadow-neon-pink transition-all placeholder:text-arcade-yellow/50 disabled:opacity-50"
                  required
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full font-pixel text-pixel-sm py-4 border-4 border-white transition-all ${
                    isSubmitting
                      ? 'bg-arcade-dark text-arcade-yellow/50 cursor-not-allowed'
                      : 'bg-arcade-yellow text-arcade-black hover:translate-y-[-2px] hover:shadow-[0_6px_30px_rgba(249,240,2,0.5)] cursor-pointer'
                  }`}
                >
                  {isSubmitting ? 'SENDING...' : 'SEND CODE ▶'}
                </button>
              </form>

              <p className="mt-4 font-retro text-retro-sm text-arcade-cyan/50">
                CHECK SPAM FOLDER IF NOT RECEIVED
              </p>
            </>
          ) : (
            <>
              {/* 성공 메시지 */}
              <div className="mb-6">
                <div className="w-20 h-20 bg-arcade-green border-4 border-arcade-yellow mx-auto mb-4 flex items-center justify-center animate-pulse-badge">
                  <span className="text-4xl">✓</span>
                </div>
                <h3 className="font-pixel text-pixel-lg text-arcade-green mb-3"
                    style={{ textShadow: '2px 2px 0 #ff2a6d' }}>
                  CODE SENT!
                </h3>
                <p className="font-retro text-retro-base text-arcade-cyan mb-4">
                  6-DIGIT CODE SENT TO:<br />
                  <span className="text-arcade-yellow">{email}</span>
                </p>
                <div className="p-3 bg-arcade-black border-2 border-arcade-cyan">
                  <p className="font-retro text-retro-sm text-arcade-cyan">
                    <span className="font-pixel text-pixel-xs text-arcade-yellow">EXAMPLE:</span><br />
                    <span className="font-pixel text-pixel-base text-arcade-green">1 2 3 4 5 6</span>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
