---
name: websocket-gateway-builder
description: Socket.IO Gateway로 실시간 멀티플레이어 게임 통신 구축. liar-game 실시간 기능을 위한 방 관리, 게임 상태 동기화, WebSocket 이벤트 처리 구현 시 사용합니다.
---

# WebSocket Gateway 구축기

## 지침

멀티플레이어 게임을 위한 확장 가능한 WebSocket 통신 패턴 생성:

1. **방 기반 통신 설계**: 적절한 채널 격리와 함께
2. **이벤트 처리 구현**: 게임 액션 및 상태 업데이트용
3. **연결 관리 추가**: 방 참가/퇴장용
4. **모든 연결된 클라이언트 간 상태 일관성** 확보
5. **재연결 전략으로 네트워크 문제** 처리

## 예시

### 방 관리 Gateway
```typescript
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL },
  namespace: '/room'
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly roomService: RoomService) {}

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomDto
  ) {
    const { roomCode, userId } = data;

    // 방 채널 참가
    await client.join(roomCode);

    // 방 상태 업데이트
    const room = await this.roomService.addPlayer(roomCode, userId);

    // 다른 플레이어에게 브로드캐스트
    client.to(roomCode).emit('playerJoined', {
      playerId: userId,
      playerCount: room.currentPlayers
    });

    // 참가하는 플레이어에게 방 정보 전송
    client.emit('roomJoined', room);
  }

  @SubscribeMessage('gameAction')
  async handleGameAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: GameActionDto
  ) {
    const { roomCode, action, payload } = data;

    try {
      // 게임 액션 처리
      const result = await this.roomService.processAction(
        roomCode,
        action,
        payload
      );

      // 모든 플레이어에게 상태 업데이트 브로드캐스트
      client.to(roomCode).emit('gameStateUpdate', result);
      client.emit('actionSuccess', result);

    } catch (error) {
      client.emit('actionError', {
        message: error.message,
        action
      });
    }
  }
}
```

### 이벤트 타입 정의
```typescript
// 클라이언트 → 서버 이벤트
export interface ClientToServerEvents {
  joinRoom: (data: JoinRoomDto) => void;
  leaveRoom: (data: LeaveRoomDto) => void;
  gameAction: (data: GameActionDto) => void;
}

// 서버 → 클라이언트 이벤트
export interface ServerToClientEvents {
  roomJoined: (room: GameRoom) => void;
  playerJoined: (data: PlayerJoinedData) => void;
  playerLeft: (data: PlayerLeftData) => void;
  gameStateUpdate: (state: GameState) => void;
  actionSuccess: (result: ActionResult) => void;
  actionError: (error: ActionError) => void;
}
```

### WebSocket 이벤트용 DTO
```typescript
export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  roomCode: string;

  @IsNumber()
  @IsNotEmpty()
  userId: number;
}

export class GameActionDto {
  @IsString()
  @IsNotEmpty()
  roomCode: string;

  @IsString()
  @IsEnum(['startGame', 'submitAnswer', 'votePlayer'])
  action: string;

  @IsObject()
  @IsNotEmpty()
  payload: any;
}
```

## 핵심 패턴

- **방 격리**: 별도 채널용 `client.join(roomCode)` 사용
- **서버 권한**: 모든 게임 상태 변경은 서버에서 발생
- **이벤트 검증**: 모든 수신 WebSocket 메시지 검증
- **에러 처리**: 클라이언트에게 구조화된 에러 응답 전송
- **연결 정리**: 연결 해제 및 방 정리 처리
- **상태 브로드캐스팅**: 방 전체 메시지용 `client.to(roomCode).emit()` 사용
- **타입 안전성**: 모든 이벤트 타입용 인터페이스 정의