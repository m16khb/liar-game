// OTP 인증 컴포넌트 - Retro Arcade Theme
// 이메일로 전송된 OTP 코드 입력

import React, { useState, useEffect } from 'react'
import { verifyOtp, resendOtpEmail, sendEmailVerification } from '../../lib/supabase'
import {
  saveOTPToStorage,
  getOTPFromStorage,
  clearOTPFromStorage,
  getOTPRemainingTime,
  incrementOTPAttempts
} from '../../utils/otpStorage'

interface OtpVerificationProps {
  email: string
  onOtpVerified: () => void
  onCancel: () => void
}

export default function OtpVerification({
  email,
  onOtpVerified,
  onCancel
}: OtpVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(600) // 10분 (600초)
  const [isResending, setIsResending] = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState(5)

  // 초기 로드 시 localStorage 확인
  useEffect(() => {
    const otpData = getOTPFromStorage()
    if (otpData) {
      if (otpData.email === email) {
        const remainingTime = getOTPRemainingTime()
        if (remainingTime) {
          setTimeLeft(remainingTime)
          setAttemptsLeft(Math.max(0, 5 - otpData.attempts))
        } else {
          saveOTPToStorage(email)
          setAttemptsLeft(5)
        }
      } else {
        clearOTPFromStorage()
        saveOTPToStorage(email)
        setAttemptsLeft(5)
      }
    } else {
      saveOTPToStorage(email)
      setAttemptsLeft(5)
    }
  }, [email])

  // 타이머
  React.useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // OTP 입력 처리
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return

    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (error) setError(null)

    if (value && index < 7) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement
      nextInput?.focus()
    }

    if (newOtp.every(digit => digit.length === 1)) {
      const otpString = newOtp.join('')
      if (!/^\d{6}$/.test(otpString)) {
        setError('유효하지 않은 인증 코드입니다.')
      }
    }
  }

  // 키보드 이벤트 처리
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement
      prevInput?.focus()
    }
  }

  // 붙여넣기 처리
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
    }
  }

  // OTP 확인
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const otpString = otp.join('')

    if (otpString.length !== 6) {
      setError('6자리 인증 코드를 모두 입력해주세요.')
      return
    }

    if (!/^\d+$/.test(otpString)) {
      setError('인증 코드는 숫자만 입력 가능합니다.')
      return
    }

    if (attemptsLeft <= 0) {
      setError('인증 시도 횟수를 초과했습니다. 이메일 재전송 후 다시 시도해주세요.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await verifyOtp(email, otpString)
      clearOTPFromStorage()

      const url = new URL(`${window.location.origin}/set-password`)
      url.searchParams.set('email', email)
      url.searchParams.set('otp', otpString)
      window.location.href = url.toString()
    } catch (error) {
      const remaining = incrementOTPAttempts()
      setAttemptsLeft(remaining)

      const errorMessage = error instanceof Error ? error.message : '인증 코드가 올바르지 않습니다. 다시 확인해주세요.'

      if (remaining <= 0) {
        setError('인증 시도 횟수를 초과했습니다. 이메일 재전송 후 다시 시도해주세요.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // 재전송
  const handleResend = async () => {
    setIsResending(true)
    setError(null)

    try {
      await sendEmailVerification(email)
      saveOTPToStorage(email)
      setTimeLeft(600)
      setAttemptsLeft(5)
      setOtp(['', '', '', '', '', ''])
    } catch (error) {
      console.error('이메일 재전송 실패:', error)
      setError('이메일 재전송에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsResending(false)
    }
  }

  const otpString = otp.join('')

  return (
    <div className="min-h-screen bg-arcade-black px-4 py-12 flex items-center justify-center relative">
      {/* CRT Scanline Effect */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-10"
           style={{
             background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
           }} />

      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-5"
           style={{
             backgroundImage: 'linear-gradient(#05d9e8 1px, transparent 1px), linear-gradient(90deg, #05d9e8 1px, transparent 1px)',
             backgroundSize: '50px 50px'
           }} />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-arcade-dark border-4 border-arcade-cyan p-8 relative shadow-[0_0_60px_rgba(5,217,232,0.4)]">
          {/* 장식 */}
          <span className="absolute -top-3 left-5 text-xl text-arcade-yellow">◆</span>
          <span className="absolute -top-3 right-5 text-xl text-arcade-yellow">◆</span>

          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-arcade-pink border-4 border-arcade-yellow mx-auto mb-4 flex items-center justify-center relative">
              <span className="text-3xl">📧</span>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-arcade-green text-arcade-black text-xs flex items-center justify-center font-pixel">
                !
              </span>
            </div>
            <h2 className="font-pixel text-pixel-lg text-arcade-yellow mb-2"
                style={{ textShadow: '2px 2px 0 #ff2a6d' }}>
              VERIFY CODE
            </h2>
            <p className="font-retro text-retro-base text-arcade-cyan">
              <span className="text-arcade-yellow">{email}</span><br />
              ENTER 6-DIGIT CODE
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-3 bg-arcade-dark border-3 border-arcade-pink">
              <p className="font-retro text-retro-base text-arcade-pink text-center">
                ⚠️ {error}
              </p>
            </div>
          )}

          {/* OTP 입력 폼 */}
          <form onSubmit={handleSubmit}>
            <div className="flex justify-center mb-6 gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{1}"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={isSubmitting}
                  autoComplete="one-time-code"
                  className={`w-10 h-12 font-pixel text-pixel-lg text-center bg-arcade-black text-arcade-yellow border-3 transition-all disabled:opacity-50 focus:shadow-neon-cyan ${
                    error ? 'border-arcade-pink' : 'border-arcade-cyan focus:border-arcade-yellow'
                  }`}
                  placeholder="-"
                />
              ))}
            </div>

            {/* 타이머 및 시도 횟수 */}
            <div className="text-center mb-6 space-y-2">
              {timeLeft > 0 ? (
                <>
                  <p className="font-pixel text-pixel-xs text-arcade-pink">
                    TIME: <span className="text-arcade-yellow animate-blink">{formatTime(timeLeft)}</span>
                  </p>
                  <p className="font-retro text-retro-sm text-arcade-cyan">
                    ATTEMPTS: <span className={attemptsLeft <= 2 ? 'text-arcade-pink' : 'text-arcade-green'}>
                      {attemptsLeft}/5
                    </span>
                  </p>
                </>
              ) : (
                <div className="p-3 bg-arcade-dark border-2 border-arcade-pink">
                  <p className="font-pixel text-pixel-xs text-arcade-pink mb-1">
                    CODE EXPIRED!
                  </p>
                  <p className="font-retro text-retro-sm text-arcade-cyan">
                    RESEND CODE TO CONTINUE
                  </p>
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="space-y-4">
              <button
                type="submit"
                disabled={isSubmitting || otpString.length !== 6 || timeLeft <= 0}
                className={`w-full font-pixel text-pixel-sm py-4 border-4 border-white transition-all ${
                  isSubmitting || otpString.length !== 6 || timeLeft <= 0
                    ? 'bg-arcade-dark text-arcade-cyan/50 cursor-not-allowed'
                    : 'bg-arcade-green text-arcade-black hover:translate-y-[-2px] hover:shadow-[0_6px_30px_rgba(0,255,65,0.5)] cursor-pointer'
                }`}
              >
                {isSubmitting ? 'VERIFYING...' : 'VERIFY ▶'}
              </button>

              <div className="text-center font-retro text-retro-base space-x-2">
                {timeLeft > 0 ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-arcade-cyan hover:text-arcade-yellow transition-colors disabled:text-arcade-cyan/50"
                  >
                    {isResending ? 'SENDING...' : 'RESEND EMAIL'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-arcade-pink hover:text-arcade-yellow transition-colors disabled:text-arcade-pink/50"
                  >
                    {isResending ? 'SENDING...' : 'GET NEW CODE'}
                  </button>
                )}
                <span className="text-arcade-cyan/50">•</span>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="text-arcade-cyan hover:text-arcade-yellow transition-colors disabled:text-arcade-cyan/50"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom prompt */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 font-pixel text-[10px] text-arcade-yellow text-center animate-blink">
        CHECK YOUR EMAIL<br />▼ ▼ ▼
      </div>
    </div>
  )
}
