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
import { PlayerService } from '../services/player.service';
import { UserService } from '../../user/user.service';
import { CreateRoomDto } from '../dto/create-room.dto';
import { JoinRoomDto } from '../dto/join-room.dto';
import { PlayerStatus } from '../entities/player.entity';
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

    // 방에서 나가기 처리
    if (client.userId) {
      this.handleLeaveRoom(client);
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
        client.emit('room-joined', {
          room,
          player: existingPlayer,
        });
        return;
      }

      // 플레이어 추가
      const player = await this.playerService.addPlayer(room.id, userId);

      // Socket.IO 룸 참가
      await client.join(room.code);

      // 방 정보 업데이트
      const updatedRoom = await this.roomService.incrementPlayers(room.id);

      // 방 참가 성공 알림
      client.emit('room-joined', {
        room: updatedRoom,
        player,
      });

      // 방장을 포함한 모든 참가자에게 업데이트 알림
      this.server.to(room.code).emit('room-updated', {
        room: updatedRoom,
        players: await this.playerService.getPlayers(room.id),
      });

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

      const player = await this.playerService.findActivePlayer(userId);

      if (player) {
        await this.playerService.removePlayer(player.roomId, userId);
        const room = await this.roomService.decrementPlayers(player.roomId);

        await client.leave(room.code);

        // 방에 남아있는 모든 사람에게 알림
        this.server.to(room.code).emit('room-updated', {
          room,
          players: await this.playerService.getPlayers(room.id),
        });

        // 방장이 나가면 방장 권한 위임
        const players = await this.playerService.getPlayers(room.id);
        if (players.length > 0) {
          const newHost = players[0];
          await this.playerService.updateHost(player.roomId, newHost.userId);

          this.server.to(room.code).emit('host-changed', {
            newHostId: newHost.userId,
          });
        }

        this.logger.log(`User ${userId} left room: ${room.code}`);
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

      // 모든 인원이 준비되었는지 확인 (방장 제외)
      const nonHostPlayers = players.filter(p => !p.isHost);
      const allPlayersReady = nonHostPlayers.length >= (player.room.minPlayers - 1) &&
        nonHostPlayers.every(p => p.status === PlayerStatus.READY);

      if (allPlayersReady) {
        this.server.to(player.room.code).emit('game-can-start');
      }

      this.logger.log(`User ${userId} changed ready status: ${newStatus}`);
    } catch (error) {
      this.logger.error(`Failed to toggle ready: ${error instanceof Error ? error.message : error}`);
      client.emit('error', { message: '준비 상태 변경에 실패했습니다.' });
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
