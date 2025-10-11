import { Controller, Post, Body } from '@nestjs/common';
// @CODE:AUTH-001:API

@Controller('auth')
export class AuthController {
  @Post('guest')
  async guestAuth() { /* ... */ }

  @Post('register')
  async register(@Body() dto: RegisterDto) { /* ... */ }

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
