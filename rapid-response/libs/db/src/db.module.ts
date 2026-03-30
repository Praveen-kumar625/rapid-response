import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Incident } from './entity/incident.entity';
import { Resource } from './entity/resource.entity';
import { Media } from './entity/media.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [User, Incident, Resource, Media],
      synchronize: false, // use migrations in prod
      migrationsRun: true,
      logging: true,
    }),
    TypeOrmModule.forFeature([User, Incident, Resource, Media]),
  ],
  exports: [TypeOrmModule],
})
export class DbModule {}
