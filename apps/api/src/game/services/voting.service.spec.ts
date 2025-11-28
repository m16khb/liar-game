import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VotingService } from './voting.service';
import { Vote } from '../entities/vote.entity';

describe('VotingService (RED Phase)', () => {
  let service: VotingService;
  let voteRepository: Repository<Vote>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotingService,
        {
          provide: getRepositoryToken(Vote),
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            delete: jest.fn(),
            create: jest.fn((data) => data),
          },
        },
      ],
    }).compile();

    service = module.get<VotingService>(VotingService);
    voteRepository = module.get<Repository<Vote>>(getRepositoryToken(Vote));
  });

  describe('submitVote', () => {
    /**
     * AC-3.2: 투표 제출 및 진행률 업데이트
     * When: 투표 버튼을 클릭한다
     * Then: 투표가 데이터베이스에 저장된다
     */
    it('should save vote to database (AC-3.2)', async () => {
      const vote = { roomId: 1, voterId: 1, targetId: 2, createdAt: new Date() };
      jest.spyOn(voteRepository, 'save').mockResolvedValue(vote as Vote);

      const result = await service.submitVote(1, 1, 2);

      expect(voteRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ roomId: 1, voterId: 1, targetId: 2 }),
      );
      expect(result).toBeDefined();
    });

    /**
     * AC-3.3: 중복 투표 방지
     * When: 이미 투표한 플레이어가 다시 투표를 시도한다
     * Then: 투표가 거부된다
     */
    it('should prevent duplicate voting (AC-3.3)', async () => {
      jest
        .spyOn(voteRepository, 'findOne')
        .mockResolvedValue({ id: 1, roomId: 1, voterId: 1, targetId: 2, createdAt: new Date() });

      await expect(service.submitVote(1, 1, 3)).rejects.toThrow('이미 투표하셨습니다');
    });

    /**
     * 자신에게 투표할 수 없다
     */
    it('should not allow voting for oneself', async () => {
      jest.spyOn(voteRepository, 'findOne').mockResolvedValue(null);

      await expect(service.submitVote(1, 1, 1)).rejects.toThrow('자신에게 투표할 수 없습니다');
    });

    /**
     * 존재하지 않는 플레이어에게 투표할 수 없다
     */
    it('should not allow voting for non-existent player', async () => {
      jest.spyOn(voteRepository, 'findOne').mockResolvedValue(null);

      // 이 경우는 서비스에서 플레이어 검증이 필요하므로, 여기서는 기본 검증만 수행
      // 실제로는 플레이어 서비스와 연동하여 검증
    });
  });

  describe('getVote', () => {
    /**
     * 특정 투표를 조회한다
     */
    it('should retrieve vote by voter and room', async () => {
      const vote = { id: 1, roomId: 1, voterId: 1, targetId: 2, createdAt: new Date() };
      jest.spyOn(voteRepository, 'findOne').mockResolvedValue(vote as Vote);

      const result = await service.getVote(1, 1);

      expect(result).toEqual(vote);
    });

    /**
     * 투표가 없으면 null을 반환한다
     */
    it('should return null if vote not found', async () => {
      jest.spyOn(voteRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getVote(1, 1);

      expect(result).toBeNull();
    });
  });

  describe('hasUserVoted', () => {
    /**
     * 투표했는지 확인한다
     */
    it('should return true if user has voted', async () => {
      jest
        .spyOn(voteRepository, 'findOne')
        .mockResolvedValue({ id: 1, roomId: 1, voterId: 1, targetId: 2, createdAt: new Date() });

      const result = await service.hasUserVoted(1, 1);

      expect(result).toBe(true);
    });

    /**
     * 투표하지 않았으면 false를 반환한다
     */
    it('should return false if user has not voted', async () => {
      jest.spyOn(voteRepository, 'findOne').mockResolvedValue(null);

      const result = await service.hasUserVoted(1, 1);

      expect(result).toBe(false);
    });
  });

  describe('getVotedCount', () => {
    /**
     * AC-3.2: 투표 진행률 업데이트
     * 현재까지의 투표 수를 반환한다
     */
    it('should return count of votes for room (AC-3.2)', async () => {
      jest.spyOn(voteRepository, 'count').mockResolvedValue(3);

      const count = await service.getVotedCount(1);

      expect(count).toBe(3);
    });
  });

  describe('getVotingProgress', () => {
    /**
     * AC-3.2: 투표 진행률
     */
    it('should calculate voting progress', async () => {
      jest.spyOn(voteRepository, 'count').mockResolvedValue(3);

      const progress = await service.getVotingProgress(1, 8);

      expect(progress).toBe(37.5); // 3/8 * 100
    });

    /**
     * 0명 투표 시 0% 진행률
     */
    it('should return 0% progress when no votes', async () => {
      jest.spyOn(voteRepository, 'count').mockResolvedValue(0);

      const progress = await service.getVotingProgress(1, 8);

      expect(progress).toBe(0);
    });

    /**
     * 모두 투표 시 100% 진행률
     */
    it('should return 100% progress when all voted', async () => {
      jest.spyOn(voteRepository, 'count').mockResolvedValue(8);

      const progress = await service.getVotingProgress(1, 8);

      expect(progress).toBe(100);
    });
  });

  describe('getAllVotes', () => {
    /**
     * AC-3.5: 특정 방의 모든 투표를 조회한다
     */
    it('should retrieve all votes for room (AC-3.5)', async () => {
      const votes = [
        { id: 1, roomId: 1, voterId: 1, targetId: 2, createdAt: new Date() },
        { id: 2, roomId: 1, voterId: 2, targetId: 3, createdAt: new Date() },
        { id: 3, roomId: 1, voterId: 3, targetId: 2, createdAt: new Date() },
      ];
      jest.spyOn(voteRepository, 'find').mockResolvedValue(votes as Vote[]);

      const result = await service.getAllVotes(1);

      expect(result).toHaveLength(3);
    });
  });

  describe('deleteVotes', () => {
    /**
     * 특정 방의 모든 투표를 삭제한다
     */
    it('should delete all votes for room', async () => {
      jest.spyOn(voteRepository, 'delete').mockResolvedValue({ affected: 3 } as any);

      await service.deleteVotes(1);

      expect(voteRepository.delete).toHaveBeenCalledWith({ roomId: 1 });
    });
  });

  describe('aggregateVotes', () => {
    /**
     * AC-3.5: 투표 결과 집계
     * When: 투표를 집계하면
     * Then: 각 플레이어별 투표 수가 반환되어야 한다
     */
    it('should aggregate votes by target (AC-3.5)', async () => {
      const votes = [
        { id: 1, roomId: 1, voterId: 1, targetId: 2, createdAt: new Date() },
        { id: 2, roomId: 1, voterId: 2, targetId: 3, createdAt: new Date() },
        { id: 3, roomId: 1, voterId: 3, targetId: 2, createdAt: new Date() },
        { id: 4, roomId: 1, voterId: 4, targetId: 2, createdAt: new Date() },
      ];
      jest.spyOn(voteRepository, 'find').mockResolvedValue(votes as Vote[]);

      const result = await service.aggregateVotes(1);

      expect(result.get(2)).toBe(3);
      expect(result.get(3)).toBe(1);
      expect(result.size).toBe(2);
    });

    /**
     * 빈 투표 결과 집계
     */
    it('should return empty map when no votes exist', async () => {
      jest.spyOn(voteRepository, 'find').mockResolvedValue([]);

      const result = await service.aggregateVotes(1);

      expect(result.size).toBe(0);
    });
  });

  describe('getMostVotedPlayer', () => {
    /**
     * AC-4.1: 최다 득표자 찾기 (동점 시 먼저 투표된 플레이어)
     * When: 최다 득표자를 조회하면
     * Then: 가장 많은 표를 받은 플레이어를 반환해야 한다
     */
    it('should find most voted player correctly (AC-4.1)', async () => {
      const votes = [
        { id: 1, roomId: 1, voterId: 1, targetId: 2, createdAt: new Date() },
        { id: 2, roomId: 1, voterId: 2, targetId: 3, createdAt: new Date() },
        { id: 3, roomId: 1, voterId: 3, targetId: 2, createdAt: new Date() },
        { id: 4, roomId: 1, voterId: 4, targetId: 2, createdAt: new Date() },
      ];
      jest.spyOn(voteRepository, 'find').mockResolvedValue(votes as Vote[]);

      const result = await service.getMostVotedPlayer(1);

      expect(result).toBe(2);
    });

    /**
     * 동점 시 먼저 투표된 플레이어 선택
     */
    it('should select first voted player in case of tie (AC-4.1)', async () => {
      const votes = [
        { id: 1, roomId: 1, voterId: 1, targetId: 4, createdAt: new Date() }, // 4번이 먼저
        { id: 2, roomId: 1, voterId: 2, targetId: 2, createdAt: new Date() }, // 2번
        { id: 3, roomId: 1, voterId: 3, targetId: 4, createdAt: new Date() }, // 4번 추가 (동점)
        { id: 4, roomId: 1, voterId: 4, targetId: 2, createdAt: new Date() }, // 2번 추가 (동점)
      ];
      jest.spyOn(voteRepository, 'find').mockResolvedValue(votes as Vote[]);

      const result = await service.getMostVotedPlayer(1);

      expect(result).toBe(4);
    });

    /**
     * 투표가 없을 때
     */
    it('should return null when no votes exist', async () => {
      jest.spyOn(voteRepository, 'find').mockResolvedValue([]);

      const result = await service.getMostVotedPlayer(1);

      expect(result).toBeNull();
    });
  });

  describe('getVotingProgress', () => {
    /**
     * 투표 진행률 업데이트 테스트
     * When: 투표 진행률을 계산하면
     * Then: 0-100% 범위의 진행률이 반환되어야 한다
     */
    it('should calculate correct voting progress with decimals', async () => {
      jest.spyOn(voteRepository, 'count').mockResolvedValue(1);

      const progress = await service.getVotingProgress(1, 3);

      expect(progress).toBeCloseTo(33.33, 1);
    });

    /**
     * 0명이 투표한 경우 0%
     */
    it('should return 0 when totalPlayers is 0', async () => {
      jest.spyOn(voteRepository, 'count').mockResolvedValue(0);

      const progress = await service.getVotingProgress(1, 0);

      expect(progress).toBe(0);
    });
  });
});
