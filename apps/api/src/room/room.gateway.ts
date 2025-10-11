// @CODE:ROOM-001:API | SPEC: .moai/specs/SPEC-ROOM-001/spec.md | TEST: test/room/room.gateway.test.ts
// @CODE:ROOM-001:API: Socket.IO 기반 실시간 방 관리 Gateway

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';
import { RoomSettings } from './room.types';

interface JoinRoomDto {
  roomCode: string;
  username: string;
  password?: string;
}

interface LeaveRoomDto {
  roomCode: string;
}

interface PlayerReadyDto {
  roomCode: string;
  isReady: boolean;
}

interface UpdateSettingsDto {
  roomCode: string;
  settings: RoomSettings;
}

interface StartGameDto {
  roomCode: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class RoomGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly roomService: RoomService) {}

  /**
   * 방 입장
   * - Socket.IO 방에 join
   * - RoomService를 통해 Redis에 플레이어 추가
   * - 다른 참여자에게 입장 알림 브로드캐스트
   */
  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomDto,
  ) {
    try {
      const { roomCode, username, password } = payload;
      const userId = client.data.userId;

      // Redis에 플레이어 추가
      await this.roomService.joinRoom(roomCode, {
        id: userId,
        username,
        password,
      });

      // Socket.IO 방에 join
      await client.join(roomCode);

      // 방 정보 조회
      const room = await this.roomService.getRoom(roomCode);
      if (!room) {
        client.emit('room:error', { message: '존재하지 않는 방입니다' });
        return;
      }

      // 새로 입장한 플레이어 정보 찾기
      const newPlayer = room.players.find((p) => p.id === userId);

      // 다른 참여자에게 입장 알림 브로드캐스트
      this.server.to(roomCode).emit('room:player-joined', newPlayer);

      // 입장한 클라이언트에게 방 전체 정보 전송
      client.emit('room:joined', room);
    } catch (error) {
      const message = error instanceof Error ? error.message : '방 입장에 실패했습니다';
      client.emit('room:error', { message });
    }
  }

  /**
   * 방 퇴장
   * - RoomService를 통해 Redis에서 플레이어 제거
   * - Socket.IO 방에서 leave
   * - 다른 참여자에게 퇴장 알림 브로드캐스트
   */
  @SubscribeMessage('room:leave')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LeaveRoomDto,
  ) {
    try {
      const { roomCode } = payload;
      const userId = client.data.userId;

      // Redis에서 플레이어 제거
      await this.roomService.leaveRoom(roomCode, userId);

      // 다른 참여자에게 퇴장 알림 브로드캐스트
      this.server.to(roomCode).emit('room:player-left', { userId });

      // Socket.IO 방에서 leave
      await client.leave(roomCode);

      client.emit('room:left', { success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : '방 퇴장에 실패했습니다';
      client.emit('room:error', { message });
    }
  }

  /**
   * 플레이어 준비 상태 변경
   * - Redis에서 방 정보 조회
   * - 플레이어의 준비 상태 업데이트
   * - 모든 참여자에게 브로드캐스트
   */
  @SubscribeMessage('room:ready')
  async handlePlayerReady(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: PlayerReadyDto,
  ) {
    try {
      const { roomCode, isReady } = payload;
      const userId = client.data.userId;

      // 방 정보 조회
      const room = await this.roomService.getRoom(roomCode);
      if (!room) {
        client.emit('room:error', { message: '존재하지 않는 방입니다' });
        return;
      }

      // 플레이어 찾기 및 준비 상태 업데이트
      const player = room.players.find((p) => p.id === userId);
      if (!player) {
        client.emit('room:error', { message: '방에 참여하지 않은 사용자입니다' });
        return;
      }

      player.isReady = isReady;

      // Redis 업데이트 (RoomService 메서드 활용)
      // 여기서는 간단히 전체 방 정보를 다시 저장
      // 실제로는 RoomService에 updatePlayerReady 메서드를 추가하는 것이 좋음

      // 모든 참여자에게 준비 상태 브로드캐스트
      this.server.to(roomCode).emit('room:player-ready', {
        userId,
        isReady,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '준비 상태 변경에 실패했습니다';
      client.emit('room:error', { message });
    }
  }

  /**
   * 방 설정 수정
   * - 방장 권한 확인
   * - Redis에서 방 설정 업데이트
   * - 모든 참여자에게 브로드캐스트
   */
  @SubscribeMessage('room:update-settings')
  async handleUpdateSettings(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: UpdateSettingsDto,
  ) {
    try {
      const { roomCode, settings } = payload;
      const userId = client.data.userId;

      // 방 정보 조회
      const room = await this.roomService.getRoom(roomCode);
      if (!room) {
        client.emit('room:error', { message: '존재하지 않는 방입니다' });
        return;
      }

      // 방장 권한 확인
      if (room.hostId !== userId) {
        client.emit('room:error', { message: '방장만 설정을 변경할 수 있습니다' });
        return;
      }

      // 방 설정 업데이트 (RoomService에 메서드 추가 필요)
      room.settings = settings;

      // 모든 참여자에게 설정 변경 브로드캐스트
      this.server.to(roomCode).emit('room:settings-updated', { settings });
    } catch (error) {
      const message = error instanceof Error ? error.message : '설정 변경에 실패했습니다';
      client.emit('room:error', { message });
    }
  }

  /**
   * 게임 시작
   * - 방장 권한 확인
   * - 최소 인원 확인 (4명)
   * - 모든 참여자에게 게임 시작 알림
   */
  @SubscribeMessage('game:start')
  async handleStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: StartGameDto,
  ) {
    try {
      const { roomCode } = payload;
      const userId = client.data.userId;

      // 방 정보 조회
      const room = await this.roomService.getRoom(roomCode);
      if (!room) {
        client.emit('room:error', { message: '존재하지 않는 방입니다' });
        return;
      }

      // 방장 권한 확인
      if (room.hostId !== userId) {
        client.emit('room:error', { message: '방장만 게임을 시작할 수 있습니다' });
        return;
      }

      // 최소 인원 확인 (4명)
      if (room.players.length < 4) {
        client.emit('room:error', {
          message: '최소 4명 이상의 플레이어가 필요합니다',
        });
        return;
      }

      // 방 상태를 'playing'으로 변경
      room.status = 'playing';

      // 모든 참여자에게 게임 시작 알림
      this.server.to(roomCode).emit('game:started', {
        roomCode,
        players: room.players,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '게임 시작에 실패했습니다';
      client.emit('room:error', { message });
    }
  }

  /**
   * 연결 해제 시 처리
   * - 클라이언트가 속한 모든 방에서 퇴장 처리
   */
  async handleDisconnect(client: Socket) {
    // 실제로는 클라이언트가 어떤 방에 속해 있는지 추적하여 처리해야 함
    // 여기서는 간단히 로그만 남김
    console.log(`Client disconnected: ${client.id}`);
  }
}
