import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly client: Redis) {}

  async publish(channel: string, message: string) {
    await this.client.publish(channel, message);
  }

  async subscribe(channel: string, handler: (msg: string) => void) {
    const sub = this.client.duplicate();
    await sub.subscribe(channel);
    sub.on('message', (_chan, message) => {
      if (_chan === channel) handler(message);
    });
  }
}
