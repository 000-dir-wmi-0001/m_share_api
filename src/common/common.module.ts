import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User,
  Team,
  TeamMember,
  TeamInvitation,
  Project,
  ProjectItem,
  ProjectAccess,
  Activity,
  Donation,
  Sponsorship,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Team,
      TeamMember,
      TeamInvitation,
      Project,
      ProjectItem,
      ProjectAccess,
      Activity,
      Donation,
      Sponsorship,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class CommonModule {}
