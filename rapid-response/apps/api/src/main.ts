import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
import * as compression from 'compression';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.use(compression());
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 API listening on ${port}`);
}
bootstrap();
