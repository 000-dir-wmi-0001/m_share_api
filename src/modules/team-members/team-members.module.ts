import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamMember } from '../../common/entities';
import { TeamMembersService } from './team-members.service';
import { TeamMembersController } from './team-members.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TeamMember])],
  providers: [TeamMembersService],
  controllers: [TeamMembersController],
  exports: [TeamMembersService],
})
export class TeamMembersModule {}
