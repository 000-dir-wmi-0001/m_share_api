import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectFile, FileVersion } from '../../common/entities';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ProjectFilesService {
  constructor(
    @InjectRepository(ProjectFile)
    private filesRepository: Repository<ProjectFile>,
    @InjectRepository(FileVersion)
    private versionsRepository: Repository<FileVersion>,
    private storageService: StorageService,
  ) {}

  async uploadFile(
    projectId: string,
    userId: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    fileUrl: string,
    folder?: string,
    description?: string,
  ): Promise<ProjectFile> {
    const extension = fileName.split('.').pop() || '';

    const projectFile = new ProjectFile();
    projectFile.project_id = projectId;
    projectFile.uploaded_by_id = userId;
    projectFile.name = fileName;
    projectFile.size = fileSize;
    projectFile.mime_type = mimeType;
    projectFile.file_extension = extension;
    projectFile.url = fileUrl;
    projectFile.folder = folder || '';
    projectFile.description = description || '';
    projectFile.version_number = 1;
    projectFile.is_latest_version = true;
    projectFile.download_count = 0;

    const savedFile = await this.filesRepository.save(projectFile);

    // Create initial version
    const version = new FileVersion();
    version.file_id = savedFile.id;
    version.uploaded_by_id = userId;
    version.version_number = 1;
    version.size = fileSize;
    version.url = fileUrl;
    version.change_note = 'Initial upload';

    await this.versionsRepository.save(version);

    return savedFile;
  }

  async getProjectFiles(
    projectId: string,
    limit: number = 20,
    offset: number = 0,
    folder?: string,
  ): Promise<{ data: ProjectFile[]; total: number }> {
    let query = this.filesRepository.createQueryBuilder('file')
      .where('file.project_id = :projectId', { projectId })
      .orderBy('file.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    if (folder) {
      query = query.andWhere('file.folder = :folder', { folder });
    }

    const [files, total] = await query.getManyAndCount();
    return { data: files, total };
  }

  async getFileById(projectId: string, fileId: string): Promise<ProjectFile> {
    const file = await this.filesRepository.findOne({
      where: { id: fileId, project_id: projectId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async updateFileMetadata(
    projectId: string,
    fileId: string,
    userId: string,
    updates: { name?: string; description?: string; folder?: string },
  ): Promise<ProjectFile> {
    const file = await this.getFileById(projectId, fileId);

    if (file.uploaded_by_id !== userId) {
      throw new ForbiddenException('Only file uploader can update file metadata');
    }

    Object.assign(file, updates);
    return this.filesRepository.save(file);
  }

  async deleteFile(projectId: string, fileId: string, userId: string): Promise<void> {
    const file = await this.getFileById(projectId, fileId);

    if (file.uploaded_by_id !== userId) {
      throw new ForbiddenException('Only file uploader can delete file');
    }

    await this.filesRepository.remove(file);
  }

  async incrementDownloadCount(projectId: string, fileId: string): Promise<void> {
    const file = await this.getFileById(projectId, fileId);
    file.download_count += 1;
    await this.filesRepository.save(file);
  }

  async getFileVersions(
    projectId: string,
    fileId: string,
  ): Promise<FileVersion[]> {
    const file = await this.getFileById(projectId, fileId);

    const versions = await this.versionsRepository.find({
      where: { file_id: file.id },
      order: { version_number: 'DESC' },
    });

    return versions;
  }

  async restoreFileVersion(
    projectId: string,
    fileId: string,
    versionId: string,
    userId: string,
  ): Promise<ProjectFile> {
    const file = await this.getFileById(projectId, fileId);

    if (file.uploaded_by_id !== userId) {
      throw new ForbiddenException('Only file uploader can restore versions');
    }

    const version = await this.versionsRepository.findOne({
      where: { id: versionId, file_id: file.id },
    });

    if (!version) {
      throw new NotFoundException('File version not found');
    }

    // Create new version from restored version
    const newVersionNumber = file.version_number + 1;
    file.version_number = newVersionNumber;
    file.url = version.url;
    file.size = version.size;

    const updatedFile = await this.filesRepository.save(file);

    // Create new version record
    await this.versionsRepository.save({
      file_id: file.id,
      uploaded_by_id: userId,
      version_number: newVersionNumber,
      size: version.size,
      url: version.url,
      change_note: `Restored from version ${version.version_number}`,
    });

    return updatedFile;
  }

  async uploadNewFileVersion(
    projectId: string,
    fileId: string,
    userId: string,
    fileSize: number,
    mimeType: string,
    fileUrl: string,
    changeNote?: string,
  ): Promise<ProjectFile> {
    const file = await this.getFileById(projectId, fileId);

    if (file.uploaded_by_id !== userId) {
      throw new ForbiddenException('Only file uploader can upload new versions');
    }

    // Update file with new version
    const newVersionNumber = file.version_number + 1;
    file.version_number = newVersionNumber;
    file.url = fileUrl;
    file.size = fileSize;
    file.mime_type = mimeType;

    const updatedFile = await this.filesRepository.save(file);

    // Create new version record
    await this.versionsRepository.save({
      file_id: file.id,
      uploaded_by_id: userId,
      version_number: newVersionNumber,
      size: fileSize,
      url: fileUrl,
      change_note: changeNote || 'New version',
    });

    return updatedFile;
  }
}
