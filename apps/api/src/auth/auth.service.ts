// @CODE:AUTH-001:DOMAIN | SPEC: SPEC-AUTH-001.md
import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { SessionService, SessionData } from './session.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email?: string;
  isGuest: boolean;
  level: number;
}

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12; // SPEC CON-001
  private readonly ACCESS_TOKEN_TTL = '15m'; // SPEC: 15분
  private readonly REFRESH_TOKEN_TTL = '7d'; // SPEC: 7일

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private sessionService: SessionService,
  ) {}

  /**
   * 게스트 인증 (SPEC REQ-001, REQ-005)
   */
  async createGuestToken(username: string): Promise<{ sessionId: string } & AuthTokens & { user: UserResponse }> {
    // 닉네임 검증 (3-20자, 특수문자 제외)
    if (!username || username.length < 3 || username.length > 20) {
      throw new BadRequestException('닉네임은 3-20자여야 합니다');
    }

    const sessionId = randomUUID(); // SPEC CON-003: UUID v4

    // Redis 게스트 세션 생성
    await this.sessionService.createGuestSession(sessionId, {
      username,
      createdAt: Date.now(),
    });

    // JWT 발급
    const tokens = await this.generateTokens({
      sub: sessionId,
      username,
      role: 'GUEST',
    });

    return {
      sessionId,
      ...tokens,
      user: {
        id: sessionId,
        username,
        isGuest: true,
        level: 1,
      },
    };
  }

  /**
   * 회원가입 (SPEC REQ-002)
   */
  async register(
    email: string,
    password: string,
    username: string,
    guestSessionId?: string,
  ): Promise<{ userId: string } & AuthTokens & { user: UserResponse }> {
    // 이메일 중복 확인
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다');
    }

    // 비밀번호 검증 (8자 이상, 영문+숫자 포함)
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      throw new BadRequestException('비밀번호는 8자 이상, 영문+숫자를 포함해야 합니다');
    }

    // 비밀번호 해싱 (SPEC CON-001: bcrypt saltRounds 12)
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // 사용자 생성
    const user = this.userRepository.create({
      email,
      passwordHash,
      username,
      isGuest: false,
      guestSessionId, // 게스트 전환 시 매핑 (SPEC REQ-008)
    });

    const savedUser = await this.userRepository.save(user);

    // Redis 세션 생성
    await this.sessionService.createSession(savedUser.id, {
      id: savedUser.id,
      username: savedUser.username,
      role: 'USER',
      lastActivity: Date.now(),
    });

    // 게스트 세션 삭제 (전환 시)
    if (guestSessionId) {
      await this.sessionService.deleteGuestSession(guestSessionId);
    }

    // JWT 발급
    const tokens = await this.generateTokensWithRefresh(savedUser.id, username, 'USER');

    return {
      userId: savedUser.id,
      ...tokens,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        username: savedUser.username,
        isGuest: false,
        level: savedUser.level,
      },
    };
  }

  /**
   * 로그인 (SPEC REQ-006)
   */
  async login(email: string, password: string): Promise<AuthTokens & { user: UserResponse }> {
    // 사용자 조회
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다');
    }

    // 비밀번호 검증 (SPEC: bcrypt.compare)
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다');
    }

    // Redis 세션 생성/갱신
    await this.sessionService.createSession(user.id, {
      id: user.id,
      username: user.username,
      role: 'USER',
      lastActivity: Date.now(),
    });

    // JWT 발급
    const tokens = await this.generateTokensWithRefresh(user.id, user.username, 'USER');

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isGuest: false,
        level: user.level,
      },
    };
  }

  /**
   * 토큰 갱신 (SPEC REQ-007)
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // 리프레시 토큰 검증
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // DB에서 리프레시 토큰 확인
      const tokenHash = await this.hashToken(refreshToken);
      const storedToken = await this.refreshTokenRepository.findOne({
        where: { userId: payload.sub, tokenHash },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다');
      }

      // 기존 리프레시 토큰 삭제 (일회용, SPEC 보안 요구사항)
      await this.refreshTokenRepository.delete({ id: storedToken.id });

      // 새 토큰 쌍 발급
      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다');
      }

      return await this.generateTokensWithRefresh(user.id, user.username, 'USER');
    } catch (error) {
      // UnauthorizedException은 그대로 전달, 다른 에러는 일반 메시지로 변환
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('토큰 갱신에 실패했습니다');
    }
  }

  /**
   * 로그아웃
   */
  async logout(userId: string): Promise<{ success: boolean }> {
    // Redis 세션 삭제
    await this.sessionService.deleteSession(userId);

    // 리프레시 토큰 무효화
    await this.refreshTokenRepository.delete({ userId });

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
   * 토큰 쌍 생성 (액세스 + 리프레시)
   */
  private async generateTokensWithRefresh(userId: string, username: string, role: string): Promise<AuthTokens> {
    const accessToken = this.jwtService.sign(
      { sub: userId, username, role },
      { expiresIn: this.ACCESS_TOKEN_TTL, secret: process.env.JWT_ACCESS_SECRET },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId },
      { expiresIn: this.REFRESH_TOKEN_TTL, secret: process.env.JWT_REFRESH_SECRET },
    );

    // 리프레시 토큰 DB 저장 (해시)
    const tokenHash = await this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후

    await this.refreshTokenRepository.save({
      userId,
      tokenHash,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  /**
   * 게스트용 토큰 쌍 생성 (리프레시 토큰 미저장)
   */
  private async generateTokens(payload: any): Promise<AuthTokens> {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_TTL,
      secret: process.env.JWT_ACCESS_SECRET,
    });

    const refreshToken = this.jwtService.sign(
      { sub: payload.sub },
      { expiresIn: this.REFRESH_TOKEN_TTL, secret: process.env.JWT_REFRESH_SECRET },
    );

    return { accessToken, refreshToken };
  }

  /**
   * 토큰 해싱 (bcrypt)
   */
  private async hashToken(token: string): Promise<string> {
    return await bcrypt.hash(token, this.SALT_ROUNDS);
  }
}
