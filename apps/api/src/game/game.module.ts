import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Keyword } from './entities/keyword.entity';
import { Speech } from './entities/speech.entity';
import { Vote } from './entities/vote.entity';
import { RoleAssignmentService } from './services/role-assignment.service';
import { KeywordSelectionService } from './services/keyword-selection.service';
import { TurnManagerService } from './services/turn-manager.service';
import { VotingService } from './services/voting.service';
import { ResultCalculatorService } from './services/result-calculator.service';
import { ScoreUpdateService } from './services/score-update.service';
import { KeywordGuessService } from './services/keyword-guess.service';
import { GameCacheService } from './services/game-cache.service';
import { GameTimerService } from './services/game-timer.service';
import { UserEntity } from '../user/entities/user.entity';

/**
 * 게임 모듈
 * 게임의 핵심 로직을 제공합니다.
 * - 역할 배정
 * - 키워드 선택
 * - 턴 관리
 * - 투표 처리
 * - 결과 계산
 * - 점수 업데이트
 * - 라이어 키워드 추측
 * - Redis 캐싱
 */
@Module({
  imports: [TypeOrmModule.forFeature([Keyword, Speech, Vote, UserEntity])],
  providers: [
    RoleAssignmentService,
    KeywordSelectionService,
    TurnManagerService,
    VotingService,
    ResultCalculatorService,
    ScoreUpdateService,
    KeywordGuessService,
    GameCacheService,
    GameTimerService,
  ],
  exports: [
    RoleAssignmentService,
    KeywordSelectionService,
    TurnManagerService,
    VotingService,
    ResultCalculatorService,
    ScoreUpdateService,
    KeywordGuessService,
    GameCacheService,
    GameTimerService,
  ],
})
export class GameModule {}
