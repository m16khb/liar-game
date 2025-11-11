import { io, Socket } from 'socket.io-client';

// 테스트 설정
const SERVER_URL = 'https://dev.m16khb.xyz/room';
const TEST_ROOM_CODE = 'TEST123';

interface JoinRoomData {
  roomCode: string;
  userId?: string;
}

interface MessageData {
  roomCode: string;
  message: string;
  type: 'chat' | 'system' | 'game';
  sender?: string;
}

class WebSocketTester {
  private socket: Socket;

  constructor() {
    // 여기에 실제 인증 토큰을 넣어야 함
    const authToken =
      'eyJhbGciOiJIUzI1NiIsImtpZCI6ImM4T0RMZEs2SlB1L1BvRXMiLCJ0eXAiOiJKV1QifQ.eyJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJvYXV0aCIsInRpbWVzdGFtcCI6MTc2Mjg3MzQxM31dLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJnb29nbGUiLCJwcm92aWRlcnMiOlsiZ29vZ2xlIl19LCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZW1haWwiOiJtMTZraGJAZ21haWwuY29tIiwiZXhwIjoxNzYyODc3MDEzLCJpYXQiOjE3NjI4NzM0MTMsImlzX2Fub255bW91cyI6ZmFsc2UsImlzcyI6Imh0dHBzOi8vcmdlaHNjdWxjd25icG5ycnNpcm4uc3VwYWJhc2UuY28vYXV0aC92MSIsInBob25lIjoiIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJzZXNzaW9uX2lkIjoiNWVhZjk0OGItMmE0Zi00ZDgyLWE0MjAtYTI2MzFhNDY4OGFiIiwic3ViIjoiZWNmOTlmZGEtZGQ4ZC00YmI2LWE3NTEtZWE2MzI3Y2EzNjA0IiwidXNlcl9pZCI6MSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSUplem5vNTVLZ2RVN3RjbmZiR3h3anhHUjVJTkVidzh0R0FheGxfSWdmeTRLUHdBPXM5Ni1jIiwiZW1haWwiOiJtMTZraGJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6Iu2eiOuwmCIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsIm5hbWUiOiLtnojrsJgiLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJSmV6bm81NUtnZFU3dGNuZmJHeHdqeEdSNUlORWJ3OHRHQWF4bF9JZ2Z5NEtQd0E9czk2LWMiLCJwcm92aWRlcl9pZCI6IjEwOTkxMzc5NDA2NzQ1MDg2ODk3NSIsInN1YiI6IjEwOTkxMzc5NDA2NzQ1MDg2ODk3NSJ9LCJ1c2VyX3JvbGUiOiJ1c2VyIiwidXNlcl90aWVyIjoibWVtYmVyIn0.1IP4GU53jwwyLzJphX7TLoNTzxQNDTklZ-W5JC0YeUQ'; // 로그인 후 얻은 토큰

    this.socket = io(SERVER_URL, {
      auth: {
        token: authToken,
      },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    // 연결 성공
    this.socket.on('connect', () => {
      console.log('✅ 서버에 연결됨:', this.socket.id);
      this.testJoinRoom();
    });

    // 연결 실패
    this.socket.on('connect_error', (error) => {
      console.error('❌ 연결 실패:', error.message);
      process.exit(1);
    });

    // 방 참가 성공
    this.socket.on('roomJoined', (data: any) => {
      console.log('✅ 방 참가 성공:', data);
      this.testSendMessage();
    });

    // 방 에러
    this.socket.on('roomError', (error: any) => {
      console.error('❌ 방 에러:', error);
    });

    // 메시지 수신
    this.socket.on('message', (data: any) => {
      console.log('✅ 메시지 수신:', data);
      this.testLeaveRoom();
    });

    // 방 퇴장 성공
    this.socket.on('roomLeft', (data: any) => {
      console.log('✅ 방 퇴장 성공:', data);
      console.log('\n🎉 모든 테스트 완료!');
      setTimeout(() => this.cleanup(), 1000);
    });

    // 일반 에러
    this.socket.on('error', (error: any) => {
      console.error('❌ 소켓 에러:', error);
    });

    // 연결 해제
    this.socket.on('disconnect', (reason: string) => {
      console.log('🔌 연결 해제:', reason);
    });
  }

  // 테스트 1: 방 참가
  private testJoinRoom() {
    console.log('\n📝 테스트 1: 방 참가 시도');
    const data: JoinRoomData = { roomCode: TEST_ROOM_CODE };
    this.socket.emit('joinRoom', data);
  }

  // 테스트 2: 메시지 전송
  private testSendMessage() {
    console.log('\n📤 테스트 2: 메시지 전송');
    const data: MessageData = {
      roomCode: TEST_ROOM_CODE,
      message: '테스트 메시지입니다',
      type: 'chat',
      sender: '테스터',
    };
    this.socket.emit('sendMessage', data);
  }

  // 테스트 3: 방 퇴장
  private testLeaveRoom() {
    console.log('\n🚪 테스트 3: 방 퇴장');
    this.socket.emit('leaveRoom', { roomCode: TEST_ROOM_CODE });
  }

  // 정리
  private cleanup() {
    this.socket.disconnect();
    process.exit(0);
  }

  // 타임아웃 설정
  public startTimeout() {
    setTimeout(() => {
      console.error('⏰ 테스트 타임아웃 (10초)');
      this.cleanup();
      process.exit(1);
    }, 10000);
  }
}

// 테스트 실행
console.log('🔌 WebSocket Gateway 테스트 시작...');
console.log(`서버: ${SERVER_URL}`);

const tester = new WebSocketTester();
tester.startTimeout();
