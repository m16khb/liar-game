import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';

/**
 * 점수 업데이트 정보
 */
export interface ScoreUpdate {
  userId: number;
  nickname: string;
  previousScore: number;
  scoreChange: number;
  newScore: number;
  reason: 'CIVILIAN_WIN' | 'LIAR_WIN' | 'KEYWORD_CORRECT';
}

/**
 * 점수 업데이트 서비스
 * 게임 결과 후 플레이어들의 점수를 업데이트합니다.
 * 트랜잭션을 사용하여 원자성을 보장합니다.
 */
@Injectable()
export class ScoreUpdateService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private dataSource: DataSource,
  ) {}

  /**
   * 여러 사용자의 점수를 일괄 업데이트합니다 (트랜잭션)
   * @param updates 점수 업데이트 배열
   */
  async bulkUpdateScores(updates: ScoreUpdate[]): Promise<UserEntity[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updatedUsers: UserEntity[] = [];

      for (const update of updates) {
        const user = await queryRunner.manager.findOne(UserEntity, {
          where: { id: update.userId },
        });

        if (user) {
          user.score = update.newScore;
          const updatedUser = await queryRunner.manager.save(user);
          updatedUsers.push(updatedUser);
        }
      }

      await queryRunner.commitTransaction();
      return updatedUsers;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 사용자의 점수를 업데이트합니다
   * @param userId 사용자 ID
   * @param scoreChange 점수 변경량
   * @returns 업데이트된 사용자 정보
   */
  async updateScore(userId: number, scoreChange: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    user.score += scoreChange;
    return this.userRepository.save(user);
  }

  /**
   * 사용자의 현재 점수를 조회합니다
   * @param userId 사용자 ID
   * @returns 점수
   */
  async getPlayerScore(userId: number): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return user?.score ?? 0;
  }

  /**
   * 상위 플레이어들의 점수를 조회합니다
   * @param limit 조회 수 (기본값: 10)
   * @returns 상위 플레이어 배열
   */
  async getTopPlayers(limit: number = 10): Promise<UserEntity[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .orderBy('user.score', 'DESC')
      .limit(limit)
      .getMany();
  }
}
