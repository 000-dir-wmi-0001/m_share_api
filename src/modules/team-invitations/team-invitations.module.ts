import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamInvitation } from '../../common/entities';
import { TeamInvitationsService } from './team-invitations.service';
import { TeamInvitationsController } from './team-invitations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TeamInvitation])],
  providers: [TeamInvitationsService],
  controllers: [TeamInvitationsController],
  exports: [TeamInvitationsService],
})
export class TeamInvitationsModule {}
