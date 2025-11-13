import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User,
  Project,
  ProjectItem,
  Activity,
  Donation,
  Sponsorship,
} from './entities';

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
  ],
  exports: [TypeOrmModule],
})
export class CommonModule {}
