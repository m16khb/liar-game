// 날짜/시간 유틸리티
// dayjs 기반 시간대 처리 (UTC/KST)

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

// dayjs 플러그인 확장
dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * 날짜/시간 유틸리티 클래스
 * 한국 시간대 처리를 위한 기능 제공
 */
export class DateUtils {
  private static readonly KST_TIMEZONE = 'Asia/Seoul'

  /**
   * 현재 UTC 시간 반환
   */
  static nowUTC(): Date {
    return dayjs.utc().toDate()
  }

  /**
   * 현재 KST 시간 반환
   */
  static nowKST(): Date {
    return dayjs().tz(this.KST_TIMEZONE).toDate()
  }

  /**
   * UTC 날짜를 KST로 변환
   */
  static utcToKst(date: Date | string): Date {
    return dayjs(date).tz(this.KST_TIMEZONE).toDate()
  }

  /**
   * KST 날짜를 UTC로 변환
   */
  static kstToUtc(date: Date | string): Date {
    const kstDate = dayjs.tz(date, this.KST_TIMEZONE)
    return kstDate.utc().toDate()
  }

  /**
   * 날짜를 ISO 8601 형식으로 변환 (UTC 기준)
   */
  static toISOString(date: Date): string {
    return dayjs(date).utc().toISOString()
  }

  /**
   * KST 기반 날짜 포맷팅
   */
  static formatKst(date: Date | string, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    return dayjs(date).tz(this.KST_TIMEZONE).format(format)
  }

  /**
   * UTC 기반 날짜 포맷팅
   */
  static formatUtc(date: Date | string, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    return dayjs(date).utc().format(format)
  }

  /**
   * 상대적인 시간 표시 (KST 기준)
   * 예: "5분 전", "2시간 전", "3일 전"
   */
  static fromNowInKst(date: Date | string): string {
    // dayjs의 relativeTime 플러그인이 필요하지만,
    // 간단한 구현을 직접 제공
    const now = dayjs().tz(this.KST_TIMEZONE)
    const target = dayjs(date).tz(this.KST_TIMEZONE)
    const diffMinutes = now.diff(target, 'minute')
    const diffHours = now.diff(target, 'hour')
    const diffDays = now.diff(target, 'day')

    if (diffMinutes < 1) return '방금 전'
    if (diffMinutes < 60) return `${diffMinutes}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`

    return this.formatKst(date, 'MM월 DD일')
  }

  /**
   * 유효한 날짜인지 확인
   */
  static isValid(date: any): boolean {
    return dayjs(date).isValid()
  }

  /**
   * 날짜가 특정 범위 내에 있는지 확인
   */
  static isBetween(date: Date | string, start: Date | string, end: Date | string): boolean {
    const target = dayjs(date)
    return target.isAfter(start) && target.isBefore(end)
  }

  /**
   * 날짜에 시간/분/초 추가
   */
  static addTime(date: Date | string, amount: number, unit: 'minute' | 'hour' | 'day' | 'week' | 'month'): Date {
    return dayjs(date).add(amount, unit).toDate()
  }

  /**
   * 날짜에서 시간/분/초 빼기
   */
  static subtractTime(date: Date | string, amount: number, unit: 'minute' | 'hour' | 'day' | 'week' | 'month'): Date {
    return dayjs(date).subtract(amount, unit).toDate()
  }

  /**
   * 날짜의 시작 시간 (00:00:00) 반환 (KST 기준)
   */
  static startOfDayInKst(date: Date | string): Date {
    return dayjs(date).tz(this.KST_TIMEZONE).startOf('day').toDate()
  }

  /**
   * 날짜의 끝 시간 (23:59:59) 반환 (KST 기준)
   */
  static endOfDayInKst(date: Date | string): Date {
    return dayjs(date).tz(this.KST_TIMEZONE).endOf('day').toDate()
  }

  /**
   * 두 날짜 사이의 차이 계산
   */
  static diffInMinutes(start: Date | string, end: Date | string): number {
    return dayjs(end).diff(dayjs(start), 'minute')
  }

  /**
   * 날짜를 Unix 타임스탬프로 변환
   */
  static toTimestamp(date: Date | string): number {
    return dayjs(date).unix()
  }

  /**
   * Unix 타임스탬프를 날짜로 변환 (UTC)
   */
  static fromTimestamp(timestamp: number): Date {
    return dayjs.unix(timestamp).utc().toDate()
  }

  /**
   * 데이터베이스 저장용 날짜 객체 생성 (UTC 기준)
   */
  static forDatabase(date?: Date | string): Date {
    return date ? dayjs(date).utc().toDate() : dayjs.utc().toDate()
  }

  /**
   * API 응답용 날짜 문자열 생성 (KST 기준)
   */
  static forApiResponse(date: Date | string): string {
    return this.formatKst(date, 'YYYY-MM-DDTHH:mm:ssZ')
  }
}

/**
 * 날짜 관련 상수
 */
export const DATE_CONSTANTS = {
  KST_TIMEZONE: 'Asia/Seoul',
  DEFAULT_DATE_FORMAT: 'YYYY-MM-DD',
  DEFAULT_DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  ISO_FORMAT: 'YYYY-MM-DDTHH:mm:ssZ',
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  SECONDS_PER_MINUTE: 60,
} as const

/**
 * 자주 사용하는 날짜 유틸리티 함수들 (간단한 버전)
 */
export const formatDate = (date: Date | string, format?: string) => DateUtils.formatKst(date, format)
export const fromNow = (date: Date | string) => DateUtils.fromNowInKst(date)
export const nowUTC = () => DateUtils.nowUTC()
export const nowKST = () => DateUtils.nowKST()