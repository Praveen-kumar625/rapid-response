import { Module } from '@nestjs/common';
import { IncidentController } from './incident.controller';
import { IncidentService } from './incident.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Incident } from '@rapid-response/db/entity/incident.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [TypeOrmModule.forFeature([Incident])],
  controllers: [IncidentController],
  providers: [
    IncidentService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class IncidentModule {}
