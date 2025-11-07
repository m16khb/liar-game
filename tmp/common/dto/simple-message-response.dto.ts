import { ApiProperty } from '@nestjs/swagger';

/**
 * 단순 메시지 응답 DTO
 * 단순한 메시지를 반환하는 작업에 대한 범용 응답
 */
export class SimpleMessageResponseDto {
  @ApiProperty({
    description: '응답 메시지',
    example: '작업이 성공적으로 완료되었습니다',
  })
  message: string;
}

/**
 * 단순 성공 응답 DTO
 * 메시지와 함께 성공 상태를 반환하는 작업에 대한 범용 응답
 */
export class SimpleSuccessResponseDto {
  @ApiProperty({
    description: '작업 성공 상태',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '응답 메시지',
    example: '작업이 성공적으로 완료되었습니다',
  })
  message: string;
}
