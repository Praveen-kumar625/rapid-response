import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ type: 'enum', enum: ['CITIZEN', 'RESPONDER', 'ADMIN'] })
  role!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
