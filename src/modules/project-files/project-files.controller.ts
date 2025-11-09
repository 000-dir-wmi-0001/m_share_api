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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProjectFilesService } from './project-files.service';
import { ProjectFile } from '../../common/entities';

@Controller('projects/:projectId/files')
export class ProjectFilesController {
  constructor(private readonly projectFilesService: ProjectFilesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('projectId') projectId: string,
    @UploadedFile() file: any,
    @Body() body: { folder?: string; description?: string },
    @Request() req: any,
  ): Promise<ProjectFile> {
    if (!file) {
      throw new Error('No file uploaded');
    }

    // TODO: Upload to cloud storage (S3, Azure Blob, etc.)
    // For now, we'll use a placeholder URL
    const fileUrl = `https://storage.example.com/files/${projectId}/${file.originalname}`;

    return this.projectFilesService.uploadFile(
      projectId,
      req.user?.id,
      file.originalname,
      file.size,
      file.mimetype,
      fileUrl,
      body.folder,
      body.description,
    );
  }

  @Get()
  async getFiles(
    @Param('projectId') projectId: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
    @Query('folder') folder?: string,
  ): Promise<{ data: ProjectFile[]; total: number }> {
    return this.projectFilesService.getProjectFiles(projectId, limit, offset, folder);
  }

  @Get(':fileId')
  async getFile(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
  ): Promise<ProjectFile> {
    return this.projectFilesService.getFileById(projectId, fileId);
  }

  @Put(':fileId')
  async updateFile(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @Body() body: { name?: string; description?: string; folder?: string },
    @Request() req: any,
  ): Promise<ProjectFile> {
    return this.projectFilesService.updateFileMetadata(projectId, fileId, req.user?.id, body);
  }

  @Delete(':fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @Request() req: any,
  ): Promise<void> {
    return this.projectFilesService.deleteFile(projectId, fileId, req.user?.id);
  }

  @Get(':fileId/download')
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
  async restoreVersion(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @Param('versionId') versionId: string,
    @Request() req: any,
  ): Promise<{ fileId: string; currentVersionId: number; restoredFromVersionId: number; restoredAt: Date }> {
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
