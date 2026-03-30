import {
  WebSocketGateway,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({
  namespace: '/crisis',
  cors: { origin: '*' },
})
export class CrisisGateway implements OnGatewayInit {
  private server!: Server;

  constructor(private readonly redis: RedisService) {}

  afterInit(server: Server) {
    this.server = server;
    this.redis.subscribe('incidents', (msg) => {
      const payload = JSON.parse(msg);
      if (payload.type === 'created') {
        this.server.emit('incident.created', {
          incident: payload.incident,
        });
      } else if (payload.type === 'status-updated') {
        this.server.emit('incident.status', {
          incident: payload.incident,
        });
      }
    });
  }
}
