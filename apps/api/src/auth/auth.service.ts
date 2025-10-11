// @CODE:AUTH-001:DOMAIN | SPEC: SPEC-AUTH-001.md
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { SessionService, SessionData } from './session.service';
import { SupabaseAuthService } from './supabase-auth.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 12;
  private readonly ACCESS_TOKEN_TTL = '15m';

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private sessionService: SessionService,
    private supabaseAuthService: SupabaseAuthService,
  ) {}

  /**
   * 회원가입 (SPEC REQ-002)
   */
  async register(
    email: string,
    password: string,
    username: string,
    supabaseId?: string,
  ): Promise<{ userId: number } & AuthTokens & { user: UserResponse }> {
    // 이메일 중복 확인
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다');
    }

    // Supabase ID 중복 확인 (OAuth 연동 시)
    if (supabaseId) {
      const existingOAuthUser = await this.userRepository.findOne({
        where: { supabaseId },
      });
      if (existingOAuthUser) {
        throw new ConflictException('이미 연동된 Supabase 계정입니다');
      }
    }

    // 비밀번호 검증 (8자 이상, 영문+숫자 포함)
    if (
      password.length < 8 ||
      !/[a-zA-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      throw new BadRequestException(
        '비밀번호는 8자 이상, 영문+숫자를 포함해야 합니다',
      );
    }

    // 비밀번호 해싱 (SPEC CON-001: bcrypt saltRounds 12)
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // 사용자 생성
    const user = this.userRepository.create({
      email,
      passwordHash,
      username,
      supabaseId: supabaseId || null, // OAuth 연동 시 Supabase UID
    });

    const savedUser = await this.userRepository.save(user);

    // Redis 세션 생성
    await this.sessionService.createSession(savedUser.id.toString(), {
      id: savedUser.id.toString(),
      username: savedUser.username,
      role: 'USER',
      lastActivity: Date.now(),
    });

    // JWT 발급
    const tokens = await this.generateTokensWithRefresh(
      savedUser.id,
      username,
      'USER',
    );

    return {
      userId: savedUser.id,
      ...tokens,
      user: {
        id: savedUser.id,
        email: savedUser.email ?? undefined,
        username: savedUser.username,
      },
    };
  }

  /**
   * 로그인 (SPEC REQ-006)
   */
  async login(
    email: string,
    password: string,
  ): Promise<AuthTokens & { user: UserResponse }> {
    // 사용자 조회
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다');
    }

    // 비밀번호 검증 (SPEC: bcrypt.compare)
    if (!user.passwordHash) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다');
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다');
    }

    // Redis 세션 생성/갱신
    await this.sessionService.createSession(user.id.toString(), {
      id: user.id.toString(),
      username: user.username,
      role: 'USER',
      lastActivity: Date.now(),
    });

    // JWT 발급
    const tokens = await this.generateTokensWithRefresh(
      user.id,
      user.username,
      'USER',
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email ?? undefined,
        username: user.username,
      },
    };
  }

  /**
   * 로그아웃 (Supabase OAuth revoke)
   */
  async logout(
    userId: number,
    accessToken?: string,
  ): Promise<{ success: boolean }> {
    await this.sessionService.deleteSession(userId.toString());

    if (accessToken) {
      try {
        await this.supabaseAuthService.signOut(accessToken);
      } catch (error) {
        this.logger.warn('Supabase signOut failed', error);
      }
    }

    return { success: true };
  }

  /**
   * JWT 토큰 검증
   */
  async verifyJWT(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
    } catch {
      return null;
    }
  }

  /**
   * 토큰 쌍 생성 (액세스 전용, Supabase가 리프레시 관리)
   */
  private generateTokensWithRefresh(
    userId: number,
    username: string,
    role: string,
  ): AuthTokens {
    const accessToken = this.jwtService.sign(
      { sub: userId.toString(), username, role },
      {
        expiresIn: this.ACCESS_TOKEN_TTL,
        secret: process.env.JWT_ACCESS_SECRET,
      },
    );

    // Supabase가 refreshToken을 관리하므로 더미 값 반환
    const refreshToken = '';

    return { accessToken, refreshToken };
  }

  /**
   * OAuth 사용자 조회만 (생성 없음)
   */
  async findOAuthUser(supabaseUserId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { supabaseId: supabaseUserId },
    });
    return user;
  }

  /**
   * OAuth 사용자 찾기 또는 생성
   */
  async findOrCreateOAuthUser(
    supabaseUserId: string,
    email?: string,
    username?: string,
    provider?: string,
  ): Promise<User> {
    // 1. Supabase ID로 기존 사용자 찾기
    let user = await this.userRepository.findOne({
      where: { supabaseId: supabaseUserId },
    });

    if (user) {
      return user;
    }

    // 2. 없으면 신규 생성
    const finalUsername =
      username || email?.split('@')[0] || `user_${supabaseUserId.slice(0, 8)}`;

    user = this.userRepository.create({
      supabaseId: supabaseUserId,
      email: email || null,
      username: finalUsername,
      oauthProvider: provider || 'unknown',
      passwordHash: null, // OAuth 사용자는 비밀번호 없음
    });

    user = await this.userRepository.save(user);
    return user;
  }

  /**
   * OAuth 사용자용 자체 JWT 생성 (role 포함)
   */
  createOAuthToken(user: User): { accessToken: string } {
    // 자체 JWT_ACCESS_SECRET으로 서명 (Supabase JWT_SECRET 사용 안 함!)
    const accessToken = this.jwtService.sign(
      {
        sub: user.id.toString(), // 자체 DB의 user.id
        supabaseId: user.supabaseId, // Supabase user.id
        username: user.username,
        role: user.role, // ✨ role 포함
        email: user.email,
      },
      {
        expiresIn: this.ACCESS_TOKEN_TTL,
        secret: process.env.JWT_ACCESS_SECRET,
      },
    );

    return { accessToken };
  }
}
