import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Incident } from '@rapid-response/db/entity/incident.entity';
import { Repository } from 'typeorm';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { RedisService } from '../redis/redis.service';
import { Point } from 'geojson';

@Injectable()
export class IncidentService {
  constructor(
    @InjectRepository(Incident) private readonly repo: Repository<Incident>,
    private readonly redis: RedisService,
  ) {}

  async create(dto: CreateIncidentDto, reporterId: string) {
    const point: Point = {
      type: 'Point',
      coordinates: [dto.lng, dto.lat],
    };
    const incident = this.repo.create({
      ...dto,
      location: point,
      reportedBy: { id: reporterId } as any, // only id needed for relation
    });
    await this.repo.save(incident);
    await this.redis.publish(
      'incidents',
      JSON.stringify({ type: 'created', incident }),
    );
    return incident;
  }

  async findAll() {
    return this.repo.find();
  }

  async findWithinBBox(
    minLng: number,
    minLat: number,
    maxLng: number,
    maxLat: number,
  ) {
    return this.repo
      .createQueryBuilder('i')
      .where(
        `ST_Intersects(i.location, ST_MakeEnvelope(:minLng,:minLat,:maxLng,:maxLat,4326))`,
        { minLng, minLat, maxLng, maxLat },
      )
      .getMany();
  }

  async findById(id: string) {
    return this.repo.findOneOrFail({ where: { id } });
  }

  async updateStatus(id: string, status: string) {
    await this.repo.update(id, { status });
    const incident = await this.findById(id);
    await this.redis.publish(
      'incidents',
      JSON.stringify({ type: 'status-updated', incident }),
    );
    return incident;
  }
}
