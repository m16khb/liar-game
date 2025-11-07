// 사용자 리포지토리 인터페이스
// SOLID 원칙 중 의존성 역전 원칙(DIP) 적용
// 추상화에 의존하고 구체화에 의존하지 않음

import { User } from '../entities/user.entity'

/**
 * 사용자 데이터 접근을 위한 인터페이스
 * 데이터베이스 구현과 독립적인 추상화 계층 제공
 */
export interface IUserRepository {
  /**
   * ID로 사용자 조회
   * @param id 사용자 고유 ID
   * @returns 사용자 정보 또는 null
   */
  findById(id: number): Promise<User | null>

  /**
   * OAuth ID로 사용자 조회
   * @param oauthId Supabase OAuth ID
   * @returns 사용자 정보 또는 null
   */
  findByOAuthId(oauthId: string): Promise<User | null>

  /**
   * 이메일로 사용자 조회
   * @param email 이메일 주소
   * @returns 사용자 정보 또는 null
   */
  findByEmail(email: string): Promise<User | null>

  /**
   * 닉네임으로 사용자 조회
   * @param nickname 닉네임
   * @returns 사용자 정보 또는 null
   */
  findByNickname(nickname: string): Promise<User | null>

  /**
   * 새 사용자 생성
   * @param userData 사용자 데이터 (ID 제외)
   * @returns 생성된 사용자 정보
   */
  create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>

  /**
   * 사용자 정보 수정
   * @param id 사용자 고유 ID
   * @param updateData 수정할 데이터
   * @returns 수정된 사용자 정보
   */
  update(id: number, updateData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User>

  /**
   * 사용자 삭제 (소프트 삭제 아님)
   * @param id 사용자 고유 ID
   * @returns 삭제 성공 여부
   */
  delete(id: number): Promise<boolean>

  /**
   * 사용자 존재 여부 확인 (이메일 기준)
   * @param email 이메일 주소
   * @returns 존재 여부
   */
  existsByEmail(email: string): Promise<boolean>

  /**
   * 사용자 존재 여부 확인 (닉네임 기준)
   * @param nickname 닉네임
   * @returns 존재 여부
   */
  existsByNickname(nickname: string): Promise<boolean>

  /**
   * 닉네임 중복 확인 (특정 사용자 제외)
   * @param nickname 닉네임
   * @param excludeUserId 제외할 사용자 ID
   * @returns 중복 여부
   */
  isNicknameTakenByOther(nickname: string, excludeUserId: number): Promise<boolean>

  /**
   * 마지막 활동 시간 업데이트
   * @param id 사용자 고유 ID
   * @returns 업데이트 성공 여부
   */
  updateLastActive(id: number): Promise<boolean>
}