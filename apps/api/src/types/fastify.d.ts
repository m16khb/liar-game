// Fastify Request 타입 확장
// 인증 미들웨어에서 추가하는 user와 internalUser 프로퍼티 타입 정의

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      email: string
      role?: string
    }
    internalUser?: {
      id: number
      email: string
      nickname: string
      avatarUrl?: string
    }
  }
}