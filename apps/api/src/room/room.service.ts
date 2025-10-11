// @CODE:ROOM-001:DOMAIN | SPEC: .moai/specs/SPEC-ROOM-001/spec.md | TEST: test/room/room.service.test.ts
// @CODE:ROOM-001:DOMAIN: 방 생성, 조회, 입장, 퇴장 비즈니스 로직

import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { generateRoomCode } from './room-code.generator';
import {
  Room,
  RoomSettings,
  CreateRoomResponse,
  JoinRoomInput,
  Player,
} from './room.types';

@Injectable()
export class RoomService {
  private readonly ROOM_TTL = 86400; // 24시간 (초)
  private readonly BASE_URL =
    process.env.BASE_URL || 'https://liar-game.com';

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  /**
   * 방 생성
   * - UUID v4 코드 생성
   * - Redis에 방 메타데이터 저장 (24시간 TTL)
   * - 방장을 첫 번째 플레이어로 추가
   */
  async createRoom(
    hostId: string,
    settings: RoomSettings,
  ): Promise<CreateRoomResponse> {
    const code = generateRoomCode();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + this.ROOM_TTL * 1000).toISOString();

    // 방장을 첫 번째 플레이어로 추가
    const hostPlayer: Player = {
      id: hostId,
      username: '방장', // 실제로는 유저 정보에서 가져와야 함
      isReady: true,
      isHost: true,
    };

    const room: Room = {
      code,
      hostId,
      players: [hostPlayer],
      settings,
      status: 'waiting',
      createdAt: now,
      expiresAt,
    };

    // Redis에 저장 (24시간 TTL)
    await this.redis.setex(
      `room:${code}`,
      this.ROOM_TTL,
      JSON.stringify(room),
    );

    // 공개 방이면 공개 방 목록에 추가
    if (settings.isPublic) {
      await this.redis.lpush('room:lobby:public', code);
    }

    const url = `${this.BASE_URL}/room/${code}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}`;

    return {
      code,
      url,
      qrUrl,
    };
  }

  /**
   * 방 조회
   * - Redis에서 방 메타데이터 조회
   * - 존재하지 않으면 null 반환
   */
  async getRoom(code: string): Promise<Room | null> {
    const roomData = await this.redis.get(`room:${code}`);
    if (!roomData) {
      return null;
    }

    return JSON.parse(roomData) as Room;
  }

  /**
   * 방 업데이트 (내부 헬퍼 메서드)
   * - Redis에 방 메타데이터 저장 (TTL 유지)
   */
  private async updateRoom(room: Room): Promise<void> {
    await this.redis.setex(
      `room:${room.code}`,
      this.ROOM_TTL,
      JSON.stringify(room),
    );
  }

  /**
   * 방 입장
   * - 방 존재 여부 확인
   * - 최대 인원 체크
   * - 중복 입장 체크
   * - 플레이어 목록에 추가
   */
  async joinRoom(code: string, playerInfo: JoinRoomInput): Promise<void> {
    const room = await this.getRoom(code);
    if (!room) {
      throw new BadRequestException('존재하지 않는 방입니다');
    }

    // 최대 인원 체크
    if (room.players.length >= room.settings.maxPlayers) {
      throw new BadRequestException('방 인원이 가득 찼습니다');
    }

    // 중복 입장 체크
    const existingPlayer = room.players.find((p) => p.id === playerInfo.id);
    if (existingPlayer) {
      throw new BadRequestException('이미 방에 참여 중입니다');
    }

    // 비밀번호 체크 (선택적)
    if (room.settings.password && playerInfo.password !== room.settings.password) {
      throw new BadRequestException('비밀번호가 일치하지 않습니다');
    }

    // 플레이어 추가
    const newPlayer: Player = {
      id: playerInfo.id,
      username: playerInfo.username,
      isReady: false,
      isHost: false,
    };

    room.players.push(newPlayer);

    // Redis 업데이트
    await this.updateRoom(room);
  }

  /**
   * 방 퇴장
   * - 플레이어 목록에서 제거
   * - 마지막 플레이어면 방 삭제
   */
  async leaveRoom(code: string, playerId: string): Promise<void> {
    const room = await this.getRoom(code);
    if (!room) {
      throw new BadRequestException('존재하지 않는 방입니다');
    }

    // 플레이어 제거
    room.players = room.players.filter((p) => p.id !== playerId);

    // 마지막 플레이어면 방 삭제
    if (room.players.length === 0) {
      await this.deleteRoom(code);
      return;
    }

    // Redis 업데이트
    await this.updateRoom(room);
  }

  /**
   * 방 삭제 (내부 헬퍼 메서드)
   * - Redis에서 방 삭제
   * - 공개 방 목록에서도 제거
   */
  private async deleteRoom(code: string): Promise<void> {
    await this.redis.del(`room:${code}`);
    await this.redis.lrem('room:lobby:public', 0, code);
  }
}
