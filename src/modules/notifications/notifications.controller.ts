import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user notifications',
    description: 'Retrieve all notifications for the authenticated user',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of notifications per page (default: 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of notifications to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'User notifications retrieved',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserNotifications(
    @Request() req: any,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req.user as { sub: string }).sub;
    return this.notificationsService.getUserNotifications(userId, limit, offset);
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Get unread notification count',
    description: 'Retrieve the count of unread notifications',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved',
    schema: {
      example: {
        unread_count: 5,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(@Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req.user as { sub: string }).sub;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { unread_count: count };
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a specific notification as read',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Notification ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Put('mark-all-read/batch')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all unread notifications as read for the authenticated user',
  })
  @ApiResponse({
    status: 204,
    description: 'All notifications marked as read',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(@Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req.user as { sub: string }).sub;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete notification',
    description: 'Delete a specific notification',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Notification ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Notification deleted',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async deleteNotification(@Param('id') id: string) {
    return this.notificationsService.deleteNotification(id);
  }

  @Put(':id/archive')
  @ApiOperation({
    summary: 'Archive notification',
    description: 'Archive a notification for later reference',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Notification ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification archived',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async archiveNotification(@Param('id') id: string) {
    return this.notificationsService.archiveNotification(id);
  }
}
