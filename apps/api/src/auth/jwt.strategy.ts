// @CODE:AUTH-001:DOMAIN | SPEC: SPEC-AUTH-001.md
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Supabase JWT 검증을 위해 JWT_SECRET 사용
      secretOrKey: process.env.JWT_SECRET || 'test-secret',
    });
  }

  async validate(payload: any) {
    // Supabase JWT 구조: app_metadata.role
    // 자체 JWT 구조: role
    const role = payload.app_metadata?.role || payload.role || 'user';
    const username = payload.user_metadata?.username || payload.username || payload.email?.split('@')[0];

    return {
      userId: parseInt(payload.sub, 10),
      username,
      role,
      email: payload.email,
    };
  }
}
