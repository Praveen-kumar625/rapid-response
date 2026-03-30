import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import * as Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        });
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
