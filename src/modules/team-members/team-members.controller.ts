import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TeamMembersService } from './team-members.service';
import { AddTeamMemberDto, UpdateTeamMemberDto, TeamMemberResponseDto } from '../../common/dtos';

@Controller('teams/:teamId/members')
export class TeamMembersController {
  constructor(private readonly teamMembersService: TeamMembersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @Param('teamId') teamId: string,
    @Body() addMemberDto: AddTeamMemberDto,
  ): Promise<TeamMemberResponseDto> {
    return this.teamMembersService.addMember(teamId, addMemberDto, '');
  }

  @Get()
  async findTeamMembers(
    @Param('teamId') teamId: string,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ) {
    return this.teamMembersService.findTeamMembers(teamId, limit, offset);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TeamMemberResponseDto> {
    return this.teamMembersService.findOne(id);
  }

  @Put(':id')
  async updateRole(
    @Param('id') id: string,
    @Body() updateDto: UpdateTeamMemberDto,
  ): Promise<TeamMemberResponseDto> {
    return this.teamMembersService.updateRole(id, updateDto, '');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(@Param('id') id: string): Promise<void> {
    return this.teamMembersService.removeMember(id, '');
  }

  @Post('leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leaveTeam(
    @Param('teamId') teamId: string,
    @Body() body: { userId: string },
  ): Promise<void> {
    return this.teamMembersService.leaveteam(teamId, body.userId);
  }
}
