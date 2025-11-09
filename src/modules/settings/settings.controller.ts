import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('user')
  async getUserSettings(@Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req.user as { sub: string }).sub;
    return this.settingsService.getUserSettings(userId);
  }

  @Put('user')
  async updateUserSettings(@Request() req: any, @Body() updateData: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = (req.user as { sub: string }).sub;
    return this.settingsService.updateUserSettings(userId, updateData);
  }

  @Get('team/:teamId')
  async getTeamSettings(@Param('teamId') teamId: string) {
    return this.settingsService.getTeamSettings(teamId);
  }

  @Put('team/:teamId')
  async updateTeamSettings(
    @Param('teamId') teamId: string,
    @Body() updateData: any,
  ) {
    return this.settingsService.updateTeamSettings(teamId, updateData);
  }
}
