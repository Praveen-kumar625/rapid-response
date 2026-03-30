import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as jwksClient from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private jwks = jwksClient({
    jwksUri: `${process.env.AUTH0_ISSUER}/.well-known/jwks.json`,
  });

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader) throw new UnauthorizedException('Missing token');

    const [, token] = authHeader.split(' ');
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new UnauthorizedException('Invalid token');
    }

    const key = await this.getSigningKey(decoded.header.kid);
    try {
      const payload = jwt.verify(token, key, {
        audience: process.env.AUTH0_AUDIENCE,
        issuer: process.env.AUTH0_ISSUER,
      });
      request.user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Token verification failed');
    }
  }

  private async getSigningKey(kid: string): Promise<string> {
    const key = await this.jwks.getSigningKey(kid);
    return key.getPublicKey();
  }
}
