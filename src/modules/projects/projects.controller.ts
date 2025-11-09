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
  Request,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, ProjectResponseDto } from '../../common/dtos';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req: any,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.create(createProjectDto, req.user?.id);
  }

  @Get()
  async findAll(
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ) {
    return this.projectsService.findAll(limit, offset);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProjectResponseDto> {
    return this.projectsService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: any,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(id, updateProjectDto, req.user?.id);
  }

  @Post(':id/publish')
  async publish(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.publish(id, req.user?.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.projectsService.remove(id, req.user?.id);
  }

  @Post(':id/archive')
  async archive(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.archive(id, req.user?.id);
  }

  @Post(':id/restore')
  async restore(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.restore(id, req.user?.id);
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  async duplicate(
    @Param('id') id: string,
    @Body() body: { name: string; includeMembers?: boolean; includeFiles?: boolean },
    @Request() req: any,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.duplicate(
      id,
      req.user?.id,
      body.name,
      body.includeMembers,
      body.includeFiles,
    );
  }

  @Get(':id/stats')
  async getStats(
    @Param('id') id: string,
  ): Promise<{
    projectId: string;
    totalMembers: number;
    totalFiles: number;
    totalShares: number;
    totalComments: number;
    totalDownloads: number;
    createdAt: Date;
  }> {
    return this.projectsService.getStats(id);
  }
}
