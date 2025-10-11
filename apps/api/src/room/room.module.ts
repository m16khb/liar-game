// @CODE:ROOM-001:INFRA | SPEC: .moai/specs/SPEC-ROOM-001/spec.md
// @CODE:ROOM-001:INFRA: Room 모듈 설정

import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomGateway } from './room.gateway';
import { RoomController } from './room.controller';

@Module({
  providers: [RoomService, RoomGateway],
  controllers: [RoomController],
  exports: [RoomService],
})
export class RoomModule {}
