// @CODE:ROOM-001:DOMAIN | SPEC: .moai/specs/SPEC-ROOM-001/spec.md | TEST: test/room/room.service.test.ts
// @CODE:ROOM-001:DOMAIN: UUID v4 기반 방 코드 생성

import { randomUUID } from 'crypto';

/**
 * UUID v4 방 코드 생성
 * - 36자 형식: 8-4-4-4-12
 * - 중복 확률 거의 0 (2^122 조합)
 * - 재시도 로직 불필요
 * - Node.js 내장 함수 (추가 의존성 없음)
 *
 * 예: "550e8400-e29b-41d4-a716-446655440000"
 */
export function generateRoomCode(): string {
  return randomUUID();
}
