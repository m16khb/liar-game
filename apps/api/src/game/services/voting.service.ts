import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vote } from '../entities/vote.entity';

/**
 * 투표 서비스
 * 게임 투표 단계에서 플레이어들의 투표를 관리합니다.
 * 중복 투표 방지, 투표 진행률 조회 등의 기능을 제공합니다.
 */
@Injectable()
export class VotingService {
  constructor(
    @InjectRepository(Vote)
    private voteRepository: Repository<Vote>,
  ) {}

  /**
   * 투표를 제출합니다
   * @param roomId 방 ID
   * @param voterId 투표한 플레이어 ID
   * @param targetId 투표 대상 플레이어 ID
   * @returns 저장된 투표
   */
  async submitVote(roomId: number, voterId: number, targetId: number): Promise<Vote> {
    // 중복 투표 확인
    const existingVote = await this.voteRepository.findOne({
      where: { roomId, voterId },
    });

    if (existingVote) {
      throw new BadRequestException('이미 투표하셨습니다');
    }

    // 자신에게 투표 방지
    if (voterId === targetId) {
      throw new BadRequestException('자신에게 투표할 수 없습니다');
    }

    // 투표 저장
    const vote = this.voteRepository.create({
      roomId,
      voterId,
      targetId,
    });

    return this.voteRepository.save(vote);
  }

  /**
   * 특정 투표를 조회합니다
   * @param roomId 방 ID
   * @param voterId 투표한 플레이어 ID
   * @returns 투표 정보 또는 null
   */
  async getVote(roomId: number, voterId: number): Promise<Vote | null> {
    const vote = await this.voteRepository.findOne({
      where: { roomId, voterId },
    });
    return vote ?? null;
  }

  /**
   * 특정 사용자가 투표했는지 확인합니다
   * @param roomId 방 ID
   * @param voterId 투표한 플레이어 ID
   * @returns 투표 여부
   */
  async hasUserVoted(roomId: number, voterId: number): Promise<boolean> {
    const vote = await this.voteRepository.findOne({
      where: { roomId, voterId },
    });
    return vote !== null && vote !== undefined;
  }

  /**
   * 특정 방에서 투표한 플레이어 수를 반환합니다
   * @param roomId 방 ID
   * @returns 투표 수
   */
  async getVotedCount(roomId: number): Promise<number> {
    return this.voteRepository.count({
      where: { roomId },
    });
  }

  /**
   * 투표 진행률을 계산합니다
   * @param roomId 방 ID
   * @param totalPlayers 전체 플레이어 수
   * @returns 진행률 (0-100)
   */
  async getVotingProgress(roomId: number, totalPlayers: number): Promise<number> {
    const votedCount = await this.getVotedCount(roomId);
    if (totalPlayers === 0) return 0;
    return (votedCount / totalPlayers) * 100;
  }

  /**
   * 특정 방의 모든 투표를 조회합니다
   * @param roomId 방 ID
   * @returns 투표 배열
   */
  async getAllVotes(roomId: number): Promise<Vote[]> {
    return this.voteRepository.find({
      where: { roomId },
    });
  }

  /**
   * 특정 방의 모든 투표를 삭제합니다
   * @param roomId 방 ID
   */
  async deleteVotes(roomId: number): Promise<void> {
    await this.voteRepository.delete({ roomId });
  }

  /**
   * 투표 결과를 집계합니다
   * @param roomId 방 ID
   * @returns 투표 결과 (targetId -> voteCount)
   */
  async aggregateVotes(roomId: number): Promise<Map<number, number>> {
    const votes = await this.getAllVotes(roomId);
    const result = new Map<number, number>();

    votes.forEach((vote) => {
      const currentCount = result.get(vote.targetId) ?? 0;
      result.set(vote.targetId, currentCount + 1);
    });

    return result;
  }

  /**
   * 최다 득표자를 찾습니다
   * @param roomId 방 ID
   * @returns 최다 득표자 ID 또는 null
   */
  async getMostVotedPlayer(roomId: number): Promise<number | null> {
    const votes = await this.getAllVotes(roomId);

    if (votes.length === 0) {
      return null;
    }

    const aggregated = new Map<number, number>();
    votes.forEach((vote) => {
      const currentCount = aggregated.get(vote.targetId) ?? 0;
      aggregated.set(vote.targetId, currentCount + 1);
    });

    // 최다 득표자 찾기 (동점 시 먼저 투표된 플레이어)
    let mostVotedId: number | null = null;
    let maxVotes = 0;

    for (const [targetId, voteCount] of aggregated) {
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        mostVotedId = targetId;
      }
    }

    return mostVotedId;
  }
}
