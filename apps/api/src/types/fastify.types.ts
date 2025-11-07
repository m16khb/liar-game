/**
 * Fastify Request 타입 확장
 * 인증 관련 프로퍼티들을 FastifyRequest에 추가
 */

import { FastifyRequest } from 'fastify'

// 사용자 정보 인터페이스
export interface User {
  id: string
  email: string
  user_metadata?: Record<string, any>
  app_metadata?: Record<string, any>
}

// 내부 사용자 정보 인터페이스
export interface InternalUser {
  id: number
  email: string
  nickname: string
  avatarUrl?: string
}

// Headers 타입 정의
interface FastifyHeaders {
  authorization?: string
  [key: string]: string | string[] | undefined
}

// FastifyRequest 타입 확장
declare global {
  namespace Fastify {
    interface FastifyRequest {
      user?: User
      internalUser?: InternalUser
      headers: FastifyHeaders
    }
  }
}

export {}