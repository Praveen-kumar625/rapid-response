import Redis from 'ioredis';

export interface RedisOpts {
  host: string;
  port: number;
}

export class RedisService {
  private client: Redis.Redis;
  constructor(opts: RedisOpts) {
    this.client = new Redis(opts);
  }

  async publish(channel: string, message: string) {
    await this.client.publish(channel, message);
  }
}
