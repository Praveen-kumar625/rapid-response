import { Module } from '@nestjs/common';
import { IncidentModule } from './incident/incident.module';
import { AuthModule } from './auth/auth.module';
import { CrisisGateway } from './socket/crisis.gateway';
import { RedisModule } from './redis/redis.module';
import { DbModule } from '@rapid-response/db';

@Module({
  imports: [
    DbModule,
    AuthModule,
    IncidentModule,
    RedisModule,
  ],
  providers: [CrisisGateway],
})
export class AppModule {}
