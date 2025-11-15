import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { PlayerEntity, PlayerStatus } from './entities/player.entity';

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepository: Repository<PlayerEntity>,
  ) {}

  /**
   * 방에 플레이어 추가
   */
  async addPlayer(roomId: number, userId: number, isHost: boolean = false): Promise<PlayerEntity> {
    // 로그 추가
    console.log(`[PlayerService.addPlayer] roomId: ${roomId}, userId: ${userId}, isHost: ${isHost}`);

    // 이미 참여 중인지 확인 (softDelete된 플레이어도 포함)
    const existingPlayer = await this.playerRepository.findOne({
      where: { roomId, userId },
      withDeleted: true, // softDelete된 레코드도 조회
    });

    console.log(`[PlayerService.addPlayer] existingPlayer:`, existingPlayer ? {
      id: existingPlayer.id,
      userId: existingPlayer.userId,
      isHost: existingPlayer.isHost,
      deletedAt: existingPlayer.deletedAt
    } : null);

    if (existingPlayer) {
      if (existingPlayer.deletedAt) {
        // softDelete된 경우 복원
        console.log(`[PlayerService.addPlayer] 복원 처리 - 기존 isHost: ${existingPlayer.isHost}, 새 isHost: ${isHost}`);
        existingPlayer.deletedAt = null;
        existingPlayer.isHost = isHost;
        existingPlayer.status = isHost ? PlayerStatus.READY : PlayerStatus.NOT_READY;
        existingPlayer.lastActiveAt = new Date();
        return await this.playerRepository.save(existingPlayer);
      } else {
        throw new ConflictException('이미 방에 참여 중입니다.');
      }
    }

    // 참가 순서 조회
    const maxJoinOrder = await this.playerRepository
      .createQueryBuilder('player')
      .select('MAX(player.joinOrder)', 'max')
      .where('player.roomId = :roomId', { roomId })
      .getRawOne();

    const joinOrder = (maxJoinOrder?.max || 0) + 1;

    const roomPlayer = this.playerRepository.create({
      roomId,
      userId,
      isHost,
      status: isHost ? PlayerStatus.READY : PlayerStatus.NOT_READY,
      joinOrder,
      lastActiveAt: new Date(),
    });

    console.log(`[PlayerService.addPlayer] 새 플레이어 생성:`, {
      roomId,
      userId,
      isHost,
      status: isHost ? PlayerStatus.READY : PlayerStatus.NOT_READY,
      joinOrder
    });

    const savedPlayer = await this.playerRepository.save(roomPlayer);
    console.log(`[PlayerService.addPlayer] 저장된 플레이어:`, {
      id: savedPlayer.id,
      userId: savedPlayer.userId,
      isHost: savedPlayer.isHost,
      status: savedPlayer.status
    });

    return savedPlayer;
  }

  /**
   * 방에서 플레이어 제거
   */
  async removePlayer(roomId: number, userId: number): Promise<void> {
    const player = await this.findPlayer(roomId, userId);
    if (!player) {
      return;
    }

    await this.playerRepository.softDelete(player.id);
  }

  /**
   * 플레이어 조회
   */
  async findPlayer(roomId: number, userId: number): Promise<PlayerEntity | null> {
    return await this.playerRepository.findOne({
      where: { roomId, userId, deletedAt: IsNull() },
      relations: ['room', 'user'],
    });
  }

  /**
   * 활성 방 참여자 조회 (현재 참여 중인 방)
   */
  async findActivePlayer(userId: number): Promise<PlayerEntity | null> {
    return await this.playerRepository.findOne({
      where: { userId, deletedAt: IsNull() },
      relations: ['room', 'user'],
    });
  }

  /**
   * 방의 모든 플레이어 조회
   */
  async getPlayers(roomId: number): Promise<PlayerEntity[]> {
    return await this.playerRepository.find({
      where: { roomId, deletedAt: IsNull() },
      relations: ['user'],
      order: {
        joinOrder: 'ASC',
      },
    });
  }

  /**
   * 플레이어 상태 업데이트
   */
  async updatePlayerStatus(roomId: number, userId: number, status: PlayerStatus): Promise<PlayerEntity> {
    const player = await this.findPlayer(roomId, userId);
    if (!player) {
      throw new NotFoundException('플레이어를 찾을 수 없습니다.');
    }

    player.status = status;
    player.lastActiveAt = new Date();

    return await this.playerRepository.save(player);
  }

  /**
   * 모든 플레이어 상태 업데이트
   */
  async updateAllPlayersStatus(roomId: number, status: PlayerStatus): Promise<void> {
    await this.playerRepository
      .createQueryBuilder()
      .update(PlayerEntity)
      .set({
        status,
        lastActiveAt: new Date(),
      })
      .where('roomId = :roomId', { roomId })
      .execute();
  }

  /**
   * 방장 권한 위임
   */
  async updateHost(roomId: number, newHostUserId: number): Promise<void> {
    // 기존 방장 권한 해제
    await this.playerRepository
      .createQueryBuilder()
      .update(PlayerEntity)
      .set({ isHost: false })
      .where('roomId = :roomId', { roomId })
      .andWhere('isHost = :isHost', { isHost: true })
      .execute();

    // 새로운 방장 지정
    await this.playerRepository
      .createQueryBuilder()
      .update(PlayerEntity)
      .set({ isHost: true })
      .where('roomId = :roomId', { roomId })
      .andWhere('userId = :userId', { userId: newHostUserId })
      .execute();
  }

  /**
   * 플레이어 수 조회
   */
  async getPlayerCount(roomId: number): Promise<number> {
    return await this.playerRepository.count({
      where: { roomId },
    });
  }

  /**
   * 준비된 플레이어 수 조회 (방장 제외)
   */
  async getReadyPlayerCount(roomId: number): Promise<number> {
    return await this.playerRepository.count({
      where: {
        roomId,
        status: PlayerStatus.READY,
        isHost: false,
      },
    });
  }

  /**
   * 플레이어 마지막 활동 시간 업데이트
   */
  async updateLastActive(roomId: number, userId: number): Promise<void> {
    await this.playerRepository
      .createQueryBuilder()
      .update(PlayerEntity)
      .set({ lastActiveAt: new Date() })
      .where('roomId = :roomId', { roomId })
      .andWhere('userId = :userId', { userId: userId })
      .execute();
  }

  /**
   * 비활성 플레이어 정리 (일정 시간 동안 활동 없는 플레이어)
   */
  async cleanupInactivePlayers(timeoutMinutes: number = 10): Promise<void> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - timeoutMinutes);

    await this.playerRepository
      .createQueryBuilder()
      .delete()
      .where('lastActiveAt < :cutoffTime', { cutoffTime })
      .execute();
  }
}
