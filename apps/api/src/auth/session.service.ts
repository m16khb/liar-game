import { Injectable } from '@nestjs/common';
// @CODE:AUTH-001:INFRA

@Injectable()
export class SessionService {
  async createSession(userId: string) {
    // Redis 세션 생성 (TTL 7일)
  }

  async getSession(sessionId: string) {
    // Redis 세션 조회
  }
}
