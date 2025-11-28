import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vote } from '../entities/vote.entity';

/**
 * 게임 결과 인터페이스
 */
export interface GameResult {
  winner: 'LIAR' | 'CIVILIAN';
  liarId: number;
  mostVotedPlayerId: number;
  voteResults: Array<{ targetId: number; nickname: string; voteCount: number }>;
}

/**
 * 결과 계산 서비스
 * 게임 투표 단계 후 결과를 집계하고 승패를 결정합니다.
 */
@Injectable()
export class ResultCalculatorService {
  constructor(
    @InjectRepository(Vote)
    private voteRepository: Repository<Vote>,
  ) {}

  /**
   * 게임 결과를 계산합니다
   * @param roomId 방 ID
   * @param liarId 라이어 ID
   * @returns 게임 결과
   */
  async calculateResult(
    roomId: number,
    liarId: number,
    playerNicknameMap?: Map<number, string>,
  ): Promise<GameResult> {
    // 모든 투표 조회
    const votes = await this.voteRepository.find({
      where: { roomId },
    });

    // 투표 결과 집계
    const voteCount = new Map<number, number>();
    votes.forEach((vote) => {
      const currentCount = voteCount.get(vote.targetId) ?? 0;
      voteCount.set(vote.targetId, currentCount + 1);
    });

    // 최다 득표자 찾기
    let mostVotedPlayerId: number | null = null;
    let maxVotes = 0;

    // 먼저 투표된 플레이어 우선 (동점 시)
    for (const vote of votes) {
      const count = voteCount.get(vote.targetId) ?? 0;
      if (count > maxVotes) {
        maxVotes = count;
        mostVotedPlayerId = vote.targetId;
      }
    }

    // 승패 결정
    const winner = mostVotedPlayerId === liarId ? 'CIVILIAN' : 'LIAR';

    // 투표 결과 배열 생성
    const voteResults = Array.from(voteCount.entries()).map(([targetId, count]) => ({
      targetId,
      nickname: playerNicknameMap?.get(targetId) ?? `Player ${targetId}`,
      voteCount: count,
    }));

    return {
      winner,
      liarId,
      mostVotedPlayerId: mostVotedPlayerId ?? 0,
      voteResults,
    };
  }

  /**
   * 특정 방의 투표 통계를 조회합니다
   * @param roomId 방 ID
   * @returns 투표 통계
   */
  async getVoteStatistics(
    roomId: number,
  ): Promise<Map<number, number>> {
    const votes = await this.voteRepository.find({
      where: { roomId },
    });

    const stats = new Map<number, number>();
    votes.forEach((vote) => {
      const currentCount = stats.get(vote.targetId) ?? 0;
      stats.set(vote.targetId, currentCount + 1);
    });

    return stats;
  }
}
