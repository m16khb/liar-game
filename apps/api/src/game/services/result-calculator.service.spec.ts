import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultCalculatorService, GameResult } from './result-calculator.service';
import { Vote } from '../entities/vote.entity';

describe('ResultCalculatorService', () => {
  let service: ResultCalculatorService;
  let voteRepository: Repository<Vote>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultCalculatorService,
        {
          provide: getRepositoryToken(Vote),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ResultCalculatorService>(ResultCalculatorService);
    voteRepository = module.get<Repository<Vote>>(getRepositoryToken(Vote));
  });

  describe('calculateResult', () => {
    /**
     * AC-4.1: 최다 득표자 계산 (동점 처리 포함)
     * When: 모든 플레이어의 투표가 완료되면
     * Then: 최다 득표자가 정확히 계산되어야 한다
     */
    it('should calculate most voted player correctly (AC-4.1)', async () => {
      const roomId = 1;
      const liarId = 3;
      const votes = [
        { id: 1, roomId, voterId: 1, targetId: 2, createdAt: new Date() },
        { id: 2, roomId, voterId: 2, targetId: 3, createdAt: new Date() },
        { id: 3, roomId, voterId: 3, targetId: 3, createdAt: new Date() }, // 3번이 2표
        { id: 4, roomId, voterId: 4, targetId: 2, createdAt: new Date() }, // 2번이 2표
      ];

      jest.spyOn(voteRepository, 'find').mockResolvedValue(votes as Vote[]);

      const result = await service.calculateResult(roomId, liarId);

      // 동점일 경우 먼저 투표된 플레이어 선택
      expect(result.mostVotedPlayerId).toBe(2);
    });

    /**
     * AC-4.1: 동점 시 먼저 투표된 플레이어 선택
     * When: 여러 플레이어가 같은 수의 투표를 받으면
     * Then: 먼저 투표된 플레이어가 선택되어야 한다
     */
    it('should select first voted player in case of tie (AC-4.1)', async () => {
      const roomId = 1;
      const liarId = 3;
      const votes = [
        { id: 1, roomId, voterId: 1, targetId: 4, createdAt: new Date() }, // 4번이 먼저 투표됨
        { id: 2, roomId, voterId: 2, targetId: 2, createdAt: new Date() }, // 2번 투표됨
        { id: 3, roomId, voterId: 3, targetId: 4, createdAt: new Date() }, // 4번 추가 (동점)
        { id: 4, roomId, voterId: 4, targetId: 2, createdAt: new Date() }, // 2번 추가 (동점)
      ];

      jest.spyOn(voteRepository, 'find').mockResolvedValue(votes as Vote[]);

      const result = await service.calculateResult(roomId, liarId);

      // 4번이 2번보다 먼저 투표되었으므로 4번이 선택됨
      expect(result.mostVotedPlayerId).toBe(4);
    });

    /**
     * AC-4.2: 시민 승리 조건 (최다 득표자 === 라이어)
     * When: 최다 득표자가 라이어와 같으면
     * Then: 승자는 CIVILIAN이어야 한다
     */
    it('should determine CIVILIAN win when most voted is liar (AC-4.2)', async () => {
      const roomId = 1;
      const liarId = 3;
      const votes = [
        { id: 1, roomId, voterId: 1, targetId: 3, createdAt: new Date() }, // 라이어 투표
        { id: 2, roomId, voterId: 2, targetId: 3, createdAt: new Date() }, // 라이어 투표
        { id: 3, roomId, voterId: 3, targetId: 1, createdAt: new Date() },
      ];

      jest.spyOn(voteRepository, 'find').mockResolvedValue(votes as Vote[]);

      const result = await service.calculateResult(roomId, liarId);

      expect(result.winner).toBe('CIVILIAN');
      expect(result.mostVotedPlayerId).toBe(3);
    });

    /**
     * AC-4.3: 라이어 승리 조건 (최다 득표자 !== 라이어)
     * When: 최다 득표자가 라이어가 아니면
     * Then: 승자는 LIAR이어야 한다
     */
    it('should determine LIAR win when most voted is not liar (AC-4.3)', async () => {
      const roomId = 1;
      const liarId = 3;
      const votes = [
        { id: 1, roomId, voterId: 1, targetId: 2, createdAt: new Date() }, // 2번 투표
        { id: 2, roomId, voterId: 2, targetId: 2, createdAt: new Date() }, // 2번 투표
        { id: 3, roomId, voterId: 3, targetId: 1, createdAt: new Date() },
      ];

      jest.spyOn(voteRepository, 'find').mockResolvedValue(votes as Vote[]);

      const result = await service.calculateResult(roomId, liarId);

      expect(result.winner).toBe('LIAR');
      expect(result.mostVotedPlayerId).toBe(2);
    });

    /**
     * getVoteStatistics 테스트
     * When: 특정 방의 투표 통계를 요청하면
     * Then: 플레이어별 투표 수를 반환해야 한다
     */
    it('should return vote statistics correctly', async () => {
      const roomId = 1;
      const votes = [
        { id: 1, roomId, voterId: 1, targetId: 2, createdAt: new Date() },
        { id: 2, roomId, voterId: 2, targetId: 3, createdAt: new Date() },
        { id: 3, roomId, voterId: 3, targetId: 2, createdAt: new Date() },
        { id: 4, roomId, voterId: 4, targetId: 2, createdAt: new Date() },
      ];

      jest.spyOn(voteRepository, 'find').mockResolvedValue(votes as Vote[]);

      const stats = await service.getVoteStatistics(roomId);

      expect(stats.get(2)).toBe(3); // 2번이 3표
      expect(stats.get(3)).toBe(1); // 3번이 1표
    });

    /**
     * findMostVotedPlayer 테스트 (동점 시 먼저 투표된 플레이어)
     * When: 투표 데이터에서 최다 득표자를 찾으면
     * Then: 동점 시에도 먼저 투표된 플레이어를 반환해야 한다
     */
    it('should return correct result with player nicknames', async () => {
      const roomId = 1;
      const liarId = 2;
      const votes = [
        { id: 1, roomId, voterId: 1, targetId: 2, createdAt: new Date() },
        { id: 2, roomId, voterId: 2, targetId: 3, createdAt: new Date() },
      ];

      const nicknameMap = new Map([
        [2, 'Liar'],
        [3, 'Civilian'],
      ]);

      jest.spyOn(voteRepository, 'find').mockResolvedValue(votes as Vote[]);

      const result = await service.calculateResult(roomId, liarId, nicknameMap);

      expect(result.voteResults).toContainEqual(
        expect.objectContaining({
          targetId: 2,
          nickname: 'Liar',
          voteCount: 1,
        }),
      );
      expect(result.voteResults).toContainEqual(
        expect.objectContaining({
          targetId: 3,
          nickname: 'Civilian',
          voteCount: 1,
        }),
      );
    });

    /**
     * 빈 투표 결과 처리 테스트
     * When: 투표가 없으면
     * Then: 최다 득표자는 0이어야 한다
     */
    it('should handle empty votes correctly', async () => {
      const roomId = 1;
      const liarId = 1;
      const votes: Vote[] = [];

      jest.spyOn(voteRepository, 'find').mockResolvedValue(votes);

      const result = await service.calculateResult(roomId, liarId);

      expect(result.mostVotedPlayerId).toBe(0);
      expect(result.voteResults).toHaveLength(0);
    });
  });

  describe('getVoteStatistics', () => {
    /**
     * 투표 통계 조회 - 여러 투표
     */
    it('should correctly aggregate votes by target', async () => {
      const roomId = 1;
      const votes = [
        { id: 1, roomId, voterId: 1, targetId: 1, createdAt: new Date() },
        { id: 2, roomId, voterId: 2, targetId: 1, createdAt: new Date() },
        { id: 3, roomId, voterId: 3, targetId: 2, createdAt: new Date() },
        { id: 4, roomId, voterId: 4, targetId: 3, createdAt: new Date() },
        { id: 5, roomId, voterId: 5, targetId: 3, createdAt: new Date() },
      ];

      jest.spyOn(voteRepository, 'find').mockResolvedValue(votes as Vote[]);

      const stats = await service.getVoteStatistics(roomId);

      expect(stats.size).toBe(3);
      expect(stats.get(1)).toBe(2);
      expect(stats.get(2)).toBe(1);
      expect(stats.get(3)).toBe(2);
    });

    /**
     * 투표 통계 - 빈 결과
     */
    it('should return empty map when no votes exist', async () => {
      const roomId = 1;

      jest.spyOn(voteRepository, 'find').mockResolvedValue([]);

      const stats = await service.getVoteStatistics(roomId);

      expect(stats.size).toBe(0);
    });
  });
});
