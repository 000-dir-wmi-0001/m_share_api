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
  UploadedFile,
  UseGuards,
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
import { ProjectFilesService } from './project-files.service';
import { StorageService } from '../storage/storage.service';
import { ProjectFile } from '../../common/entities';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('project-files')
@Controller('projects/:projectId/files')
export class ProjectFilesController {
  constructor(
    private readonly projectFilesService: ProjectFilesService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload project file',
    description: 'Upload a file to a project',
  })
  @ApiParam({
    name: 'projectId',
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
          description: 'File to upload',
        },
        folder: {
          type: 'string',
          description: 'Folder path (optional)',
        },
        description: {
          type: 'string',
          description: 'File description (optional)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: ProjectFile,
  })
  @ApiResponse({ status: 400, description: 'No file uploaded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async uploadFile(
    @Param('projectId') projectId: string,
    @UploadedFile() file: any,
    @Body() body: { folder?: string; description?: string },
    @Request() req: any,
  ): Promise<ProjectFile> {
    if (!file) {
      throw new Error('No file uploaded');
    }

    // Upload to Backblaze B2
    const storageResult = await this.storageService.uploadFile(
      file,
      projectId,
      body.folder,
    );

    // Save file metadata to database
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.projectFilesService.uploadFile(
      projectId,
      req.user?.id,
      storageResult.fileName,
      storageResult.size,
      file.mimetype,
      storageResult.url,
      body.folder,
      body.description,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List project files',
    description: 'Retrieve all files in a project',
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
    description: 'Number of files per page (default: 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of files to skip (default: 0)',
  })
  @ApiQuery({
    name: 'folder',
    required: false,
    type: String,
    description: 'Filter by folder path (optional)',
  })
  @ApiResponse({
    status: 200,
    description: 'Project files retrieved',
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getFiles(
    @Param('projectId') projectId: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
    @Query('folder') folder?: string,
  ): Promise<{ data: ProjectFile[]; total: number }> {
    return this.projectFilesService.getProjectFiles(projectId, limit, offset, folder);
  }

  @Get(':fileId')
  @ApiOperation({
    summary: 'Get project file',
    description: 'Retrieve file details by ID',
  })
  @ApiParam({
    name: 'projectId',
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
    description: 'File retrieved successfully',
    type: ProjectFile,
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFile(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
  ): Promise<ProjectFile> {
    return this.projectFilesService.getFileById(projectId, fileId);
  }

  @Put(':fileId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Update file metadata',
    description: 'Update file name, description, or folder',
  })
  @ApiParam({
    name: 'projectId',
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
  @ApiBody({
    schema: {
      example: {
        name: 'updated-filename.pdf',
        description: 'Updated description',
        folder: '/documents',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File metadata updated',
    type: ProjectFile,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async updateFile(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @Body() body: { name?: string; description?: string; folder?: string },
    @Request() req: any,
  ): Promise<ProjectFile> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.projectFilesService.updateFileMetadata(projectId, fileId, req.user?.id, body);
  }

  @Delete(':fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Delete project file',
    description: 'Delete a file from the project',
  })
  @ApiParam({
    name: 'projectId',
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
    status: 204,
    description: 'File deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @Request() req: any,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.projectFilesService.deleteFile(projectId, fileId, req.user?.id);
  }

  @Get(':fileId/download')
  @ApiOperation({
    summary: 'Download project file',
    description: 'Get download URL for a file and increment download count',
  })
  @ApiParam({
    name: 'projectId',
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
    description: 'Download URL retrieved',
    schema: {
      example: {
        downloadUrl: 'https://storage.example.com/files/uuid/file.pdf',
        fileName: 'file.pdf',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadFile(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
  ): Promise<{ downloadUrl: string; fileName: string }> {
    const file = await this.projectFilesService.getFileById(projectId, fileId);
    await this.projectFilesService.incrementDownloadCount(projectId, fileId);
    return {
      downloadUrl: file.url,
      fileName: file.name,
    };
  }

  @Get(':fileId/versions')
  @ApiOperation({
    summary: 'Get file versions',
    description: 'Retrieve all versions of a file',
  })
  @ApiParam({
    name: 'projectId',
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
    description: 'File versions retrieved',
    schema: {
      example: {
        versions: [
          {
            versionId: 'uuid',
            versionNumber: 1,
            size: 1024,
            uploadedBy: 'uuid',
            uploadedAt: new Date(),
            changeNote: 'Initial upload',
          },
        ],
        total: 1,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getVersions(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
  ) {
    const versions = await this.projectFilesService.getFileVersions(projectId, fileId);
    return {
      versions: versions.map(v => ({
        versionId: v.id,
        versionNumber: v.version_number,
        size: v.size,
        uploadedBy: v.uploaded_by_id,
        uploadedAt: v.created_at,
        changeNote: v.change_note,
      })),
      total: versions.length,
    };
  }

  @Post(':fileId/versions/:versionId/restore')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Restore file version',
    description: 'Restore a previous version of a file',
  })
  @ApiParam({
    name: 'projectId',
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
  @ApiParam({
    name: 'versionId',
    required: true,
    type: String,
    description: 'Version ID to restore',
  })
  @ApiResponse({
    status: 200,
    description: 'File version restored',
    schema: {
      example: {
        fileId: 'uuid',
        currentVersionId: 2,
        restoredFromVersionId: 1,
        restoredAt: new Date(),
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'File or version not found' })
  async restoreVersion(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @Param('versionId') versionId: string,
    @Request() req: any,
  ): Promise<{ fileId: string; currentVersionId: number; restoredFromVersionId: number; restoredAt: Date }> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const updatedFile = await this.projectFilesService.restoreFileVersion(
      projectId,
      fileId,
      versionId,
      req.user?.id,
    );

    return {
      fileId: updatedFile.id,
      currentVersionId: updatedFile.version_number,
      restoredFromVersionId: 0, // TODO: Get actual version number
      restoredAt: new Date(),
    };
  }
}
