import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Project, ProjectFile, Team, TeamMember, Activity } from '../../common/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectFile, Team, TeamMember, Activity])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
