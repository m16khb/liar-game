import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { RoomService } from '../room.service';
import { PlayerService } from '../../player/player.service';
import { CreateRoomDto } from '../dto/create-room.dto';
import { JoinRoomDto } from '../dto/join-room.dto';
import { PlayerStatus } from '../../player/entities/player.entity';
import { RoomStatus } from '../entities/room.entity';
import { SupabaseJwtStrategy, SupabaseJwtPayload } from '../../auth/strategies/supabase-jwt.strategy';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  user?: any;
}

@WebSocketGateway({
  namespace: '/room',
  cors: {
    origin: [
      'http://localhost:3000',
      'https://dev.m16khb.xyz',
      'https://ws.dev.m16khb.xyz',
      'https://ws.m16khb.xyz'
    ],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class RoomGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RoomGateway.name);
  private connectedClients = new Map<string, AuthenticatedSocket>();
  private disconnectTimers = new Map<number, NodeJS.Timeout>(); // userId -> timer
  @WebSocketServer() server: Server;

  private supabaseJwtStrategy: SupabaseJwtStrategy;

  constructor(
    private readonly roomService: RoomService,
    private readonly playerService: PlayerService,
    private readonly configService: ConfigService,
  ) {
    this.supabaseJwtStrategy = new SupabaseJwtStrategy(this.configService);
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected: ${client.id}`);

    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`No token provided for client: ${client.id}`);
        client.emit('error', { message: '인증이 필요합니다.' });
        client.disconnect();
        return;
      }

      // Supabase JWT 토큰 검증
      let user;
      try {
        const decoded = jwt.decode(token) as SupabaseJwtPayload;
        user = await this.supabaseJwtStrategy.validate(decoded);
      } catch (error) {
        this.logger.error(`Supabase token verification failed for client ${client.id}: ${error instanceof Error ? error.message : error}`);
        client.emit('error', { message: '인증에 실패했습니다. 다시 로그인해주세요.' });
        client.disconnect();
        return;
      }

      client.userId = user.id;
      client.user = user;
      this.connectedClients.set(client.id, client);

      // 재접속인 경우 타이머 취소
      const existingTimer = this.disconnectTimers.get(user.id);
      if (existingTimer) {
        clearTimeout(existingTimer);
        this.disconnectTimers.delete(user.id);
        this.logger.log(`User ${user.id} reconnected, canceling disconnect timer`);

        // 플레이어 정보를 다시 가져와서 상태 복원
        const player = await this.playerService.findActivePlayer(user.id);
        if (player) {
          // 방에 다시 참가시키고 다른 플레이어들에게 알림
          await client.join(player.room.code);

          // 방의 모든 플레이어 정보 다시 조회
          const allPlayers = await this.playerService.getPlayers(player.roomId);
          const roomInfo = await this.roomService.findByCode(player.room.code);

          // 재접속한 유저에게 전체 방 정보 전송
          client.emit('reconnect-success', {
            room: roomInfo,
            players: allPlayers,
            player: await this.playerService.findPlayer(player.roomId, user.id)
          });

          // 재접속 플래그 설정 (handleJoinRoom에서 중복 방지용)
          (client as any).isReconnecting = true;

          // 방에 있는 다른 플레이어들에게 알림
          this.server.to(player.room.code).emit('player-reconnected', {
            userId: user.id,
            player: await this.playerService.findPlayer(player.roomId, user.id),
            players: allPlayers
          });
        }
      }

      this.logger.log(`User authenticated: ${client.userId} (${user.email})`);
    } catch (error) {
      this.logger.error(`Authentication failed: ${error instanceof Error ? error.message : error}`);
      client.emit('error', { message: '인증에 실패했습니다.' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);

    // 방에서 참여 중인 플레이어인지 확인
    if (client.userId) {
      this.handlePlayerDisconnect(client);
    }
  }

  /**
   * 플레이어 연결 끊김 처리
   */
  private async handlePlayerDisconnect(client: AuthenticatedSocket) {
    const userId = client.userId;
    if (!userId) return;

    try {
      const player = await this.playerService.findActivePlayer(userId);
      if (!player) return;

      // 이미 타이머가 실행 중인지 확인
      if (this.disconnectTimers.has(userId)) {
        return;
      }

      // 방에 다른 플레이어들에게 '통신중' 상태 알림
      this.server.to(player.room.code).emit('player-disconnected', {
        userId,
        message: '통신 중...',
        player: await this.playerService.findPlayer(player.roomId, userId)
      });

      // 5초 후 자동 퇴장 타이머 설정
      const disconnectTimer = setTimeout(async () => {
        this.logger.log(`User ${userId} did not reconnect, removing from room`);

        // 실제 방 나가기 처리
        await this.performLeaveRoom(userId);

        // 타이머 삭제
        this.disconnectTimers.delete(userId);
      }, 5000); // 5초

      this.disconnectTimers.set(userId, disconnectTimer);
      this.logger.log(`Set disconnect timer for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error handling player disconnect: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * 게임 시작 가능 여부 확인
   */
  private async checkGameStartStatus(roomId: number) {
    try {
      const players = await this.playerService.getPlayers(roomId);

      if (players.length === 0) {
        this.logger.warn(`No players in room ${roomId}`);
        return;
      }

      // roomId로 방 정보 조회
      const room = await this.roomService.findById(roomId);

      if (!room) {
        this.logger.warn(`Room not found: ${roomId}`);
        return;
      }

      // 최소 인원수 충족 및 방장 제외 모든 플레이어 준비 확인
      const nonHostPlayers = players.filter(p => !p.isHost);
      const host = players.find(p => p.isHost);

      // 디버깅 로그
      this.logger.log(`Room info: id=${room.id}, minPlayers=${room.minPlayers}, maxPlayers=${room.maxPlayers}`);
      this.logger.log(`Players info (total ${players.length}):`);
      players.forEach(p => {
        this.logger.log(`  - User ${p.userId}: isHost=${p.isHost}, status=${p.status}`);
      });

      // 방장도 준비 상태여야 함
      const allPlayersReady = players.length >= room.minPlayers &&
        nonHostPlayers.every(p => p.status === PlayerStatus.READY) &&
        (!host || host.status === PlayerStatus.READY);

      this.logger.log(`Result: Total=${players.length}/${room.minPlayers}, HostReady=${host ? host.status : 'none'}, NonHostReady=${nonHostPlayers.filter(p => p.status === PlayerStatus.READY).length}/${nonHostPlayers.length}, CanStart=${allPlayersReady}`);

      if (host) {
        const hostSocket = Array.from(this.connectedClients.values())
          .find(c => c.userId === host.userId);

        this.logger.log(`Host socket found: ${hostSocket ? 'yes' : 'no'}, Connected clients: ${this.connectedClients.size}`);

        if (hostSocket) {
          this.logger.log(`Sending game-can-start to host ${host.userId}: ${allPlayersReady}`);

          // 방장의 준비 상태 확인
          const hostReady = host ? host.status === PlayerStatus.READY : false;
          const readyNonHostCount = nonHostPlayers.filter(p => p.status === PlayerStatus.READY).length;

          hostSocket.emit('game-can-start', {
            canStart: allPlayersReady,
            message: allPlayersReady
              ? '모든 플레이어가 준비되었습니다. 게임을 시작할 수 있습니다.'
              : `준비된 플레이어: ${readyNonHostCount + (hostReady ? 1 : 0)}/${players.length}명`
          });
        } else {
          this.logger.warn(`Host socket not found for user ${host.userId}`);
        }
      } else {
        this.logger.warn('No host found in room');
      }
    } catch (error) {
      this.logger.error(`Failed to check game start status: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * 실제 방 나가기 처리
   */
  private async performLeaveRoom(userId: number) {
    try {
      const player = await this.playerService.findActivePlayer(userId);

      if (player) {
        await this.playerService.removePlayer(player.roomId, userId);

        // 남은 플레이어 목록 조회
        const remainingPlayers = await this.playerService.getPlayers(player.roomId);

        if (remainingPlayers.length > 0) {
          const newHost = remainingPlayers[0];

          // 플레이어 테이블의 방장 정보 업데이트
          await this.playerService.updateHost(player.roomId, newHost.userId);

          // 방 테이블의 방장 정보 업데이트
          await this.roomService.updateHost(player.roomId, newHost.userId);

          // 방 인원 수 감소
          const room = await this.roomService.decrementPlayers(player.roomId);

          // 방에 남아있는 모든 사람에게 알림
          this.server.to(room.code).emit('room-updated', {
            room: {
              ...room,
              hostId: newHost.userId  // 명시적으로 hostId 포함
            },
            players: remainingPlayers,
          });

          // 방장 변경 알림
          this.server.to(room.code).emit('host-changed', {
            newHostId: newHost.userId,
            players: remainingPlayers,
          });

          // 방장에게 게임 시작 가능 여부 다시 확인
          await this.checkGameStartStatus(room.id);
        } else {
          // 참가자가 0명이면 방 삭제
          const roomToDelete = await this.roomService.findById(player.roomId);
          if (roomToDelete) {
            this.logger.log(`Room ${roomToDelete.code} has no players. Deleting room.`);
            await this.roomService.deleteRoom(player.roomId);

            // 방에서 모두 내보내기
            this.server.in(roomToDelete.code).emit('room-deleted', {
              message: '참가자가 없어 방이 삭제되었습니다.',
            });
            this.server.in(roomToDelete.code).socketsLeave(roomToDelete.code);
          }
        }

        this.logger.log(`User ${userId} left room`);
      }
    } catch (error) {
      this.logger.error(`Failed to leave room: ${error instanceof Error ? error.message : error}`);
    }
  }

  @SubscribeMessage('create-room')
  async handleCreateRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() createRoomDto: CreateRoomDto,
  ) {
    this.logger.log(`User ${client.userId} is attempting to create a room`);
    try {
      const userId = client.userId;

      if (!userId) {
        client.emit('error', { message: '인증이 필요합니다.' });
        return;
      }

      // 방 생성
      const room = await this.roomService.createRoom(createRoomDto, userId);

      // 방에 자동 참가
      await this.playerService.addPlayer(room.id, userId, true);

      // Socket.IO 룸 참가
      await client.join(room.code);

      // 방 정보 전송
      client.emit('room-created', {
        room,
        player: {
          userId,
          isHost: true,
          status: PlayerStatus.NOT_READY,
        },
      });

      this.logger.log(`Room created: ${room.code} by user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to create room: ${error instanceof Error ? error.message : error}`);
      client.emit('error', { message: '방 생성에 실패했습니다.' });
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() joinRoomDto: JoinRoomDto,
  ) {
    this.logger.log(`User ${client.userId} is attempting to join room: ${joinRoomDto.roomCode}`);
    try {
      const userId = client.userId;

      if (!userId) {
        client.emit('error', { message: '인증이 필요합니다.' });
        return;
      }

      const room = await this.roomService.findByCode(joinRoomDto.roomCode);

      if (!room) {
        client.emit('error', { message: '존재하지 않는 방입니다.' });
        return;
      }

      if (room.status !== RoomStatus.WAITING) {
        client.emit('error', { message: '이미 시작된 방입니다.' });
        return;
      }

      if (room.currentPlayers >= room.maxPlayers) {
        client.emit('error', { message: '방이 꽉 찼습니다.' });
        return;
      }

      // 이미 참여 중인지 확인
      const existingPlayer = await this.playerService.findPlayer(room.id, userId);
      if (existingPlayer) {
        // 재접속 처리
        await client.join(room.code);

        // 방의 모든 플레이어 정보 조회
        const allPlayers = await this.playerService.getPlayers(room.id);

        // 재접속한 유저에게 전체 정보 전송
        client.emit('room-joined', {
          room,
          player: existingPlayer,
          players: allPlayers,
        });

        // handleConnection에서 이미 재접속 처리를 했는지 확인
        if (!(client as any).isReconnecting) {
          // 방에 있는 다른 플레이어들에게 알림
          client.to(room.code).emit('player-reconnected', {
            userId,
            player: existingPlayer,
            players: allPlayers
          });
        }

        // 플래그 초기화
        (client as any).isReconnecting = false;

        return;
      }

      // 플레이어 추가 (방 생성자인지 확인)
      const isHost = room.hostId === userId;

      // 상세한 방장 확인 로그
      this.logger.log(`[방장 확인] roomId: ${room.id}, room.hostId: ${room.hostId}, userId: ${userId}, isHost: ${isHost}`);
      this.logger.log(`[방 정보] 방 코드: ${room.code}, 방 제목: ${room.title}, 방장 ID: ${room.hostId}`);

      const player = await this.playerService.addPlayer(room.id, userId, isHost);

      // 생성된 플레이어 정보 로그
      this.logger.log(`[플레이어 생성] playerId: ${player.id}, userId: ${player.userId}, isHost: ${player.isHost}`);

      // Socket.IO 룸 참가
      await client.join(room.code);

      // 방 정보 업데이트
      const updatedRoom = await this.roomService.incrementPlayers(room.id);

      // 전체 플레이어 정보 조회
      const allPlayers = await this.playerService.getPlayers(room.id);
      this.logger.log(`Players in room ${room.code}: ${JSON.stringify(allPlayers.map(p => ({ userId: p.userId, isHost: p.isHost, email: p.user?.email })))}`);

      // 방 참가 성공 알림
      client.emit('room-joined', {
        room: updatedRoom,
        player,
        players: allPlayers,  // 방장 정보를 포함한 전체 플레이어 목록
      });

      // 방장을 포함한 모든 참가자에게 업데이트 알림
      this.server.to(room.code).emit('room-updated', {
        room: updatedRoom,
        players: allPlayers,
      });

      // 방장에게 게임 시작 가능 여부 확인
      await this.checkGameStartStatus(room.id);

      this.logger.log(`User ${userId} joined room: ${room.code}`);
    } catch (error) {
      this.logger.error(`Failed to join room: ${error instanceof Error ? error.message : error}`);
      client.emit('error', { message: '방 참가에 실패했습니다.' });
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(@ConnectedSocket() client: AuthenticatedSocket) {
    this.logger.log(`User ${client.userId} is attempting to leave a room`);
    try {
      const userId = client.userId;

      if (!userId) {
        return;
      }

      // 타이머가 있다면 취소 (명시적 나가기)
      const existingTimer = this.disconnectTimers.get(userId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        this.disconnectTimers.delete(userId);
      }

      const player = await this.playerService.findActivePlayer(userId);

      if (player) {
        await this.playerService.removePlayer(player.roomId, userId);

        // 남은 플레이어 목록 조회
        const remainingPlayers = await this.playerService.getPlayers(player.roomId);

        if (remainingPlayers.length > 0) {
          const newHost = remainingPlayers[0];

          // 플레이어 테이블의 방장 정보 업데이트
          await this.playerService.updateHost(player.roomId, newHost.userId);

          // 방 테이블의 방장 정보 업데이트
          await this.roomService.updateHost(player.roomId, newHost.userId);

          // 방 인원 수 감소
          const room = await this.roomService.decrementPlayers(player.roomId);

          await client.leave(room.code);

          // 방에 남아있는 모든 사람에게 알림
          this.server.to(room.code).emit('room-updated', {
            room: {
              ...room,
              hostId: newHost.userId  // 명시적으로 hostId 포함
            },
            players: remainingPlayers,
          });

          // 방장 변경 알림
          this.server.to(room.code).emit('host-changed', {
            newHostId: newHost.userId,
            players: remainingPlayers,
          });
        } else {
          // 참가자가 0명이면 방 삭제
          const room = await this.roomService.decrementPlayers(player.roomId);
          await client.leave(room.code);

          this.logger.log(`Room ${room.code} has no players. Deleting room.`);
          await this.roomService.deleteRoom(room.id);

          // 방에서 모두 내보내기
          this.server.in(room.code).emit('room-deleted', {
            message: '참가자가 없어 방이 삭제되었습니다.',
          });
          this.server.in(room.code).socketsLeave(room.code);
        }

        this.logger.log(`User ${userId} left room`);
      }
    } catch (error) {
      this.logger.error(`Failed to leave room: ${error instanceof Error ? error.message : error}`);
    }
  }

  @SubscribeMessage('toggle-ready')
  async handleToggleReady(@ConnectedSocket() client: AuthenticatedSocket) {
    this.logger.log(`User ${client.userId} is attempting to toggle ready status`);
    try {
      const userId = client.userId;

      if (!userId) {
        client.emit('error', { message: '인증이 필요합니다.' });
        return;
      }

      const player = await this.playerService.findActivePlayer(userId);

      if (!player) {
        client.emit('error', { message: '방에 참여하지 않았습니다.' });
        return;
      }

      // 준비 상태 토글
      const newStatus = player.status === PlayerStatus.READY
        ? PlayerStatus.NOT_READY
        : PlayerStatus.READY;

      await this.playerService.updatePlayerStatus(player.roomId, userId, newStatus);

      // 업데이트된 플레이어 정보 조회
      const updatedPlayer = await this.playerService.findPlayer(player.roomId, userId);
      const players = await this.playerService.getPlayers(player.roomId);

      // 모든 참가자에게 상태 변경 알림
      this.server.to(player.room.code).emit('player-ready-changed', {
        player: updatedPlayer,
        players,
      });

      // 방장에게 게임 시작 가능 여부 확인
      await this.checkGameStartStatus(player.roomId);

      this.logger.log(`User ${userId} changed ready status: ${newStatus}`);
    } catch (error) {
      this.logger.error(`Failed to toggle ready: ${error instanceof Error ? error.message : error}`);
      client.emit('error', { message: '준비 상태 변경에 실패했습니다.' });
    }
  }

  @SubscribeMessage('transfer-host')
  async handleTransferHost(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { targetUserId: number }
  ) {
    this.logger.log(`User ${client.userId} is attempting to transfer host to ${data.targetUserId}`);
    try {
      const userId = client.userId;

      if (!userId) {
        client.emit('error', { message: '인증이 필요합니다.' });
        return;
      }

      const player = await this.playerService.findActivePlayer(userId);

      if (!player || !player.isHost) {
        client.emit('error', { message: '방장만 방장 위임이 가능합니다.' });
        return;
      }

      if (player.room.status !== RoomStatus.WAITING) {
        client.emit('error', { message: '게임 중에는 방장 위임이 불가능합니다.' });
        return;
      }

      // 위임 대상 플레이어 확인
      const targetPlayer = await this.playerService.findPlayer(player.roomId, data.targetUserId);

      if (!targetPlayer) {
        client.emit('error', { message: '존재하지 않는 플레이어입니다.' });
        return;
      }

      // 방장 위임 처리
      await this.playerService.updateHost(player.roomId, data.targetUserId);

      // 모든 플레이어 정보 가져오기
      const players = await this.playerService.getPlayers(player.roomId);

      // 방에 있는 모든 사람에게 방장 변경 알림
      this.server.to(player.room.code).emit('host-transferred', {
        previousHostId: userId,
        newHostId: data.targetUserId,
        players
      });

      this.logger.log(`Host transferred from ${userId} to ${data.targetUserId} in room: ${player.room.code}`);
    } catch (error) {
      this.logger.error(`Failed to transfer host: ${error instanceof Error ? error.message : error}`);
      client.emit('error', { message: '방장 위임에 실패했습니다.' });
    }
  }

  @SubscribeMessage('start-game')
  async handleStartGame(@ConnectedSocket() client: AuthenticatedSocket) {
    this.logger.log(`User ${client.userId} is attempting to start the game`);
    try {
      const userId = client.userId;

      if (!userId) {
        client.emit('error', { message: '인증이 필요합니다.' });
        return;
      }

      const player = await this.playerService.findActivePlayer(userId);

      if (!player || !player.isHost) {
        client.emit('error', { message: '방장만 게임을 시작할 수 있습니다.' });
        return;
      }

      if (player.room.status !== RoomStatus.WAITING) {
        client.emit('error', { message: '게임을 시작할 수 없는 상태입니다.' });
        return;
      }

      const players = await this.playerService.getPlayers(player.room.id);
      const nonHostPlayers = players.filter(p => !p.isHost);

      if (players.length < player.room.minPlayers) {
        client.emit('error', { message: `최소 ${player.room.minPlayers}명 이상 필요합니다.` });
        return;
      }

      const allPlayersReady = nonHostPlayers.every(p => p.status === PlayerStatus.READY);
      if (!allPlayersReady) {
        client.emit('error', { message: '모든 참가자가 준비해야 합니다.' });
        return;
      }

      // 게임 시작 처리
      const room = await this.roomService.updateStatus(player.roomId, RoomStatus.PLAYING);

      // 모든 플레이어 상태를 PLAYING으로 변경
      await this.playerService.updateAllPlayersStatus(player.roomId, PlayerStatus.PLAYING);

      // 방에 있는 모든 사람에게 게임 시작 알림
      this.server.to(player.room.code).emit('game-started', {
        room,
        players: await this.playerService.getPlayers(player.room.id),
      });

      this.logger.log(`Game started in room: ${player.room.code}`);
    } catch (error) {
      this.logger.error(`Failed to start game: ${error instanceof Error ? error.message : error}`);
      client.emit('error', { message: '게임 시작에 실패했습니다.' });
    }
  }
}
