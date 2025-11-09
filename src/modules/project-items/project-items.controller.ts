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
import { ProjectItemsService } from './project-items.service';
import { CreateProjectItemDto, UpdateProjectItemDto, ProjectItemResponseDto } from '../../common/dtos';

@Controller('projects/:projectId/items')
export class ProjectItemsController {
  constructor(private readonly projectItemsService: ProjectItemsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('projectId') projectId: string,
    @Body() createItemDto: CreateProjectItemDto,
  ): Promise<ProjectItemResponseDto> {
    return this.projectItemsService.create(projectId, createItemDto);
  }

  @Get()
  async findByProject(
    @Param('projectId') projectId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.projectItemsService.findByProject(projectId, limit, offset);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProjectItemResponseDto> {
    return this.projectItemsService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateProjectItemDto,
  ): Promise<ProjectItemResponseDto> {
    return this.projectItemsService.update(id, updateItemDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.projectItemsService.remove(id);
  }
}
