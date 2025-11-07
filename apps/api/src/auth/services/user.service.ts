// 사용자 서비스
// 비즈니스 로직 처리 및 데이터베이스 연동
// SOLID 원칙: 단일 책임, 의존성 주입

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { User, UserTier, UserRole } from '../entities/user.entity'
import { UserRepository } from '../repositories/user.repository'
import { SupabaseService } from './supabase.service'
import { RedisSessionService } from '../../session/redis-session.service'
import { AppLoggerService } from '../../logger/app.logger.service'
// import { DateUtils } from '../../utils/date.utils' // 임시 주석 처리

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly supabaseService: SupabaseService,
    private readonly redisService: RedisSessionService,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * Supabase 인증 후 사용자 정보 생성 또는 조회
   * 소셜 로그인 및 이메일 로그인 후 호출
   */
  async findOrCreateUser(supabaseId: string, email: string): Promise<User> {
    this.logger.info(`사용자 찾기 또는 생성 시도: ${email}`, { supabaseId })

    // 기존 사용자 조회
    let user = await this.userRepository.findByOAuthId(supabaseId)

    if (!user) {
      // 신규 사용자 생성
      user = await this.createNewUser(supabaseId, email)
      this.logger.info(`신규 사용자 생성 완료: ${email}`, { userId: user.id })
    } else {
      // 기존 사용자 정보 업데이트 (마지막 접속 시간)
      await this.userRepository.updateLastActive(user.id)
      this.logger.debug(`기존 사용자 접속: ${email}`, { userId: user.id })
    }

    // Redis에 세션 정보 저장
    await this.redisService.setSession(
      `user:${user.id}`,
      {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        lastActive: new Date(), // TODO: DateUtils.nowUTC() 복구 후 사용
      },
      86400, // 24시간
    )

    return user
  }

  /**
   * 새 사용자 생성
   * 최소한의 정보로 초기 사용자 계정 생성
   */
  private async createNewUser(supabaseId: string, email: string): Promise<User> {
    // Supabase에서 사용자 추가 정보 가져오기
    const supabaseUser = await this.supabaseService.getUserByToken(supabaseId)

    const userData = {
      oauthId: supabaseId,
      email,
      nickname: supabaseUser.user_metadata?.nickname || this.generateDefaultNickname(email),
      avatarUrl: supabaseUser.user_metadata?.avatar_url || null,
      tier: UserTier.MEMBER,
      role: UserRole.USER,
    }

    return await this.userRepository.create(userData)
  }

  /**
   * 기본 닉네임 생성 (이메일 기반)
   * 사용자가 닉네임을 설정하지 않았을 때 임시로 사용
   */
  private generateDefaultNickname(email: string): string {
    const username = email.split('@')[0]
    const randomSuffix = Math.floor(Math.random() * 1000)
    return `사용자${username}${randomSuffix}`
  }

  /**
   * 사용자 프로필 조회
   * 현재 로그인한 사용자의 상세 정보 반환
   */
  async getUserProfile(userId: number): Promise<User> {
    const user = await this.userRepository.findById(userId)

    if (!user) {
      throw new NotFoundException(`사용자(ID: ${userId})를 찾을 수 없습니다`)
    }

    this.logger.debug(`사용자 프로필 조회: ${user.email}`, { userId })

    return user
  }

  /**
   * 사용자 프로필 수정
   * 닉네임, 프로필 이미지 등 수정
   */
  async updateProfile(
    userId: number,
    updateData: { nickname?: string; avatarUrl?: string },
  ): Promise<User> {
    const existingUser = await this.userRepository.findById(userId)

    if (!existingUser) {
      throw new NotFoundException(`사용자(ID: ${userId})를 찾을 수 없습니다`)
    }

    // 닉네임 중복 검사
    if (updateData.nickname) {
      await this.validateNickname(updateData.nickname, userId)
    }

    // 프로필 이미지 URL 유효성 검사
    if (updateData.avatarUrl) {
      this.validateAvatarUrl(updateData.avatarUrl)
    }

    const updatedUser = await this.userRepository.update(userId, updateData)

    this.logger.info(`사용자 프로필 수정 완료: ${existingUser.email}`, {
      userId,
      updatedFields: Object.keys(updateData),
    })

    // Redis 캐시 업데이트
    await this.updateUserCache(updatedUser)

    return updatedUser
  }

  /**
   * 닉네임 유효성 검사
   * 길이, 특수문자, 중복 검사
   */
  private async validateNickname(nickname: string, excludeUserId: number): Promise<void> {
    // 길이 검사 (2-20자)
    if (nickname.length < 2 || nickname.length > 20) {
      throw new ConflictException('닉네임은 2-20자 사이여야 합니다')
    }

    // 특수문자 검사 (한글, 영문, 숫자만 허용)
    const nicknameRegex = /^[가-힣a-zA-Z0-9]+$/
    if (!nicknameRegex.test(nickname)) {
      throw new ConflictException('닉네임은 한글, 영문, 숫자만 사용 가능합니다')
    }

    // 중복 검사
    const isTaken = await this.userRepository.isNicknameTakenByOther(nickname, excludeUserId)
    if (isTaken) {
      throw new ConflictException('이미 사용 중인 닉네임입니다')
    }
  }

  /**
   * 프로필 이미지 URL 유효성 검사
   */
  private validateAvatarUrl(url: string): void {
    try {
      new URL(url)
    } catch {
      throw new ConflictException('유효하지 않은 프로필 이미지 URL입니다')
    }

    // 허용된 이미지 확장자 검사
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const hasAllowedExtension = allowedExtensions.some(ext =>
      url.toLowerCase().includes(ext)
    )

    if (!hasAllowedExtension) {
      throw new ConflictException('지원하지 않는 이미지 형식입니다')
    }
  }

  /**
   * Redis 캐시 업데이트
   * 사용자 정보 변경 시 캐시 동기화
   */
  private async updateUserCache(user: User): Promise<void> {
    await this.redisService.setSession(
      `user:${user.id}`,
      {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        lastActive: new Date(), // TODO: DateUtils.nowUTC() 복구 후 사용
      },
      86400,
    )
  }

  /**
   * 사용자 온라인 상태 설정
   * WebSocket 연결 시 호출
   */
  async setUserOnline(userId: number): Promise<void> {
    await this.redisService.setUserOnline(userId)
    this.logger.debug(`사용자 온라인 상태 설정`, { userId })
  }

  /**
   * 사용자 오프라인 상태 설정
   * WebSocket 연결 종료 시 호출
   */
  async setUserOffline(userId: number): Promise<void> {
    await this.redisService.setUserOffline(userId)
    this.logger.debug(`사용자 오프라인 상태 설정`, { userId })
  }

  /**
   * 사용자 온라인 여부 확인
   */
  async isUserOnline(userId: number): Promise<boolean> {
    return await this.redisService.isUserOnline(userId)
  }

  /**
   * 사용자 삭제 (계정 탈퇴)
   * 관련된 모든 데이터 정리
   */
  async deleteUser(userId: number): Promise<void> {
    const user = await this.userRepository.findById(userId)

    if (!user) {
      throw new NotFoundException(`사용자(ID: ${userId})를 찾을 수 없습니다`)
    }

    // TODO: 관련된 게임 방, 참여 기록 등 정리
    // 지금은 기본 사용자 정보만 삭제

    await this.userRepository.delete(userId)

    // Redis 캐시 정리
    await this.redisService.deleteSession(`user:${userId}`)

    this.logger.info(`사용자 계정 삭제 완료: ${user.email}`, { userId })
  }

  /**
   * 닉네임으로 사용자 검색
   * 친구 찾기 등에 사용
   */
  async searchUsersByNickname(keyword: string, limit: number = 10): Promise<User[]> {
    if (keyword.length < 2) {
      return []
    }

    const users = await this.userRepository.searchByNickname(keyword, limit)

    this.logger.debug(`닉네임으로 사용자 검색: ${keyword}`, {
      keyword,
      resultCount: users.length,
    })

    return users
  }
}