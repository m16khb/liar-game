import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
// @CODE:AUTH-001:DATA

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;
}
