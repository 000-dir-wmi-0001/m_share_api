import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get('users/:userId')
  async getUserActivities(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.activitiesService.getUserActivities(userId, limit, offset);
  }

  @Get('teams/:teamId')
  async getTeamActivities(
    @Param('teamId') teamId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.activitiesService.getTeamActivities(teamId, limit, offset);
  }

  @Get('projects/:projectId')
  async getProjectActivities(
    @Param('projectId') projectId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.activitiesService.getProjectActivities(projectId, limit, offset);
  }
}
