import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Req,
} from '@nestjs/common';
import { IncidentService } from './incident.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Request } from 'express';

@Controller('incidents')
export class IncidentController {
  constructor(private readonly incidentSvc: IncidentService) {}

  @Post()
  async create(@Body() dto: CreateIncidentDto, @Req() req: Request) {
    const reporterId = (req.user as any).sub; // Auth0 sub
    return this.incidentSvc.create(dto, reporterId);
  }

  @Get()
  async findAll(@Query('bbox') bbox?: string) {
    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox
        .split(',')
        .map((v) => parseFloat(v));
      return this.incidentSvc.findWithinBBox(
        minLng,
        minLat,
        maxLng,
        maxLat,
      );
    }
    return this.incidentSvc.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.incidentSvc.findById(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.incidentSvc.updateStatus(id, dto.status);
  }
}
