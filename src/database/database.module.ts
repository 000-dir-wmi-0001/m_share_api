import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User,
  Project,
  ProjectItem,
  Activity,
  Donation,
  Sponsorship,
} from '../common/entities';
import { getDatabaseConfig } from './config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Project,
      ProjectItem,
      Activity,
      Donation,
      Sponsorship,
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
