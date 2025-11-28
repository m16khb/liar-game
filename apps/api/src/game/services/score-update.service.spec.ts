import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ScoreUpdateService, ScoreUpdate } from './score-update.service';
import { UserEntity } from '../../user/entities/user.entity';

describe('ScoreUpdateService', () => {
  let service: ScoreUpdateService;
  let userRepository: Repository<UserEntity>;
  let dataSource: DataSource;
  let queryRunner: any;

  beforeEach(async () => {
    // QueryRunner 모의 객체
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        findOne: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        insert: jest.fn(),
      },
    };

    // DataSource 모의 객체
    const dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoreUpdateService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<ScoreUpdateService>(ScoreUpdateService);
    userRepository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
    dataSource = module.get<DataSource>(DataSource);
  });

  describe('bulkUpdateScores', () => {
    /**
     * AC-7.1: 시민 승리 시 점수 부여 (모든 시민 +1점)
     * When: 게임 결과가 시민 승리이면
     * Then: 모든 시민에게 1점씩 추가되어야 한다
     */
    it('should update scores for civilian win (AC-7.1)', async () => {
      const updates: ScoreUpdate[] = [
        {
          userId: 1,
          nickname: 'Player1',
          previousScore: 10,
          scoreChange: 1,
          newScore: 11,
          reason: 'CIVILIAN_WIN',
        },
        {
          userId: 2,
          nickname: 'Player2',
          previousScore: 5,
          scoreChange: 1,
          newScore: 6,
          reason: 'CIVILIAN_WIN',
        },
      ];

      const user1 = { id: 1, score: 10, nickname: 'Player1' };
      const user2 = { id: 2, score: 5, nickname: 'Player2' };

      jest
        .spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2);

      jest
        .spyOn(queryRunner.manager, 'save')
        .mockResolvedValueOnce({ ...user1, score: 11 })
        .mockResolvedValueOnce({ ...user2, score: 6 });

      const result = await service.bulkUpdateScores(updates);

      expect(result).toHaveLength(2);
      expect(result[0].score).toBe(11);
      expect(result[1].score).toBe(6);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    /**
     * AC-7.2: 라이어 승리 시 점수 부여 (+1점)
     * When: 게임 결과가 라이어 승리이면
     * Then: 라이어에게 1점을 추가해야 한다
     */
    it('should update score for liar win (AC-7.2)', async () => {
      const updates: ScoreUpdate[] = [
        {
          userId: 3,
          nickname: 'Liar',
          previousScore: 20,
          scoreChange: 1,
          newScore: 21,
          reason: 'LIAR_WIN',
        },
      ];

      const liar = { id: 3, score: 20, nickname: 'Liar' };

      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValue(liar);
      jest.spyOn(queryRunner.manager, 'save').mockResolvedValue({ ...liar, score: 21 });

      const result = await service.bulkUpdateScores(updates);

      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(21);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    /**
     * AC-7.3: 라이어 키워드 정답 시 점수 (+2점)
     * When: 라이어가 키워드를 맞추면
     * Then: 라이어에게 추가 1점(총 2점)을 부여해야 한다
     */
    it('should update score for keyword correct (AC-7.3)', async () => {
      const updates: ScoreUpdate[] = [
        {
          userId: 3,
          nickname: 'Liar',
          previousScore: 20,
          scoreChange: 2,
          newScore: 22,
          reason: 'KEYWORD_CORRECT',
        },
      ];

      const liar = { id: 3, score: 20, nickname: 'Liar' };

      jest.spyOn(queryRunner.manager, 'findOne').mockResolvedValue(liar);
      jest.spyOn(queryRunner.manager, 'save').mockResolvedValue({ ...liar, score: 22 });

      const result = await service.bulkUpdateScores(updates);

      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(22);
    });

    /**
     * AC-7.5: 트랜잭션 롤백 테스트 (데이터베이스 오류 시)
     * When: 점수 업데이트 중 오류가 발생하면
     * Then: 모든 변경 사항이 롤백되어야 한다
     */
    it('should rollback transaction on error (AC-7.5)', async () => {
      const updates: ScoreUpdate[] = [
        {
          userId: 1,
          nickname: 'Player1',
          previousScore: 10,
          scoreChange: 1,
          newScore: 11,
          reason: 'CIVILIAN_WIN',
        },
      ];

      const error = new Error('Database error');
      jest.spyOn(queryRunner.manager, 'findOne').mockRejectedValue(error);

      await expect(service.bulkUpdateScores(updates)).rejects.toThrow('Database error');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    /**
     * bulkUpdateScores 원자성 테스트
     * When: 여러 사용자의 점수가 업데이트되면
     * Then: 트랜잭션이 보장되어야 한다
     */
    it('should ensure atomicity of bulk updates', async () => {
      const updates: ScoreUpdate[] = [
        {
          userId: 1,
          nickname: 'Player1',
          previousScore: 10,
          scoreChange: 1,
          newScore: 11,
          reason: 'CIVILIAN_WIN',
        },
        {
          userId: 2,
          nickname: 'Player2',
          previousScore: 5,
          scoreChange: 1,
          newScore: 6,
          reason: 'CIVILIAN_WIN',
        },
      ];

      const user1 = { id: 1, score: 10, nickname: 'Player1' };
      const user2 = { id: 2, score: 5, nickname: 'Player2' };

      jest
        .spyOn(queryRunner.manager, 'findOne')
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2);

      jest
        .spyOn(queryRunner.manager, 'save')
        .mockResolvedValueOnce({ ...user1, score: 11 })
        .mockResolvedValueOnce({ ...user2, score: 6 });

      const result = await service.bulkUpdateScores(updates);

      // 트랜잭션 시작 확인
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      // 트랜잭션 커밋 확인
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      // 모든 업데이트 완료 확인
      expect(result).toHaveLength(2);
    });
  });

  describe('updateScore', () => {
    /**
     * 개별 점수 업데이트 테스트
     */
    it('should update single user score', async () => {
      const user = { id: 1, score: 10, nickname: 'Player1' };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as UserEntity);
      jest.spyOn(userRepository, 'save').mockResolvedValue({ ...user, score: 12 } as UserEntity);

      const result = await service.updateScore(1, 2);

      expect(result.score).toBe(12);
      expect(userRepository.save).toHaveBeenCalled();
    });

    /**
     * 사용자를 찾을 수 없을 때 에러 처리
     */
    it('should throw error when user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateScore(999, 1)).rejects.toThrow();
    });
  });

  describe('getPlayerScore', () => {
    /**
     * 플레이어 점수 조회 테스트
     */
    it('should retrieve player score', async () => {
      const user = { id: 1, score: 42, nickname: 'Player1' };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as UserEntity);

      const score = await service.getPlayerScore(1);

      expect(score).toBe(42);
    });

    /**
     * 사용자가 없을 때 0 반환
     */
    it('should return 0 when user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const score = await service.getPlayerScore(999);

      expect(score).toBe(0);
    });
  });

  describe('getTopPlayers', () => {
    /**
     * 상위 플레이어 조회 테스트
     */
    it('should retrieve top players sorted by score', async () => {
      const topPlayers = [
        { id: 1, score: 100, nickname: 'TopPlayer1' },
        { id: 2, score: 90, nickname: 'TopPlayer2' },
        { id: 3, score: 80, nickname: 'TopPlayer3' },
      ];

      // createQueryBuilder 메서드를 직접 추가
      Object.defineProperty(userRepository, 'createQueryBuilder', {
        value: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(topPlayers),
        }),
      });

      const result = await service.getTopPlayers(10);

      expect(result).toHaveLength(3);
      expect(result[0].score).toBe(100);
      expect(result[1].score).toBe(90);
    });

    /**
     * 상위 플레이어 제한 (기본값: 10)
     */
    it('should limit top players by default to 10', async () => {
      const mockQueryBuilder = {
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      Object.defineProperty(userRepository, 'createQueryBuilder', {
        value: jest.fn().mockReturnValue(mockQueryBuilder),
      });

      await service.getTopPlayers();

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
    });
  });
});
