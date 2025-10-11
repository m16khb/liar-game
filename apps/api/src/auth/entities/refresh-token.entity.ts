import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
// @CODE:AUTH-001:DATA

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column()
  userId: string;

  @Column()
  expiresAt: Date;
}
