import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { Incident } from './incident.entity';
import { Point } from 'geojson';

@Entity({ name: 'resources' })
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: ['VEHICLE', 'SHELTER', 'MEDICAL', 'FOOD'],
  })
  type!: string;

  @Column({ nullable: true })
  capacity?: number;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  @Index({ spatial: true })
  location!: Point;

  @Column({
    type: 'enum',
    enum: ['AVAILABLE', 'ASSIGNED', 'UNAVAILABLE'],
    default: 'AVAILABLE',
  })
  status!: string;

  @ManyToOne(() => Incident, { nullable: true })
  currentIncident?: Incident;
}
