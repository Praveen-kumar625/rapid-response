import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      // Auth0 JWKS will be fetched at runtime in the guard
      secretOrKeyProvider: async () => 'placeholder', // guard overrides it
    }),
  ],
  providers: [JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
