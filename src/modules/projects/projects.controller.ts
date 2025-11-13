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
  UseInterceptors,
  UseGuards,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectResponseDto,
  ProjectTreeResponseDto,
  UploadStatusDto,
} from '../../common/dtos';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Create a new project',
    description: 'Create a new project within a team',
  })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({
    status: 201,
    description: 'Project created successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req: any,
  ): Promise<ProjectResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.projectsService.create(createProjectDto, req.user.userId);
  }

  @Get()
  @ApiOperation({
    summary: 'List all projects',
    description: 'Retrieve a paginated list of all projects',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of projects per page (default: 10)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of projects to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Projects list retrieved',
    schema: {
      example: {
        data: [],
        total: 0,
      },
    },
  })
  async findAll(
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ) {
    return this.projectsService.findAll(limit, offset);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get project by ID',
    description: 'Retrieve a specific project by its ID',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Project ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Project retrieved successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@Param('id') id: string): Promise<ProjectResponseDto> {
    return this.projectsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Update project',
    description: 'Update a project (requires ownership or admin rights)',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Project ID',
  })
  @ApiBody({ type: UpdateProjectDto })
  @ApiResponse({
    status: 200,
    description: 'Project updated successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: any,
  ): Promise<ProjectResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.projectsService.update(id, updateProjectDto, req.user.userId);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Publish project',
    description: 'Publish a project to make it visible to others',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Project ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Project published successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async publish(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ProjectResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.projectsService.publish(id, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Delete project',
    description: 'Delete a project (requires ownership)',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Project ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Project deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.projectsService.remove(id, req.user.userId);
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Archive project',
    description: 'Archive a project (soft delete)',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Project ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Project archived successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async archive(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ProjectResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.projectsService.archive(id, req.user.id);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Restore project',
    description: 'Restore an archived project',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Project ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Project restored successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async restore(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ProjectResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.projectsService.restore(id, req.user.id);
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Duplicate project',
    description: 'Create a copy of an existing project',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Project ID to duplicate',
  })
  @ApiBody({
    schema: {
      example: {
        name: 'Project Copy',
        includeMembers: true,
        includeFiles: true,
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Project duplicated successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async duplicate(
    @Param('id') id: string,
    @Body() body: { name: string; includeMembers?: boolean; includeFiles?: boolean },
    @Request() req: any,
  ): Promise<ProjectResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.projectsService.duplicate(
      id,
      req.user?.id,
      body.name,
      body.includeMembers,
      body.includeFiles,
    );
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Get project statistics',
    description: 'Retrieve project statistics including members, files, and shares',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Project ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Project statistics retrieved',
    schema: {
      example: {
        projectId: 'uuid',
        totalMembers: 5,
        totalFiles: 10,
        totalShares: 3,
        totalComments: 15,
        totalDownloads: 25,
        createdAt: new Date(),
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
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

  // ============ FILE UPLOAD & TREE ENDPOINTS ============

  @Post(':id/upload')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload ZIP file to project',
    description:
      'Upload a ZIP file containing project files. Files are extracted and uploaded to B2 storage asynchronously.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Project ID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'ZIP file to upload',
        },
      },
    },
  })
  @ApiResponse({
    status: 202,
    description: 'Upload started',
    schema: {
      example: {
        message: 'Upload started. Processing in background.',
        uploadId: 'project-uuid',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file or project status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not project owner' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async uploadProjectFiles(
    @Param('id') projectId: string,
    @UploadedFile() file: any,
    @Request() req: any,
  ): Promise<{ message: string; uploadId: string }> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.projectsService.uploadProjectFiles(projectId, req.user.userId, file);
  }

  @Get(':id/upload-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Get upload status',
    description: 'Check the current status of a file upload operation',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Project ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Upload status retrieved',
    type: UploadStatusDto,
  })
  @ApiResponse({ status: 404, description: 'Upload not found' })
  async getUploadStatus(@Param('id') projectId: string): Promise<UploadStatusDto> {
    return this.projectsService.getUploadStatus(projectId);
  }

  @Get(':id/tree')
  @ApiOperation({
    summary: 'Get project file tree',
    description: 'Retrieve the hierarchical file structure of a project',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Project ID',
  })
  @ApiQuery({
    name: 'depth',
    required: false,
    type: Number,
    description: 'Maximum depth of tree traversal (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'File tree retrieved',
    type: ProjectTreeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProjectTree(
    @Param('id') projectId: string,
    @Query('depth') depth: number = 10,
  ): Promise<ProjectTreeResponseDto> {
    return this.projectsService.getProjectTree(projectId, depth);
  }

  @Get(':id/folders/:folderId/children')
  @ApiOperation({
    summary: 'Get folder children',
    description: 'List immediate children (files and folders) of a specific folder',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Project ID',
  })
  @ApiParam({
    name: 'folderId',
    required: true,
    type: String,
    description: 'Folder ID (use "root" for project root)',
  })
  @ApiResponse({
    status: 200,
    description: 'Folder children retrieved',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['FILE', 'FOLDER'] },
          size: { type: 'number' },
          path: { type: 'string' },
          order: { type: 'number' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Project or folder not found' })
  async getFolderChildren(
    @Param('id') projectId: string,
    @Param('folderId') folderId: string,
  ) {
    const parentId = folderId === 'root' ? null : folderId;
    return this.projectsService.getFolderChildren(projectId, parentId);
  }

  @Get(':id/files/:fileId/content')
  @ApiOperation({
    summary: 'Get file content URL',
    description: 'Get the downloadable/viewable URL for a file stored in B2',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Project ID',
  })
  @ApiParam({
    name: 'fileId',
    required: true,
    type: String,
    description: 'File ID',
  })
  @ApiResponse({
    status: 200,
    description: 'File URL retrieved',
    schema: {
      example: {
        url: 'https://s3.us-east-005.backblazeb2.com/...',
        fileName: 'document.pdf',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Not a file or file not accessible' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFileContent(
    @Param('id') projectId: string,
    @Param('fileId') fileId: string,
  ): Promise<{ url: string; fileName: string }> {
    return this.projectsService.getFileContent(projectId, fileId);
  }
}

