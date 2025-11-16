// OTP 관련 localStorage 유틸리티
// OTP 인증 정보를 안전하게 저장하고 관리

import dayjs from 'dayjs'

const OTP_STORAGE_KEY = 'liar_game_otp'
const OTP_EXPIRY_MINUTES = 10

interface OTPData {
  email: string
  timestamp: number
  attempts: number
}

/**
 * OTP 정보를 localStorage에 저장
 * @param email 이메일 주소
 */
export const saveOTPToStorage = (email: string): void => {
  const otpData: OTPData = {
    email,
    timestamp: dayjs().valueOf(),
    attempts: 0,
  }

  try {
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otpData))
  } catch (error) {
    console.warn('OTP 저장 실패:', error)
  }
}

/**
 * localStorage에서 OTP 정보 가져오기
 * @returns OTP 데이터 또는 null
 */
export const getOTPFromStorage = (): OTPData | null => {
  try {
    const stored = localStorage.getItem(OTP_STORAGE_KEY)
    if (!stored) return null

    const otpData: OTPData = JSON.parse(stored)

    // 유효기간 확인 (10분)
    const now = dayjs().valueOf()
    const expiryTime = otpData.timestamp + (OTP_EXPIRY_MINUTES * 60 * 1000)

    if (now > expiryTime) {
      // 유효기간 지남 - 삭제
      clearOTPFromStorage()
      return null
    }

    return otpData
  } catch (error) {
    console.warn('OTP 조회 실패:', error)
    clearOTPFromStorage()
    return null
  }
}

/**
 * OTP 시도 횟수 증가
 * @returns 남은 시도 횟수 (최대 5회)
 */
export const incrementOTPAttempts = (): number => {
  try {
    const otpData = getOTPFromStorage()
    if (!otpData) return 0

    otpData.attempts += 1
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otpData))

    // 최대 5회 시도 가능
    return Math.max(0, 5 - otpData.attempts)
  } catch (error) {
    console.warn('OTP 시도 횟수 증가 실패:', error)
    return 0
  }
}

/**
 * OTP 정보 삭제 (인증 성공 또는 유효기간 만료 시)
 */
export const clearOTPFromStorage = (): void => {
  try {
    localStorage.removeItem(OTP_STORAGE_KEY)
  } catch (error) {
    console.warn('OTP 삭제 실패:', error)
  }
}

/**
 * OTP 남은 유효시간 계산
 * @returns 남은 시간 (초) 또는 null
 */
export const getOTPRemainingTime = (): number | null => {
  const otpData = getOTPFromStorage()
  if (!otpData) return null

  const now = dayjs().valueOf()
  const expiryTime = otpData.timestamp + (OTP_EXPIRY_MINUTES * 60 * 1000)
  const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000))

  return remaining > 0 ? remaining : null
}

/**
 * 이메일로 OTP 발송 가능 여부 확인
 * @param email 확인할 이메일
 * @returns 발송 가능 여부
 */
export const canSendOTP = (email: string): boolean => {
  const otpData = getOTPFromStorage()

  // 저장된 OTP가 없으면 발송 가능
  if (!otpData) return true

  // 다른 이메일이면 발송 가능
  if (otpData.email !== email) return true

  // 시도 횟수 초과 여부 확인
  if (otpData.attempts >= 5) return false

  // 유효기간 확인
  const remaining = getOTPRemainingTime()
  return remaining === null || remaining <= 0
}