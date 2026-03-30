import * as dotenv from 'dotenv';
dotenv.config();

import { scheduler } from './scheduler';
import { RedisService } from './redis.service';

// Initialise Redis once – the service is a thin wrapper around ioredis
const redis = new RedisService({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
});

scheduler(redis);
