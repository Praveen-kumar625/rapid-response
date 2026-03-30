import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Incident } from './incident.entity';

@Entity({ name: 'media' })
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Incident, (incident) => incident.id, { onDelete: 'CASCADE' })
  incident!: Incident;

  @Column()
  url!: string;

  @Column()
  mimeType!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
