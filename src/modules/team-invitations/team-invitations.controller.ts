import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TeamInvitationsService } from './team-invitations.service';

@Controller('teams/:teamId/invitations')
export class TeamInvitationsController {
  constructor(private readonly teamInvitationsService: TeamInvitationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createInvitation(
    @Param('teamId') teamId: string,
    @Body() inviteDto: any,
  ) {
    return this.teamInvitationsService.createInvitation({
      ...inviteDto,
      team_id: teamId,
    });
  }

  @Get()
  async findTeamInvitations(
    @Param('teamId') teamId: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    return this.teamInvitationsService.findTeamInvitations(teamId, limit, offset);
  }

  @Post('accept/:token')
  async acceptInvitation(
    @Param('token') token: string,
  ) {
    return this.teamInvitationsService.acceptInvitation(token, '');
  }

  @Post('reject/:token')
  async rejectInvitation(
    @Param('token') token: string,
  ) {
    return this.teamInvitationsService.rejectInvitation(token);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.teamInvitationsService.remove(id);
  }
}
