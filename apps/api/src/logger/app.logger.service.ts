// 애플리케이션 로깅 서비스
// Promtail + Loki + Grafana 스택 연동

import { Injectable, OnModuleInit } from '@nestjs/common'

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  service: string
  userId?: number
  roomId?: number
  requestId?: string
  metadata?: Record<string, any>
}

@Injectable()
export class AppLoggerService implements OnModuleInit {
  private serviceName = 'liar-game-api'

  onModuleInit() {
    console.log('📝 로깅 서비스 초기화 완료')
  }

  /**
   * 디버그 로그
   */
  debug(message: string, metadata?: Record<string, any>, context?: Partial<LogEntry>): void {
    this.log(LogLevel.DEBUG, message, metadata, context)
  }

  /**
   * 정보 로그
   */
  info(message: string, metadata?: Record<string, any>, context?: Partial<LogEntry>): void {
    this.log(LogLevel.INFO, message, metadata, context)
  }

  /**
   * 경고 로그
   */
  warn(message: string, metadata?: Record<string, any>, context?: Partial<LogEntry>): void {
    this.log(LogLevel.WARN, message, metadata, context)
  }

  /**
   * 에러 로그
   */
  error(message: string, error?: Error | Record<string, any>, context?: Partial<LogEntry>): void {
    const metadata = error instanceof Error ? {
      errorMessage: error.message,
      stack: error.stack,
      name: error.name,
    } : error

    this.log(LogLevel.ERROR, message, metadata, context)
  }

  /**
   * 치명적 에러 로그
   */
  fatal(message: string, error?: Error | Record<string, any>, context?: Partial<LogEntry>): void {
    const metadata = error instanceof Error ? {
      errorMessage: error.message,
      stack: error.stack,
      name: error.name,
    } : error

    this.log(LogLevel.FATAL, message, metadata, context)
  }

  /**
   * 사용자 행동 로그
   */
  logUserAction(action: string, userId: number, metadata?: Record<string, any>): void {
    this.info(`사용자 행동: ${action}`, metadata, { userId })
  }

  /**
   * 게임 방 관련 로그
   */
  logRoomEvent(event: string, roomId: number, userId?: number, metadata?: Record<string, any>): void {
    this.info(`방 이벤트: ${event}`, metadata, { roomId, userId })
  }

  /**
   * API 요청 로그
   */
  logApiRequest(method: string, url: string, userId?: number, responseTime?: number, statusCode?: number): void {
    this.info(`API 요청: ${method} ${url}`, {
      method,
      url,
      responseTime,
      statusCode,
    }, { userId })
  }

  /**
   * 데이터베이스 쿼리 로그
   */
  logDatabaseQuery(query: string, executionTime?: number, error?: Error): void {
    if (error) {
      this.error(`DB 쿼리 실패: ${query}`, error)
    } else {
      this.debug(`DB 쿼리 실행: ${query}`, { executionTime })
    }
  }

  /**
   * WebSocket 이벤트 로그
   */
  logSocketEvent(event: string, socketId: string, userId?: number, data?: any): void {
    this.info(`Socket 이벤트: ${event}`, {
      socketId,
      event,
      data: typeof data === 'object' ? JSON.stringify(data) : data,
    }, { userId })
  }

  /**
   * 성능 메트릭 로그
   */
  logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
    this.info(`성능 측정: ${operation}`, {
      operation,
      duration,
      unit: 'ms',
      ...metadata,
    })
  }

  /**
   * 보안 관련 로그
   */
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: Record<string, any>): void {
    const level = severity === 'critical' ? LogLevel.FATAL :
                 severity === 'high' ? LogLevel.ERROR :
                 severity === 'medium' ? LogLevel.WARN : LogLevel.INFO

    this.log(level, `보안 이벤트: ${event}`, {
      securityEvent: true,
      severity,
      ...metadata,
    })
  }

  /**
   * 기본 로그 메서드
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, any>, context?: Partial<LogEntry>): void {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      ...context,
      metadata: metadata || {},
    }

    // 개발 환경에서는 콘솔에 출력
    if (process.env.NODE_ENV === 'development') {
      this.consoleLog(logEntry)
    }

    // 프로덕션 환경에서는 JSON 형식으로 출력 (Promtail이 수집)
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry))
    }
  }

  /**
   * 개발 환경용 콘솔 출력
   */
  private consoleLog(logEntry: LogEntry): void {
    const { level, message, timestamp, userId, roomId, metadata } = logEntry
    const contextInfo = []

    if (userId) contextInfo.push(`user:${userId}`)
    if (roomId) contextInfo.push(`room:${roomId}`)

    const contextStr = contextInfo.length > 0 ? `[${contextInfo.join(' ')}]` : ''
    const metaStr = Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : ''

    const logMessage = `${timestamp} [${level.toUpperCase()}] ${message}${contextStr}${metaStr}`

    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(logMessage)
        break
      case LogLevel.WARN:
        console.warn('⚠️', logMessage)
        break
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error('❌', logMessage)
        break
    }
  }

  /**
   * 서비스 이름 설정
   */
  setServiceName(name: string): void {
    this.serviceName = name
  }
}