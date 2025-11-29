import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vote } from '../entities/vote.entity';

/**
 * 점수 변경 정보
 */
export interface ScoreChange {
  userId: number;
  nickname: string;
  previousScore: number;
  scoreChange: number;
  newScore: number;
  reason: 'CIVILIAN_WIN' | 'LIAR_WIN' | 'LIAR_KEYWORD_BONUS';
}

/**
 * 게임 결과 인터페이스
 */
export interface GameResult {
  winner: 'LIAR' | 'CIVILIAN';
  liarId: number;
  liarCaughtByVote: boolean; // 라이어가 투표로 지목되었는지
  liarGuessedKeyword: boolean; // 라이어가 키워드를 맞췄는지
  mostVotedPlayerId: number;
  voteResults: Array<{ targetId: number; nickname: string; voteCount: number }>;
  scoreChanges: ScoreChange[];
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
   * 점수 시스템:
   * - 시민이 라이어를 맞추면: 시민 각각 +1점
   * - 시민이 라이어를 못 맞추면: 라이어 +1점
   * - 라이어가 키워드를 맞추면: 라이어 추가 +1점
   *
   * @param roomId 방 ID
   * @param liarId 라이어 ID
   * @param playerNicknameMap 플레이어 닉네임 맵
   * @param playerScoreMap 플레이어 현재 점수 맵 (점수 변경 계산용)
   * @param liarGuessedKeyword 라이어가 키워드를 맞췄는지 여부
   * @returns 게임 결과
   */
  async calculateResult(
    roomId: number,
    liarId: number,
    playerNicknameMap?: Map<number, string>,
    playerScoreMap?: Map<number, number>,
    liarGuessedKeyword: boolean = false,
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

    // 라이어가 투표로 지목되었는지
    const liarCaughtByVote = mostVotedPlayerId === liarId;

    // 최종 승자 결정
    // 라이어가 지목되었지만 키워드를 맞추면 라이어 승리
    // 라이어가 지목되지 않으면 라이어 승리
    const winner = liarCaughtByVote && !liarGuessedKeyword ? 'CIVILIAN' : 'LIAR';

    // 투표 결과 배열 생성
    const voteResults = Array.from(voteCount.entries()).map(([targetId, count]) => ({
      targetId,
      nickname: playerNicknameMap?.get(targetId) ?? `Player ${targetId}`,
      voteCount: count,
    }));

    // 점수 변경 계산
    const scoreChanges: ScoreChange[] = [];
    const allPlayerIds = playerNicknameMap ? Array.from(playerNicknameMap.keys()) : [];

    for (const userId of allPlayerIds) {
      const previousScore = playerScoreMap?.get(userId) ?? 0;
      const nickname = playerNicknameMap?.get(userId) ?? `Player ${userId}`;

      let scoreChange = 0;
      let reason: ScoreChange['reason'] = 'CIVILIAN_WIN';

      if (userId === liarId) {
        // 라이어의 점수
        if (winner === 'LIAR') {
          scoreChange = 1; // 라이어 승리 시 +1
          reason = 'LIAR_WIN';
        }
        if (liarGuessedKeyword) {
          scoreChange += 1; // 키워드 맞추면 추가 +1
          reason = 'LIAR_KEYWORD_BONUS';
        }
      } else {
        // 시민의 점수
        if (winner === 'CIVILIAN') {
          scoreChange = 1; // 시민 승리 시 각각 +1
          reason = 'CIVILIAN_WIN';
        }
      }

      if (scoreChange > 0) {
        scoreChanges.push({
          userId,
          nickname,
          previousScore,
          scoreChange,
          newScore: previousScore + scoreChange,
          reason,
        });
      }
    }

    return {
      winner,
      liarId,
      liarCaughtByVote,
      liarGuessedKeyword,
      mostVotedPlayerId: mostVotedPlayerId ?? 0,
      voteResults,
      scoreChanges,
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
