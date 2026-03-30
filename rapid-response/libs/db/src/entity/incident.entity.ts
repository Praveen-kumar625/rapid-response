import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Point } from 'geojson';

@Entity({ name: 'incidents' })
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int' })
  severity!: number; // 1‑5

  @Column()
  category!: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  @Index({ spatial: true })
  location!: Point; // GeoJSON Point

  @ManyToOne(() => User, { nullable: false })
  reportedBy!: User;

  @Column({
    type: 'enum',
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    default: 'OPEN',
  })
  status!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ nullable: true })
  externalId?: string; // source‑specific id for deduplication
}
