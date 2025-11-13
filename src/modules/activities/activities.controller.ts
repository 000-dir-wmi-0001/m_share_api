import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';

@ApiTags('activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get('users/:userId')
  @ApiOperation({
    summary: 'Get user activities',
    description: 'Retrieve activity history for a specific user',
  })
  @ApiParam({
    name: 'userId',
    required: true,
    type: String,
    description: 'User ID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of activities per page (default: 50)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of activities to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'User activities retrieved',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserActivities(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.activitiesService.getUserActivities(userId, limit, offset);
  }

  @Get('projects/:projectId')
  @ApiOperation({
    summary: 'Get project activities',
    description: 'Retrieve activity history for a project',
  })
  @ApiParam({
    name: 'projectId',
    required: true,
    type: String,
    description: 'Project ID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of activities per page (default: 50)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of activities to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Project activities retrieved',
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProjectActivities(
    @Param('projectId') projectId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.activitiesService.getProjectActivities(projectId, limit, offset);
  }
}
