// OTP 인증 컴포넌트
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
      // 동일한 이메일에 대한 OTP가 있고 유효한 경우
      if (otpData.email === email) {
        const remainingTime = getOTPRemainingTime()
        if (remainingTime) {
          setTimeLeft(remainingTime)
          setAttemptsLeft(Math.max(0, 5 - otpData.attempts))
        } else {
          // 유효시간이 지났으면 새로 저장
          saveOTPToStorage(email)
          setAttemptsLeft(5)
        }
      } else {
        // 다른 이메일이면 기존 데이터 삭제하고 새로 저장
        clearOTPFromStorage()
        saveOTPToStorage(email)
        setAttemptsLeft(5)
      }
    } else {
      // OTP 정보가 없으면 새로 저장
      saveOTPToStorage(email)
      setAttemptsLeft(5)
    }
  }, [email])

  // 타이머�
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
    if (value.length > 1) return // 한 글자만 허용

    // 숫자만 허용
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // 에러 상태 초기화 (입력 중이면)
    if (error) setError(null)

    // 자동 다음 필드로 이동
    if (value && index < 7) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement
      nextInput?.focus()
    }

    // 6자리 모두 입력되면 유효성 검사
    if (newOtp.every(digit => digit.length === 1)) {
      const otpString = newOtp.join('')
      if (/^\d{6}$/.test(otpString)) {
        console.log('6자리 OTP 입력 완료:', otpString)
      } else {
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

  // 붙여넣기 처리 - 6자리
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

    // 클라이언트 측 유효성 검사
    if (otpString.length !== 6) {
      setError('6자리 인증 코드를 모두 입력해주세요.')
      return
    }

    if (!/^\d+$/.test(otpString)) {
      setError('인증 코드는 숫자만 입력 가능합니다.')
      return
    }

    // 시도 횟수 확인
    if (attemptsLeft <= 0) {
      setError('인증 시도 횟수를 초과했습니다. 이메일 재전송 후 다시 시도해주세요.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await verifyOtp(email, otpString)

      // 인증 성공 시 localStorage에서 OTP 정보 삭제
      clearOTPFromStorage()

      // URL에 OTP 토큰 추가하여 비밀번호 설정 페이지로 전달
      const url = new URL(`${window.location.origin}/set-password`)
      url.searchParams.set('email', email)
      url.searchParams.set('otp', otpString) // OTP 토큰 전달
      window.location.href = url.toString()

      // onOtpVerified()는 호출하지 않고 바로 페이지 이동
    } catch (error: any) {
      // 실패했을 때만 시도 횟수 감소
      const remaining = incrementOTPAttempts()
      setAttemptsLeft(remaining)

      // 더 구체적인 에러 메시지
      const errorMessage = error.message || '인증 코드가 올바르지 않습니다. 다시 확인해주세요.'

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
      // 새 OTP 발송
      await sendEmailVerification(email)

      // localStorage에 새 OTP 정보 저장
      saveOTPToStorage(email)

      // 타이머와 시도 횟수 리셋
      setTimeLeft(600)
      setAttemptsLeft(5)

      // OTP 입력 필드 초기화
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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '48px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '448px'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          padding: '32px'
        }}>
          {/* 헤더 */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#ff6b6b',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <span style={{ fontSize: '24px' }}>📧</span>
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              이메일 인증
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              <strong>{email}</strong>로 전송된<br />
              6자리 인증 코드를 입력해주세요
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* OTP 입력 폼 */}
          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '24px',
              gap: '6px',
              flexWrap: 'wrap'
            }}>
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
                  style={{
                    width: window.innerWidth < 480 ? '38px' : '42px',
                    height: '50px',
                    fontSize: window.innerWidth < 480 ? '16px' : '18px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    border: error ? '2px solid #ef4444' : '2px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    color: '#1f2937',
                    transition: 'all 0.2s',
                    fontFamily: 'monospace',
                    opacity: isSubmitting ? 0.6 : 1
                  }}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              ))}
            </div>

            {/* 남은 시간 및 시도 횟수 */}
            <div style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              {timeLeft > 0 ? (
                <div>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                    유효시간: <span style={{ fontWeight: 'bold', color: '#ff6b6b' }}>
                      {formatTime(timeLeft)}
                    </span>
                  </p>
                  <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                    남은 시도 횟수: <span style={{
                      fontWeight: 'bold',
                      color: attemptsLeft <= 2 ? '#ef4444' : '#6b7280'
                    }}>
                      {attemptsLeft}/5
                    </span>
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '14px', color: '#dc2626', marginBottom: '4px' }}>
                    인증 코드가 만료되었습니다.
                  </p>
                  <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                    인증 코드 재발송 후 다시 시도해주세요.
                  </p>
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="submit"
                disabled={isSubmitting || otpString.length !== 6 || timeLeft <= 0}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: isSubmitting || otpString.length !== 6 || timeLeft <= 0
                    ? '#d1d5db'
                    : '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isSubmitting || otpString.length !== 6 || timeLeft <= 0
                    ? 'not-allowed'
                    : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {isSubmitting ? '인증 중...' : '인증하기'}
              </button>

              <div style={{ textAlign: 'center' }}>
                {timeLeft > 0 ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isResending ? '#9ca3af' : '#3b82f6',
                      fontSize: '14px',
                      cursor: isResending ? 'not-allowed' : 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {isResending ? '재전송 중...' : '이메일 재전송'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isResending ? '#9ca3af' : '#ff6b6b',
                      fontSize: '14px',
                      cursor: isResending ? 'not-allowed' : 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {isResending ? '재전송 중...' : '인증 코드 재발송'}
                  </button>
                )}
                <span style={{ margin: '0 8px', color: '#d1d5db' }}>•</span>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    fontSize: '14px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}