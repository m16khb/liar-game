import { UserTier } from '@/modules/user/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

/**
 * User Profile Response DTO
 * Used for returning user profile information without sensitive data
 */
export class UserProfileResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User tier level',
    enum: UserTier,
    example: UserTier.MEMBER,
  })
  tier: UserTier;

  @ApiProperty({
    description: 'Last login timestamp',
    example: '2023-10-15T04:00:00.000Z',
    nullable: true,
  })
  lastLoginAt: string | null;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2023-01-15T04:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last profile update timestamp',
    example: '2023-10-15T04:00:00.000Z',
  })
  updatedAt: string;
}
