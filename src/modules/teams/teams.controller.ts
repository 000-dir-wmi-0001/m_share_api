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
  UseGuards,
  Request,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto, TeamResponseDto } from '../../common/dtos';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createTeamDto: CreateTeamDto,
    @Request() req: any,
  ): Promise<TeamResponseDto> {
    return this.teamsService.create(createTeamDto, req.user?.id);
  }

  @Get()
  async findAll(
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ): Promise<{ data: TeamResponseDto[]; total: number }> {
    return this.teamsService.findAll(limit, offset);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TeamResponseDto> {
    return this.teamsService.findOne(id);
  }

  @Get(':id/stats')
  async getStats(@Param('id') id: string): Promise<{
    teamId: string;
    name: string;
    memberCount: number;
    projectCount: number;
    createdAt: Date;
    status: string;
  }> {
    return this.teamsService.getTeamStats(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @Request() req: any,
  ): Promise<TeamResponseDto> {
    return this.teamsService.update(id, updateTeamDto, req.user?.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.teamsService.remove(id, req.user?.id);
  }
}
