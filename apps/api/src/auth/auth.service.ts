import { Injectable } from '@nestjs/common';
// @CODE:AUTH-001:DOMAIN

@Injectable()
export class AuthService {
  async createGuestToken() {
    // 게스트 토큰 생성 로직
  }

  async register(email: string, password: string) {
    // 회원가입 로직
  }

  async login(email: string, password: string) {
    // 로그인 로직
  }
}
