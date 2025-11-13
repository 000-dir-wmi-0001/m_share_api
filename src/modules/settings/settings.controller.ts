import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('user')
  @ApiOperation({
    summary: 'Get user settings',
    description: 'Retrieve settings for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User settings retrieved',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserSettings(@Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req.user as { sub: string }).sub;
    return this.settingsService.getUserSettings(userId);
  }

  @Put('user')
  @ApiOperation({
    summary: 'Update user settings',
    description: 'Update settings for the authenticated user',
  })
  @ApiBody({
    schema: {
      example: {
        theme: 'dark',
        language: 'en',
        notifications_enabled: true,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User settings updated',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateUserSettings(@Request() req: any, @Body() updateData: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req.user as { sub: string }).sub;
    return this.settingsService.updateUserSettings(userId, updateData);
  }
}
