import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get user analytics',
    description: 'Retrieve analytics data for a specific user',
  })
  @ApiParam({
    name: 'userId',
    required: true,
    type: String,
    description: 'User ID',
  })
  @ApiResponse({
    status: 200,
    description: 'User analytics retrieved',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserAnalytics(@Param('userId') userId: string) {
    return this.analyticsService.getUserAnalytics(userId);
  }

  @Get('project/:projectId')
  @ApiOperation({
    summary: 'Get project analytics',
    description: 'Retrieve analytics data for a project',
  })
  @ApiParam({
    name: 'projectId',
    required: true,
    type: String,
    description: 'Project ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Project analytics retrieved',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProjectAnalytics(@Param('projectId') projectId: string) {
    return this.analyticsService.getProjectAnalytics(projectId);
  }
}
