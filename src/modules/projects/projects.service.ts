import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Project, ProjectItem } from '../../common/entities';
import { CreateProjectDto, UpdateProjectDto, ProjectResponseDto, ProjectTreeResponseDto, ProjectTreeNodeDto, UploadStatusDto } from '../../common/dtos';
import { ProjectStatus, FileType } from '../../common/enums';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import * as unzipper from 'unzipper';
import { StorageService } from '../storage/storage.service';

interface UploadProgress {
  projectId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  filesProcessed: number;
  totalFiles: number;
  foldersCreated: number;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

@Injectable()
export class ProjectsService {
  private uploadProgress = new Map<string, UploadProgress>();

  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(ProjectItem)
    private projectItemsRepository: Repository<ProjectItem>,
    private storageService: StorageService,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<ProjectResponseDto> {
    const { name, description, visibility, is_password_protected, password } = createProjectDto;

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    const project = this.projectsRepository.create({
      name,
      description,
      slug,
      owner_id: userId,
      visibility,
      status: ProjectStatus.DRAFT,
      is_password_protected,
      password_hash: is_password_protected && password ? await bcrypt.hash(password, 10) : null,
      member_count: 1,
      item_count: 0,
      storage_used: 0,
    });

    const savedProject = await this.projectsRepository.save(project);
    return this.formatProjectResponse(savedProject);
  }

  async findAll(limit: number = 10, offset: number = 0) {
    const [projects, total] = await this.projectsRepository.findAndCount({
      // where: { status: ProjectStatus.ACTIVE },
      take: limit,
      skip: offset,
      order: { created_at: 'DESC' },
    });

    return {
      data: projects.map(p => this.formatProjectResponse(p)),
      total,
    };
  }

  async findOne(id: string): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.formatProjectResponse(project);
  }

  async findBySlug(slug: string): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOne({
      where: { slug },
      relations: ['owner'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.formatProjectResponse(project);
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check ownership
    if (project.owner_id !== userId) {
      throw new ForbiddenException('Only project owner can update project');
    }

    Object.assign(project, updateProjectDto);
    const updatedProject = await this.projectsRepository.save(project);

    return this.formatProjectResponse(updatedProject);
  }

  async publish(id: string, userId: string): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.owner_id !== userId) {
      throw new ForbiddenException('Only project owner can publish project');
    }

    project.status = ProjectStatus.ACTIVE;
    const updatedProject = await this.projectsRepository.save(project);

    return this.formatProjectResponse(updatedProject);
  }

  async remove(id: string, userId: string): Promise<void> {
    const project = await this.projectsRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.owner_id !== userId) {
      throw new ForbiddenException('Only project owner can delete project');
    }

    await this.projectsRepository.remove(project);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.projectsRepository.increment({ id }, 'view_count', 1);
  }

  async archive(id: string, userId: string): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.owner_id !== userId) {
      throw new ForbiddenException('Only project owner can archive project');
    }

    project.status = ProjectStatus.ARCHIVED;
    project.metadata = {
      ...project.metadata,
      archivedAt: new Date(),
      archivedBy: userId,
    };
    const updatedProject = await this.projectsRepository.save(project);

    return this.formatProjectResponse(updatedProject);
  }

  async restore(id: string, userId: string): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.owner_id !== userId) {
      throw new ForbiddenException('Only project owner can restore project');
    }

    if (project.status !== ProjectStatus.ARCHIVED) {
      throw new BadRequestException('Project is not archived');
    }

    project.status = ProjectStatus.ACTIVE;
    project.metadata = {
      ...project.metadata,
      restoredAt: new Date(),
      restoredBy: userId,
    };
    const updatedProject = await this.projectsRepository.save(project);

    return this.formatProjectResponse(updatedProject);
  }

  async duplicate(
    id: string,
    userId: string,
    name: string,
    includeMembers: boolean = false,
    includeFiles: boolean = false,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectsRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Create slug from new name
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    const duplicatedProject = this.projectsRepository.create({
      name,
      description: project.description,
      slug,
      owner_id: userId,
      visibility: project.visibility,
      status: ProjectStatus.DRAFT,
      is_password_protected: false,
      member_count: 1,
      item_count: 0,
      storage_used: 0,
      metadata: {
        duplicatedFrom: id,
        duplicatedAt: new Date(),
        duplicatedBy: userId,
        includeMembers,
        includeFiles,
      },
    });

    const savedProject = await this.projectsRepository.save(duplicatedProject);

    // TODO: Copy files if includeFiles is true
    // TODO: Copy members if includeMembers is true

    return this.formatProjectResponse(savedProject);
  }

  async getStats(id: string): Promise<{
    projectId: string;
    totalMembers: number;
    totalFiles: number;
    totalShares: number;
    totalComments: number;
    totalDownloads: number;
    createdAt: Date;
  }> {
    const project = await this.projectsRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return {
      projectId: project.id,
      totalMembers: project.member_count,
      totalFiles: project.item_count,
      totalShares: project.share_count,
      totalComments: 0, // TODO: Fetch from comments table
      totalDownloads: 0, // TODO: Fetch from downloads table
      createdAt: project.created_at,
    };
  }

  // ============ FILE UPLOAD & TREE METHODS ============

  /**
   * Upload a ZIP file and build the project file tree
   */
  async uploadProjectFiles(
    projectId: string,
    userId: string,
    zipFile: any,
  ): Promise<{ message: string; uploadId: string }> {
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check ownership
    if (project.owner_id !== userId) {
      throw new ForbiddenException('Only project owner can upload files');
    }

    if (project.status === ProjectStatus.ARCHIVED) {
      throw new BadRequestException('Cannot upload to archived project');
    }

    // Initialize upload progress tracking
    const uploadProgress: UploadProgress = {
      projectId,
      status: 'PENDING',
      progress: 0,
      filesProcessed: 0,
      totalFiles: 0,
      foldersCreated: 0,
      startedAt: new Date(),
    };

    this.uploadProgress.set(projectId, uploadProgress);

    // Start async processing
    this.processProjectUpload(projectId, userId, zipFile, uploadProgress);

    return {
      message: 'Upload started. Processing in background.',
      uploadId: projectId,
    };
  }

  /**
   * Process upload asynchronously (handles both ZIP and individual files)
   */
  private async processProjectUpload(
    projectId: string,
    userId: string,
    file: any,
    uploadProgress: UploadProgress,
  ): Promise<void> {
    try {
      uploadProgress.status = 'PROCESSING';

      const isZip = file.originalname.toLowerCase().endsWith('.zip') || 
                    file.mimetype === 'application/zip';

      if (isZip) {
        // Handle ZIP file
        console.log('📦 Processing ZIP file...');
        const extractedPath = await this.extractZipFile(file);
        await this.buildTreeAndUploadFiles(projectId, extractedPath, null, uploadProgress);
        fs.rmSync(extractedPath, { recursive: true, force: true });
      } else {
        // Handle single file (any type)
        console.log(`📄 Processing single file: ${file.originalname}`);
        await this.uploadSingleFile(projectId, file, null, uploadProgress);
      }

      // Update project status to READY
      const project = await this.projectsRepository.findOne({ where: { id: projectId } });
      if (project) {
        project.status = ProjectStatus.READY;
        project.item_count = uploadProgress.filesProcessed + uploadProgress.foldersCreated;
        await this.projectsRepository.save(project);
      }

      uploadProgress.status = 'COMPLETED';
      uploadProgress.completedAt = new Date();
    } catch (error) {
      uploadProgress.status = 'FAILED';
      uploadProgress.error = (error as Error).message;
      uploadProgress.completedAt = new Date();

      // Update project status to FAILED
      const project = await this.projectsRepository.findOne({ where: { id: projectId } });
      if (project) {
        project.status = ProjectStatus.FAILED;
        project.metadata = {
          ...project.metadata,
          uploadError: (error as Error).message,
          failedAt: new Date(),
        };
        await this.projectsRepository.save(project);
      }
    }
  }

  /**
   * Upload a single file (non-ZIP) to the project
   */
  private async uploadSingleFile(
    projectId: string,
    file: any,
    parentId: string | null,
    uploadProgress: UploadProgress,
  ): Promise<void> {
    try {
      // Upload file to B2
      const uploadResult = await this.storageService.uploadFile(file, projectId, file.originalname);

      // Determine file type from extension
      const ext = path.extname(file.originalname).toLowerCase();
      let fileType = FileType.OTHER;
      
      if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.html', '.css', '.json', '.xml', '.yaml'].includes(ext)) {
        fileType = FileType.CODE;
      } else if (['.pdf', '.doc', '.docx', '.xlsx', '.txt', '.pptx'].includes(ext)) {
        fileType = FileType.DOCUMENT;
      } else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].includes(ext)) {
        fileType = FileType.IMAGE;
      } else if (['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv'].includes(ext)) {
        fileType = FileType.VIDEO;
      } else if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) {
        fileType = FileType.ARCHIVE;
      }

      // Create ProjectItem entry
      const projectItem = new ProjectItem();
      projectItem.project_id = projectId;
      if (parentId) {
        projectItem.parent_id = parentId;
      }
      projectItem.name = file.originalname;
      projectItem.is_folder = false;
      projectItem.file_type = fileType;
      projectItem.mime_type = file.mimetype || 'application/octet-stream';
      projectItem.size = file.size || file.buffer?.length || 0;
      projectItem.b2_file_id = uploadResult.fileId;
      projectItem.b2_url = uploadResult.url;
      projectItem.path = `/${file.originalname}`;

      await this.projectItemsRepository.save(projectItem);
      uploadProgress.filesProcessed++;

      console.log(`✅ File uploaded: ${file.originalname}`);
    } catch (error) {
      console.error(`❌ Failed to upload file ${file.originalname}:`, error);
      throw error;
    }
  }

  /**
   * Extract ZIP file to temporary directory
   */
  private async extractZipFile(zipFile: any): Promise<string> {
    const tempDir = path.join(process.env.TEMP || '/tmp', `project-${Date.now()}`);
    
    console.log(`📦 Extracting ZIP file to: ${tempDir}`);
    
    try {
      fs.mkdirSync(tempDir, { recursive: true });

      // Extract ZIP file using unzipper
      await new Promise<void>((resolve, reject) => {
        const buffer = zipFile.buffer || Buffer.from(zipFile);
        
        const readable = require('stream').Readable.from(buffer);
        
        readable
          .pipe(unzipper.Extract({ path: tempDir }))
          .on('error', (error: any) => {
            console.error('❌ Extraction error:', error);
            reject(error);
          })
          .on('close', () => {
            console.log(`✅ ZIP file extracted successfully`);
            resolve();
          });
      });

      return tempDir;
    } catch (error) {
      console.error('❌ ZIP extraction failed:', error);
      // Clean up on failure
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // ignore cleanup errors
      }
      throw new BadRequestException(`Failed to extract ZIP file: ${(error as Error).message}`);
    }
  }

  /**
   * Recursively build file tree and upload files to B2
   */
  private async buildTreeAndUploadFiles(
    projectId: string,
    basePath: string,
    parentId: string | null,
    uploadProgress: UploadProgress,
  ): Promise<void> {
    const entries = fs.readdirSync(basePath, { withFileTypes: true });
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException('Project not found during upload');
    }

    for (const entry of entries) {
      const fullPath = path.join(basePath, entry.name);
      const relativePath = path.relative(basePath, fullPath);

      if (entry.isDirectory()) {
        // Create folder node
        const folderItem = new ProjectItem();
        folderItem.project_id = projectId;
        folderItem.parent_id = parentId as any;
        folderItem.name = entry.name;
        folderItem.is_folder = true;
        folderItem.path = relativePath;
        folderItem.file_type = 'FOLDER' as any;
        folderItem.size = 0;
        folderItem.order = uploadProgress.foldersCreated;

        const savedFolder = await this.projectItemsRepository.save(folderItem);
        uploadProgress.foldersCreated++;

        // Recursively process subdirectory
        await this.buildTreeAndUploadFiles(projectId, fullPath, savedFolder.id, uploadProgress);
      } else {
        // Upload file to B2
        const fileBuffer = fs.readFileSync(fullPath);
        const uploadResult = await this.storageService.uploadFile(
          { buffer: fileBuffer, originalname: entry.name } as any,
          projectId,
          parentId ? `${parentId}/` : '',
        );

        // Create file node
        const fileItem = new ProjectItem();
        fileItem.project_id = projectId;
        fileItem.parent_id = parentId as any;
        fileItem.name = entry.name;
        fileItem.is_folder = false;
        fileItem.path = relativePath;
        fileItem.file_type = this.detectFileType(entry.name) as any;
        fileItem.mime_type = this.getMimeType(entry.name);
        fileItem.size = fileBuffer.length;
        fileItem.order = uploadProgress.filesProcessed;
        fileItem.b2_file_id = uploadResult.fileId;
        fileItem.b2_url = uploadResult.url;
        fileItem.checksum = this.calculateChecksum(fileBuffer);

        await this.projectItemsRepository.save(fileItem);
        uploadProgress.filesProcessed++;

        // Update project storage used
        project.storage_used += fileBuffer.length;
      }

      uploadProgress.progress = Math.round(
        ((uploadProgress.filesProcessed + uploadProgress.foldersCreated) / 
         (entries.length)) * 100,
      );
    }

    await this.projectsRepository.save(project);
  }

  /**
   * Get project file tree structure
   */
  async getProjectTree(projectId: string, depth: number = 10): Promise<ProjectTreeResponseDto> {
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Get root items (items without parent)
    const rootItems = await this.projectItemsRepository.find({
      where: { project_id: projectId, parent_id: IsNull() },
      order: { order: 'ASC' },
    });

    // Build tree recursively
    const rootChildren = await Promise.all(
      rootItems.map(item => this.buildTreeNode(item, depth - 1)),
    );

    // Create a virtual root node if multiple roots exist
    const root: ProjectTreeNodeDto =
      rootChildren.length === 1 && rootChildren[0].type === 'FOLDER'
        ? rootChildren[0]
        : {
            id: projectId,
            name: project.name,
            type: 'FOLDER',
            path: '/',
            size: 0,
            order: 0,
            children: rootChildren,
            created_at: project.created_at,
            updated_at: project.updated_at,
          };

    return {
      projectId,
      projectName: project.name,
      root,
      itemCount: project.item_count,
      storageUsed: project.storage_used,
    };
  }

  /**
   * Build a single tree node recursively
   */
  private async buildTreeNode(item: ProjectItem, depth: number): Promise<ProjectTreeNodeDto> {
    const node: ProjectTreeNodeDto = {
      id: item.id,
      name: item.name,
      type: item.is_folder ? 'FOLDER' : 'FILE',
      mime_type: item.mime_type,
      size: item.size,
      path: item.path,
      b2_url: item.b2_url,
      order: item.order,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };

    if (item.is_folder && depth > 0) {
      const children = await this.projectItemsRepository.find({
        where: { parent_id: item.id },
        order: { order: 'ASC' },
      });

      node.children = await Promise.all(
        children.map(child => this.buildTreeNode(child, depth - 1)),
      );
    }

    return node;
  }

  /**
   * Get folder children (immediate children only)
   */
  async getFolderChildren(projectId: string, folderId: string | null): Promise<ProjectTreeNodeDto[]> {
    const where: any = { project_id: projectId };
    if (folderId === null) {
      where.parent_id = IsNull();
    } else {
      where.parent_id = folderId;
    }

    const items = await this.projectItemsRepository.find({
      where,
      order: { order: 'ASC' },
    });

    return Promise.all(items.map(item => this.buildTreeNode(item, 0)));
  }

  /**
   * Get file content from B2 storage
   */
  async getFileContent(projectId: string, fileId: string): Promise<{ url: string; fileName: string }> {
    const item = await this.projectItemsRepository.findOne({
      where: { id: fileId, project_id: projectId },
    });

    if (!item) {
      throw new NotFoundException('File not found');
    }

    if (item.is_folder) {
      throw new BadRequestException('Cannot get content of folder');
    }

    if (!item.b2_url) {
      throw new BadRequestException('File not accessible');
    }

    return {
      url: item.b2_url,
      fileName: item.name,
    };
  }

  /**
   * Get upload status
   */
  async getUploadStatus(projectId: string): Promise<UploadStatusDto> {
    const progress = this.uploadProgress.get(projectId);

    if (!progress) {
      throw new NotFoundException('Upload not found or already completed');
    }

    return {
      projectId: progress.projectId,
      status: progress.status,
      progress: progress.progress,
      filesProcessed: progress.filesProcessed,
      totalFiles: progress.totalFiles,
      foldersCreated: progress.foldersCreated,
      error: progress.error,
      startedAt: progress.startedAt,
      completedAt: progress.completedAt,
    };
  }

  // ============ HELPER METHODS ============

  private detectFileType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const extensionMap = {
      '.js': 'CODE',
      '.ts': 'CODE',
      '.tsx': 'CODE',
      '.jsx': 'CODE',
      '.py': 'CODE',
      '.java': 'CODE',
      '.cpp': 'CODE',
      '.c': 'CODE',
      '.go': 'CODE',
      '.rs': 'CODE',
      '.pdf': 'DOCUMENT',
      '.docx': 'DOCUMENT',
      '.doc': 'DOCUMENT',
      '.xlsx': 'DOCUMENT',
      '.xls': 'DOCUMENT',
      '.pptx': 'DOCUMENT',
      '.ppt': 'DOCUMENT',
      '.txt': 'DOCUMENT',
      '.md': 'DOCUMENT',
      '.png': 'IMAGE',
      '.jpg': 'IMAGE',
      '.jpeg': 'IMAGE',
      '.gif': 'IMAGE',
      '.svg': 'IMAGE',
      '.webp': 'IMAGE',
      '.mp4': 'VIDEO',
      '.avi': 'VIDEO',
      '.mov': 'VIDEO',
      '.mkv': 'VIDEO',
      '.zip': 'ARCHIVE',
      '.rar': 'ARCHIVE',
      '.7z': 'ARCHIVE',
      '.tar': 'ARCHIVE',
      '.gz': 'ARCHIVE',
    };

    return extensionMap[ext] || 'OTHER';
  }

  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.html': 'text/html',
      '.xml': 'application/xml',
      '.json': 'application/json',
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.zip': 'application/zip',
    };

    return mimeMap[ext] || 'application/octet-stream';
  }

  private calculateChecksum(buffer: Buffer): string {
    // Simple checksum - in production use crypto.createHash
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private formatProjectResponse(project: Project): ProjectResponseDto {
    return project as ProjectResponseDto;
  }
}

