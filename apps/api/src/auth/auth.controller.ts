import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
// @CODE:AUTH-001:API

@Controller('auth')
export class AuthController {
  @Throttle(10, 60) // 10회/60초
  @Post('guest')
  async guestAuth() { /* ... */ }

  @Throttle(3, 60) // 3회/60초 (SPEC CON-004)
  @Post('register')
  async register(@Body() dto: RegisterDto) { /* ... */ }

  @Throttle(5, 60) // 5회/60초 (SPEC CON-004)
  @Post('login')
  async login(@Body() dto: LoginDto) { /* ... */ }

  @Post('refresh')
  async refreshToken(@Body() dto: RefreshTokenDto) { /* ... */ }

  @Post('logout')
  async logout() { /* ... */ }

  @Post('verify')
  async verifyToken() { /* ... */ }

  @Post('session')
  async getSession() { /* ... */ }
}
