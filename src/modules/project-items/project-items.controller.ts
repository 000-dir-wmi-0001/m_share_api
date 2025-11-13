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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProjectItemsService } from './project-items.service';
import {
  CreateProjectItemDto,
  UpdateProjectItemDto,
  ProjectItemResponseDto,
} from '../../common/dtos';

@ApiTags('project-items')
@Controller('projects/:projectId/items')
export class ProjectItemsController {
  constructor(private readonly projectItemsService: ProjectItemsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create project item',
    description: 'Create a new item within a project',
  })
  @ApiParam({
    name: 'projectId',
    required: true,
    type: String,
    description: 'Project ID',
  })
  @ApiBody({ type: CreateProjectItemDto })
  @ApiResponse({
    status: 201,
    description: 'Project item created successfully',
    type: ProjectItemResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async create(
    @Param('projectId') projectId: string,
    @Body() createItemDto: CreateProjectItemDto,
  ): Promise<ProjectItemResponseDto> {
    return this.projectItemsService.create(projectId, createItemDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List project items',
    description: 'Retrieve all items in a project',
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
    description: 'Number of items per page (default: 50)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of items to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Project items retrieved',
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findByProject(
    @Param('projectId') projectId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.projectItemsService.findByProject(projectId, limit, offset);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get project item',
    description: 'Retrieve a specific project item by ID',
  })
  @ApiParam({
    name: 'projectId',
    required: true,
    type: String,
    description: 'Project ID',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Item ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Project item retrieved successfully',
    type: ProjectItemResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async findOne(@Param('id') id: string): Promise<ProjectItemResponseDto> {
    return this.projectItemsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update project item',
    description: 'Update a project item',
  })
  @ApiParam({
    name: 'projectId',
    required: true,
    type: String,
    description: 'Project ID',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Item ID',
  })
  @ApiBody({ type: UpdateProjectItemDto })
  @ApiResponse({
    status: 200,
    description: 'Project item updated successfully',
    type: ProjectItemResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateProjectItemDto,
  ): Promise<ProjectItemResponseDto> {
    return this.projectItemsService.update(id, updateItemDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete project item',
    description: 'Delete a project item',
  })
  @ApiParam({
    name: 'projectId',
    required: true,
    type: String,
    description: 'Project ID',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Item ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Project item deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.projectItemsService.remove(id);
  }
}
