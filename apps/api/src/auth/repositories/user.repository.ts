// 사용자 리포지토리 구현
// TypeORM Repository 패턴 기반의 데이터 접근 계층
// SOLID 원칙 준수: 단일 책임, 개방/폐쇄, 인터페이스 분리

import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../entities/user.entity'
import { IUserRepository } from '../interfaces/user-repository.interface'

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly typeOrmRepository: Repository<User>,
  ) {}

  /**
   * ID로 사용자 조회
   * 내부 데이터베이스 기본 키를 사용한 빠른 조회
   */
  async findById(id: number): Promise<User | null> {
    return await this.typeOrmRepository.findOne({
      where: { id },
    })
  }

  /**
   * OAuth ID로 사용자 조회
   * Supabase 인증 시스템과 연동을 위한 조회
   */
  async findByOAuthId(oauthId: string): Promise<User | null> {
    return await this.typeOrmRepository.findOne({
      where: { oauthId },
    })
  }

  /**
   * 이메일로 사용자 조회
   * 이메일 중복 확인 및 로그인 처리에 사용
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.typeOrmRepository.findOne({
      where: { email },
    })
  }

  /**
   * 닉네임으로 사용자 조회
   * 닉네임 중복 확인에 사용
   */
  async findByNickname(nickname: string): Promise<User | null> {
    return await this.typeOrmRepository.findOne({
      where: { nickname },
    })
  }

  /**
   * 새 사용자 생성
   * Supabase 인증 성공 후 내부 데이터베이스에 사용자 정보 저장
   */
  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const newUser = this.typeOrmRepository.create(userData)
    return await this.typeOrmRepository.save(newUser)
  }

  /**
   * 사용자 정보 수정
   * 닉네임, 프로필 이미지 등 수정
   */
  async update(id: number, updateData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User> {
    await this.typeOrmRepository.update(id, updateData)
    const updatedUser = await this.findById(id)

    if (!updatedUser) {
      throw new Error(`사용자(ID: ${id})를 찾을 수 없습니다`)
    }

    return updatedUser
  }

  /**
   * 사용자 삭제
   * 참조 무결성을 고려한 실제 삭제
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.typeOrmRepository.delete(id)
    return result.affected > 0
  }

  /**
   * 이메일 존재 여부 확인
   * 회원가입 시 중복 검사에 사용
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.typeOrmRepository.count({
      where: { email },
    })
    return count > 0
  }

  /**
   * 닉네임 존재 여부 확인
   * 닉네임 설정 시 중복 검사에 사용
   */
  async existsByNickname(nickname: string): Promise<boolean> {
    const count = await this.typeOrmRepository.count({
      where: { nickname },
    })
    return count > 0
  }

  /**
   * 다른 사용자가 사용 중인 닉네임인지 확인
   * 닉네임 변경 시 현재 사용자는 제외하고 검사
   */
  async isNicknameTakenByOther(nickname: string, excludeUserId: number): Promise<boolean> {
    const count = await this.typeOrmRepository.count({
      where: {
        nickname,
        id: { $ne: excludeUserId } as any, // TypeORM 다른 방식
      },
    })
    return count > 0
  }

  /**
   * 마지막 활동 시간 업데이트
   * updatedAt 필드를 활용한 자동 업데이트
   */
  async updateLastActive(id: number): Promise<boolean> {
    const result = await this.typeOrmRepository.update(id, {})
    return result.affected > 0
  }

  /**
   * TypeORM Repository 직접 접근 (고급 쿼리용)
   */
  getRepository(): Repository<User> {
    return this.typeOrmRepository
  }

  /**
   * 복잡한 쿼리를 위한 커스텀 메서드
   * 예: 특정 기간 동안 가입한 사용자 조회
   */
  async findUsersByDateRange(startDate: Date, endDate: Date): Promise<User[]> {
    return await this.typeOrmRepository
      .createQueryBuilder('user')
      .where('user.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('user.createdAt', 'DESC')
      .getMany()
  }

  /**
   * 닉네임 검색 (부분 일치)
   * 관리자 기능이나 친구 찾기 기능에 사용
   */
  async searchByNickname(keyword: string, limit: number = 10): Promise<User[]> {
    return await this.typeOrmRepository
      .createQueryBuilder('user')
      .where('user.nickname LIKE :keyword', {
        keyword: `%${keyword}%`,
      })
      .limit(limit)
      .getMany()
  }
}