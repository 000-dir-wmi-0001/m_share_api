# Project Upload Implementation - Technical Deep Dive

**Status:** Implementation Ready  
**Updated:** November 2024

---

## Table of Contents

1. [Backend Implementation (NestJS)](#backend-implementation-nestjs)
2. [Frontend Implementation (Next.js)](#frontend-implementation-nextjs)
3. [API Flow Diagram](#api-flow-diagram)
4. [State Management](#state-management)
5. [WebSocket Integration](#websocket-integration)
6. [Testing Strategy](#testing-strategy)
7. [Troubleshooting](#troubleshooting)

---

## Backend Implementation (NestJS)

### Project Service

```typescript
// projects/projects.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { B2Service } from '@/storage/b2.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import * as archiver from 'archiver';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private b2Service: B2Service,
  ) {}

  /**
   * Create a new project
   */
  async createProject(userId: string, dto: CreateProjectDto) {
    const projectId = `proj-${uuidv4().slice(0, 12)}`;

    const project = await this.prisma.projects.create({
      data: {
        id: projectId,
        owner_id: userId,
        name: dto.name,
        description: dto.description || null,
        slug: this.generateSlug(dto.name),
        status: 'DRAFT',
        visibility: dto.visibility || 'PRIVATE',
        is_password_protected: dto.is_password_protected || false,
        password_hash: dto.password
          ? await this.hashPassword(dto.password)
          : null,
        item_count: 0,
        storage_used: 0,
      },
    });

    // Create root node
    await this.prisma.nodes.create({
      data: {
        id: `node-root-${projectId}`,
        project_id: projectId,
        parent_id: null,
        name: projectId,
        type: 'FOLDER',
        path: '/',
        size: 0,
      },
    });

    return project;
  }

  /**
   * Upload and process ZIP file
   */
  async uploadProjectFiles(
    projectId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    // Verify ownership
    const project = await this.prisma.projects.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.owner_id !== userId) {
      throw new BadRequestException('Not authorized');
    }

    // Validate ZIP
    if (!this.isValidZipFile(file)) {
      throw new BadRequestException('Invalid ZIP file format');
    }

    // Start async processing
    this.processZipFile(projectId, file)
      .then(() => {
        // Update project status
        this.prisma.projects.update({
          where: { id: projectId },
          data: { status: 'READY' },
        });
      })
      .catch((error) => {
        console.error(`Error processing project ${projectId}:`, error);
        // Update project status to FAILED
        this.prisma.projects.update({
          where: { id: projectId },
          data: { status: 'FAILED' },
        });
      });

    return {
      projectId,
      uploadStatus: 'PROCESSING',
      message: 'Upload received. Processing files...',
    };
  }

  /**
   * Process ZIP file asynchronously
   */
  private async processZipFile(
    projectId: string,
    file: Express.Multer.File,
  ): Promise<void> {
    const extractDir = `/tmp/uploads/${projectId}`;
    const rootNode = await this.prisma.nodes.findFirst({
      where: { project_id: projectId, parent_id: null },
    });

    try {
      // Create extraction directory
      await fs.mkdir(extractDir, { recursive: true });

      // Extract ZIP
      await this.extractZip(file.path, extractDir);

      // Build file tree and upload files
      await this.buildTreeAndUpload(
        projectId,
        extractDir,
        rootNode.id,
      );

      // Update project stats
      const stats = await this.calculateProjectStats(projectId);
      await this.prisma.projects.update({
        where: { id: projectId },
        data: {
          item_count: stats.itemCount,
          storage_used: stats.storageUsed,
        },
      });

      // Log activity
      await this.logActivity(projectId, 'PROJECT_UPLOADED', 'Files uploaded successfully');

      // Cleanup
      await fs.rm(extractDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to process ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Extract ZIP file
   */
  private async extractZip(
    zipPath: string,
    targetDir: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const AdmZip = require('adm-zip');
      try {
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(targetDir, true);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Build file tree and upload files to B2
   */
  private async buildTreeAndUpload(
    projectId: string,
    basePath: string,
    parentNodeId: string,
  ): Promise<void> {
    const entries = await fs.readdir(basePath, { withFileTypes: true });
    const nodesToCreate = [];

    for (const entry of entries) {
      const fullPath = path.join(basePath, entry.name);
      const relativePath = path.relative(basePath, fullPath);
      const nodeId = `node-${uuidv4().slice(0, 12)}`;

      if (entry.isDirectory()) {
        // Create folder node
        nodesToCreate.push({
          id: nodeId,
          project_id: projectId,
          parent_id: parentNodeId,
          name: entry.name,
          type: 'FOLDER',
          path: relativePath,
          size: 0,
        });

        // Recursively process subdirectory
        await this.buildTreeAndUpload(
          projectId,
          fullPath,
          nodeId,
        );
      } else {
        // Upload file to B2
        const fileStats = await fs.stat(fullPath);
        const b2Response = await this.b2Service.uploadFile(
          fullPath,
          `${projectId}/${relativePath}`,
        );

        // Create file node
        nodesToCreate.push({
          id: nodeId,
          project_id: projectId,
          parent_id: parentNodeId,
          name: entry.name,
          type: 'FILE',
          mime_type: this.getMimeType(entry.name),
          path: relativePath,
          size: fileStats.size,
          b2_file_id: b2Response.fileId,
          b2_url: b2Response.downloadUrl,
          checksum: b2Response.contentSha1,
        });
      }
    }

    // Batch insert nodes
    if (nodesToCreate.length > 0) {
      await this.prisma.nodes.createMany({
        data: nodesToCreate,
      });
    }
  }

  /**
   * Get file tree
   */
  async getProjectTree(projectId: string) {
    const rootNode = await this.prisma.nodes.findFirst({
      where: { project_id: projectId, parent_id: null },
    });

    if (!rootNode) {
      throw new NotFoundException('Project tree not found');
    }

    const tree = await this.buildTree(rootNode.id);

    const stats = await this.calculateProjectStats(projectId);

    return {
      projectId,
      tree,
      summary: stats,
    };
  }

  /**
   * Recursively build tree structure
   */
  private async buildTree(nodeId: string) {
    const node = await this.prisma.nodes.findUnique({
      where: { id: nodeId },
    });

    if (!node) return null;

    const response: any = {
      id: node.id,
      name: node.name,
      type: node.type,
      size: node.size,
      path: node.path,
    };

    if (node.type === 'FILE') {
      response.mime_type = node.mime_type;
      response.b2_url = node.b2_url;
    }

    if (node.type === 'FOLDER') {
      const children = await this.prisma.nodes.findMany({
        where: { parent_id: nodeId },
        orderBy: { name: 'asc' },
      });

      response.children = await Promise.all(
        children.map((child) => this.buildTree(child.id)),
      );
    }

    return response;
  }

  /**
   * Get file content
   */
  async getFileContent(
    projectId: string,
    fileId: string,
  ): Promise<{ content: string; encoding: string }> {
    const file = await this.prisma.nodes.findUnique({
      where: { id: fileId },
    });

    if (!file || file.type !== 'FILE') {
      throw new NotFoundException('File not found');
    }

    if (file.project_id !== projectId) {
      throw new BadRequestException('File not in this project');
    }

    // Download from B2
    const content = await this.b2Service.downloadFile(file.b2_url);

    return {
      content: content.toString('utf-8'),
      encoding: 'utf-8',
    };
  }

  /**
   * Calculate project statistics
   */
  private async calculateProjectStats(projectId: string) {
    const files = await this.prisma.nodes.findMany({
      where: { project_id: projectId },
    });

    const itemCount = files.length;
    const storageUsed = files.reduce((sum, file) => sum + (file.size || 0), 0);

    const fileTypes: Record<string, number> = {};
    files.forEach((file) => {
      if (file.mime_type) {
        const type = file.mime_type.split('/')[1] || 'other';
        fileTypes[type] = (fileTypes[type] || 0) + 1;
      }
    });

    return {
      itemCount,
      storageUsed,
      totalFiles: files.filter((f) => f.type === 'FILE').length,
      totalFolders: files.filter((f) => f.type === 'FOLDER').length,
      fileTypes,
    };
  }

  /**
   * Get upload status
   */
  async getUploadStatus(projectId: string, userId: string) {
    const project = await this.prisma.projects.findUnique({
      where: { id: projectId },
    });

    if (!project || project.owner_id !== userId) {
      throw new BadRequestException('Not authorized');
    }

    const files = await this.prisma.nodes.findMany({
      where: { project_id: projectId, type: 'FILE' },
    });

    return {
      projectId,
      status: project.status,
      itemCount: project.item_count,
      storageUsed: project.storage_used,
      progress: project.status === 'READY' ? 100 : 50,
    };
  }

  // Utility methods
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50);
  }

  private isValidZipFile(file: Express.Multer.File): boolean {
    const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    const fileBuffer = Buffer.alloc(4);
    require('fs').readSync(file.filename, fileBuffer, 0, 4);
    return zipSignature.equals(fileBuffer.slice(0, 4));
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.ts': 'text/typescript',
      '.tsx': 'text/typescript',
      '.js': 'text/javascript',
      '.jsx': 'text/javascript',
      '.json': 'application/json',
      '.css': 'text/css',
      '.html': 'text/html',
      '.md': 'text/markdown',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private async hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcrypt');
    return bcrypt.hash(password, 10);
  }

  private async logActivity(
    projectId: string,
    type: string,
    description: string,
  ): Promise<void> {
    await this.prisma.activities.create({
      data: {
        project_id: projectId,
        type,
        action: type,
        description,
        metadata: {},
      },
    });
  }
}
```

### Project Controller

```typescript
// projects/projects.controller.ts

import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createProject(@Req() req, @Body() dto: CreateProjectDto) {
    const project = await this.projectsService.createProject(req.user.id, dto);
    return {
      success: true,
      data: project,
    };
  }

  @Post(':projectId/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadProjectFiles(
    @Param('projectId') projectId: string,
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.projectsService.uploadProjectFiles(
      projectId,
      req.user.id,
      file,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get(':projectId/tree')
  async getProjectTree(@Param('projectId') projectId: string) {
    const tree = await this.projectsService.getProjectTree(projectId);
    return {
      success: true,
      data: tree,
    };
  }

  @Get(':projectId/files/:fileId/content')
  async getFileContent(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
  ) {
    const content = await this.projectsService.getFileContent(projectId, fileId);
    return {
      success: true,
      data: content,
    };
  }

  @Get(':projectId/upload-status')
  @UseGuards(JwtAuthGuard)
  async getUploadStatus(
    @Param('projectId') projectId: string,
    @Req() req,
  ) {
    const status = await this.projectsService.getUploadStatus(
      projectId,
      req.user.id,
    );
    return {
      success: true,
      data: status,
    };
  }
}
```

---

## Frontend Implementation (Next.js)

### Update API Configuration

```typescript
// src/config/apiConfig.ts

export const API_ENDPOINTS = {
  // ... existing endpoints
  
  PROJECTS: {
    // ... existing
    UPLOAD: '/projects/:id/upload',
    TREE: '/projects/:id/tree',
    FILE_CONTENT: '/projects/:id/files/:fileId/content',
    UPLOAD_STATUS: '/projects/:id/upload-status',
  },
};
```

### Enhanced File Upload Handling

```typescript
// lib/fileUpload.ts

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface FileTreeItem {
  name: string;
  path: string;
  size: number;
  type: 'file' | 'folder';
  children?: FileTreeItem[];
}

/**
 * Process files/folders from drag-drop
 */
export async function processDroppedItems(
  items: DataTransferItemList,
): Promise<FileTreeItem[]> {
  const results: FileTreeItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i].webkitGetAsEntry?.();
    if (item) {
      const result = await processEntry(item, '');
      results.push(result);
    }
  }

  return results;
}

async function processEntry(
  entry: FileSystemEntry,
  basePath: string,
): Promise<FileTreeItem> {
  const currentPath = basePath ? `${basePath}/${entry.name}` : entry.name;

  if (entry.isFile) {
    return new Promise((resolve, reject) => {
      (entry as FileSystemFileEntry).file((file) => {
        resolve({
          name: entry.name,
          path: currentPath,
          size: file.size,
          type: 'file',
        });
      }, reject);
    });
  } else if (entry.isDirectory) {
    return new Promise((resolve, reject) => {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      reader.readEntries(
        async (entries) => {
          const children: FileTreeItem[] = [];

          for (const childEntry of entries) {
            const child = await processEntry(childEntry, currentPath);
            children.push(child);
          }

          resolve({
            name: entry.name,
            path: currentPath,
            size: children.reduce((sum, c) => sum + c.size, 0),
            type: 'folder',
            children,
          });
        },
        reject,
      );
    });
  }

  throw new Error(`Unknown entry type: ${entry}`);
}

/**
 * Convert file tree to ZIP
 */
export async function treeToZip(items: FileTreeItem[]): Promise<Blob> {
  const zip = new JSZip();

  async function addToZip(
    item: FileTreeItem,
    folder: JSZip.Folder,
  ): Promise<void> {
    if (item.type === 'file') {
      // For demo, add empty file (in real app, fetch actual content)
      folder.file(item.name, '');
    } else if (item.type === 'folder' && item.children) {
      const subfolder = folder.folder(item.name);
      if (subfolder) {
        for (const child of item.children) {
          await addToZip(child, subfolder);
        }
      }
    }
  }

  for (const item of items) {
    await addToZip(item, zip);
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Validate ZIP file
 */
export async function validateZipFile(file: File): Promise<boolean> {
  try {
    const zip = new JSZip();
    await zip.loadAsync(file);

    // Check for suspicious paths
    for (const [path] of Object.entries(zip.files)) {
      if (path.includes('..') || path.startsWith('/')) {
        throw new Error('Invalid file path detected');
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate tree size
 */
export function calculateTreeSize(items: FileTreeItem[]): number {
  return items.reduce((total, item) => total + item.size, 0);
}

/**
 * Count files and folders
 */
export function countItems(items: FileTreeItem[]): { files: number; folders: number } {
  let files = 0;
  let folders = 0;

  function count(items: FileTreeItem[]): void {
    items.forEach((item) => {
      if (item.type === 'file') {
        files++;
      } else {
        folders++;
        if (item.children) {
          count(item.children);
        }
      }
    });
  }

  count(items);
  return { files, folders };
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
```

### Enhanced Project Service

```typescript
// src/services/projectService.ts

export class ProjectService {
  /**
   * Create project with full flow
   */
  async createProjectWithFiles(
    projectData: {
      name: string;
      description: string;
      visibility: 'PRIVATE' | 'PUBLIC';
      isPasswordProtected?: boolean;
      password?: string;
    },
    zipFile: File,
    onProgress?: (stage: string, progress: number) => void,
  ): Promise<string> {
    onProgress?.('creating', 0);

    // Step 1: Create project
    const createResponse = await this.createProject({
      name: projectData.name,
      description: projectData.description,
      visibility: projectData.visibility,
      is_password_protected: projectData.isPasswordProtected || false,
      password: projectData.password,
    });

    if (!createResponse.success) {
      throw new Error(createResponse.error?.message || 'Failed to create project');
    }

    const projectId = createResponse.data.id;
    onProgress?.('creating', 100);

    // Step 2: Upload files
    onProgress?.('uploading', 0);

    const uploadResponse = await this.uploadProjectFiles(
      projectId,
      zipFile,
      (uploadProgress) => {
        onProgress?.('uploading', uploadProgress);
      },
    );

    if (!uploadResponse.success) {
      throw new Error(uploadResponse.error?.message || 'Failed to upload files');
    }

    onProgress?.('uploading', 100);

    // Step 3: Monitor processing
    onProgress?.('processing', 0);

    let isComplete = false;
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes

    while (!isComplete && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const statusResponse = await this.getUploadStatus(projectId);

      if (statusResponse.success) {
        const { status, progress } = statusResponse.data;
        onProgress?.('processing', progress);

        if (status === 'READY' || status === 'COMPLETED') {
          isComplete = true;
        } else if (status === 'FAILED') {
          throw new Error('File processing failed on server');
        }
      }

      attempts++;
    }

    if (!isComplete) {
      throw new Error('Processing timeout');
    }

    onProgress?.('processing', 100);
    return projectId;
  }

  /**
   * Upload project files
   */
  async uploadProjectFiles(
    projectId: string,
    zipFile: File,
    onProgress?: (progress: number) => void,
  ): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', zipFile);

    return apiService.post(
      API_ENDPOINTS.PROJECTS.UPLOAD.replace(':id', projectId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentComplete = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100,
            );
            onProgress(percentComplete);
          }
        },
      },
    );
  }

  /**
   * Get upload status
   */
  async getUploadStatus(projectId: string): Promise<ApiResponse> {
    return apiService.get(
      API_ENDPOINTS.PROJECTS.UPLOAD_STATUS.replace(':id', projectId),
    );
  }

  /**
   * Get project file tree
   */
  async getProjectTree(projectId: string): Promise<ApiResponse> {
    return apiService.get(
      API_ENDPOINTS.PROJECTS.TREE.replace(':id', projectId),
    );
  }

  /**
   * Get file content
   */
  async getFileContent(
    projectId: string,
    fileId: string,
  ): Promise<ApiResponse> {
    return apiService.get(
      `${API_ENDPOINTS.PROJECTS.FILE_CONTENT.replace(':id', projectId).replace(':fileId', fileId)}`,
    );
  }
}

export default new ProjectService();
```

### Enhanced AddProject Dialog

```typescript
// app/dashboard/projects/AddProject.tsx

"use client"

import React, { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, Folder, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import projectService from "@/src/services/projectService"
import {
  processDroppedItems,
  treeToZip,
  validateZipFile,
  calculateTreeSize,
  countItems,
  formatBytes,
  type FileTreeItem,
} from "@/lib/fileUpload"

interface AddProjectProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onProjectCreated?: (projectId: string) => void
}

interface FormData {
  name: string
  description: string
  visibility: "PRIVATE" | "PUBLIC"
  isPasswordProtected: boolean
  password: string
}

const STEP = {
  DETAILS: "details",
  UPLOAD: "upload",
  PREVIEW: "preview",
  PROCESSING: "processing",
  COMPLETE: "complete",
} as const

export default function AddProject({
  open: openProp,
  onOpenChange: onOpenChangeProp,
  onProjectCreated,
}: AddProjectProps) {
  const isControlled = openProp !== undefined
  const [isOpen, setIsOpen] = React.useState(false)

  const dialogOpen = isControlled ? openProp : isOpen
  const setDialogOpen = isControlled
    ? (value: boolean) => onOpenChangeProp?.(value)
    : setIsOpen

  const [step, setStep] = useState<keyof typeof STEP>(STEP.DETAILS)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedItems, setUploadedItems] = useState<FileTreeItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState<string>("")
  const dragRef = useRef<HTMLDivElement>(null)

  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      visibility: "PRIVATE",
      isPasswordProtected: false,
      password: "",
    },
  })

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === "dragenter" || e.type === "dragover")
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.items) {
      const items = await processDroppedItems(e.dataTransfer.items)
      setUploadedItems(items)
      setStep("preview")
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const items = await processDroppedItems(e.target.files as any)
      setUploadedItems(items)
      setStep("preview")
    }
  }

  const handleCreateProject = async (formData: FormData) => {
    try {
      setStep("processing")
      setIsUploading(true)

      // Convert tree to ZIP
      const zipBlob = await treeToZip(uploadedItems)
      const zipFile = new File([zipBlob], "project.zip", {
        type: "application/zip",
      })

      // Validate ZIP
      const isValid = await validateZipFile(zipFile)
      if (!isValid) {
        throw new Error("Invalid ZIP file")
      }

      // Create and upload project
      const projectId = await projectService.createProjectWithFiles(
        {
          name: formData.name,
          description: formData.description,
          visibility: formData.visibility,
          isPasswordProtected: formData.isPasswordProtected,
          password: formData.password,
        },
        zipFile,
        (stage, progress) => {
          setUploadStage(stage)
          setUploadProgress(progress)
        },
      )

      setStep("complete")
      toast.success("Project created successfully!")

      // Reset and close
      setTimeout(() => {
        setStep("details")
        setUploadedItems([])
        setUploadProgress(0)
        setUploadStage("")
        form.reset()
        setDialogOpen(false)
        onProjectCreated?.(projectId)
      }, 2000)
    } catch (error) {
      console.error("Error:", error)
      toast.error(error.message || "Failed to create project")
      setStep("preview")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === STEP.DETAILS && "Create New Project"}
            {step === STEP.UPLOAD && "Upload Project Files"}
            {step === STEP.PREVIEW && "Review Files"}
            {step === STEP.PROCESSING && "Processing Upload"}
            {step === STEP.COMPLETE && "Project Created!"}
          </DialogTitle>
          <DialogDescription>
            {step === STEP.DETAILS &&
              "Enter project details and upload your codebase"}
            {step === STEP.PREVIEW &&
              "Review your files before uploading"}
            {step === STEP.PROCESSING &&
              "Your files are being processed..."}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Details */}
        {step === STEP.DETAILS && (
          <div className="space-y-4">
            <div>
              <Label>Project Name</Label>
              <Input
                {...form.register("name", { required: true })}
                placeholder="My Awesome Project"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                {...form.register("description")}
                placeholder="Project description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Visibility</Label>
                <Select {...form.register("visibility")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Password Protected</Label>
                <Input
                  type="checkbox"
                  {...form.register("isPasswordProtected")}
                />
              </div>
            </div>

            {form.watch("isPasswordProtected") && (
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  {...form.register("password")}
                  placeholder="Enter password"
                />
              </div>
            )}

            <Button
              onClick={() => setStep("upload")}
              className="w-full"
              disabled={!form.watch("name")}
            >
              Next: Upload Files
            </Button>
          </div>
        )}

        {/* Step 2: Upload */}
        {step === STEP.UPLOAD && (
          <div className="space-y-4">
            <div
              ref={dragRef}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="font-semibold mb-2">
                Drag and drop your project
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Or click to select folder or ZIP file
              </p>
              <Input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("file-input")?.click()}
              >
                Select Files
              </Button>
            </div>

            <Button
              onClick={() => setStep("details")}
              variant="outline"
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === STEP.PREVIEW && (
          <div className="space-y-4">
            <Card className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {uploadedItems.length} item
                  {uploadedItems.length !== 1 ? "s" : ""}
                </span>
                <span>{formatBytes(calculateTreeSize(uploadedItems))}</span>
              </div>
            </Card>

            <div className="border rounded-lg max-h-64 overflow-auto">
              {uploadedItems.map((item) => (
                <FileTreePreview key={item.path} item={item} level={0} />
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep("upload")}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => handleCreateProject(form.getValues())}
                className="flex-1"
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Processing */}
        {step === STEP.PROCESSING && (
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <p className="text-sm font-medium capitalize">
                {uploadStage.replace(/_/g, " ")}
              </p>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === STEP.COMPLETE && (
          <div className="py-6 text-center">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="font-semibold mb-2">Project Created!</h3>
            <p className="text-sm text-muted-foreground">
              Your project is ready to explore
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function FileTreePreview({
  item,
  level,
}: {
  item: FileTreeItem
  level: number
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <div
        className="flex items-center gap-2 px-4 py-2 hover:bg-accent"
        style={{ paddingLeft: `${level * 20 + 16}px` }}
        onClick={() => setExpanded(!expanded)}
      >
        {item.type === "folder" && (
          <ChevronRight
            size={16}
            className={`transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        )}
        {item.type === "folder" ? (
          <Folder size={16} className="text-blue-500" />
        ) : (
          <div className="w-4 h-4" />
        )}
        <span className="text-sm">{item.name}</span>
      </div>

      {item.type === "folder" && expanded && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreePreview key={child.path} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## API Flow Diagram

```
Frontend                          Backend                         Storage (B2)
──────────────────────────────────────────────────────────────────────────

User Flow:
1. User fills form
   │
   ├─► Creates ZIP
   │
   └─► POST /projects
       └─► Creates project record
           Returns: projectId
           │
           ├─► POST /projects/:id/upload
               └─► Receives ZIP
                   │
                   ├─► Validates ZIP
                   ├─► Extracts files
                   ├─► Builds tree → DB
                   ├─► Uploads files ──────────────► Backblaze B2
                   ├─► Updates status
                   └─► Returns: PROCESSING
               │
               ├─► GET /projects/:id/upload-status
                   └─► Returns: progress %
                   (polls every 5 seconds)
               │
               └─► GET /projects/:id/tree
                   └─► Returns: file tree
                       Displays: GitHub explorer

File Access:
2. User clicks file
   │
   └─► GET /projects/:id/files/:fileId/content
       │
       ├─► Backend fetches from B2
       │
       └─► Returns: file content
           Displays: code viewer
```

---

## State Management

### Zustand Store

```typescript
// lib/store/projectStore.ts

import { create } from 'zustand'

interface ProjectState {
  currentProject: any | null
  fileTree: any | null
  selectedFile: any | null
  isLoading: boolean
  uploadProgress: number
  uploadStage: string

  setCurrentProject: (project: any) => void
  setFileTree: (tree: any) => void
  setSelectedFile: (file: any) => void
  setLoading: (loading: boolean) => void
  setUploadProgress: (progress: number) => void
  setUploadStage: (stage: string) => void
  reset: () => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  fileTree: null,
  selectedFile: null,
  isLoading: false,
  uploadProgress: 0,
  uploadStage: '',

  setCurrentProject: (project) => set({ currentProject: project }),
  setFileTree: (tree) => set({ fileTree: tree }),
  setSelectedFile: (file) => set({ selectedFile: file }),
  setLoading: (loading) => set({ isLoading: loading }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setUploadStage: (stage) => set({ uploadStage: stage }),
  reset: () => set({
    currentProject: null,
    fileTree: null,
    selectedFile: null,
    isLoading: false,
    uploadProgress: 0,
    uploadStage: '',
  }),
}))
```

---

## WebSocket Integration

```typescript
// lib/websocket.ts

import io from 'socket.io-client'

export class ProjectUploadSocket {
  private socket: any

  constructor(projectId: string) {
    this.socket = io(process.env.NEXT_PUBLIC_API_URL, {
      auth: {
        token: localStorage.getItem('accessToken'),
      },
    })

    this.socket.emit('join-project', { projectId })
  }

  onUploadProgress(callback: (progress: number) => void) {
    this.socket.on('upload-progress', callback)
  }

  onUploadComplete(callback: (tree: any) => void) {
    this.socket.on('upload-complete', callback)
  }

  onUploadError(callback: (error: string) => void) {
    this.socket.on('upload-error', callback)
  }

  disconnect() {
    this.socket.disconnect()
  }
}

// Usage in component
export function useUploadSocket(projectId: string) {
  const [progress, setProgress] = useState(0)
  const [tree, setTree] = useState(null)

  useEffect(() => {
    const socket = new ProjectUploadSocket(projectId)

    socket.onUploadProgress((data) => {
      setProgress(data.progress)
    })

    socket.onUploadComplete((data) => {
      setTree(data.tree)
    })

    return () => socket.disconnect()
  }, [projectId])

  return { progress, tree }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/fileUpload.test.ts

import { calculateTreeSize, countItems, formatBytes } from '@/lib/fileUpload'

describe('fileUpload utilities', () => {
  it('calculates tree size correctly', () => {
    const items = [
      {
        name: 'file1.txt',
        type: 'file' as const,
        size: 1024,
        path: '/file1.txt',
      },
      {
        name: 'file2.txt',
        type: 'file' as const,
        size: 2048,
        path: '/file2.txt',
      },
    ]

    expect(calculateTreeSize(items)).toBe(3072)
  })

  it('counts items correctly', () => {
    const items = [
      {
        name: 'folder',
        type: 'folder' as const,
        size: 4096,
        path: '/folder',
        children: [
          {
            name: 'file.txt',
            type: 'file' as const,
            size: 1024,
            path: '/folder/file.txt',
          },
        ],
      },
    ]

    const count = countItems(items)
    expect(count.files).toBe(1)
    expect(count.folders).toBe(1)
  })

  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1048576)).toBe('1 MB')
  })
})
```

### Integration Tests

```typescript
// tests/projectUpload.integration.test.ts

describe('Project Upload Flow', () => {
  it('should create project and upload files', async () => {
    const projectData = {
      name: 'Test Project',
      description: 'A test project',
      visibility: 'PRIVATE' as const,
    }

    const zipFile = new File(['test'], 'test.zip', { type: 'application/zip' })

    const projectId = await projectService.createProjectWithFiles(
      projectData,
      zipFile,
      (stage, progress) => {
        console.log(`${stage}: ${progress}%`)
      },
    )

    expect(projectId).toBeDefined()
    expect(projectId).toMatch(/^proj-/)
  })
})
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| ZIP extraction fails | Corrupted file | Re-upload file |
| Database insert timeout | Too many files | Batch insert in smaller chunks |
| B2 upload fails | Network issue | Retry with exponential backoff |
| Progress stuck at 50% | Backend not updating status | Check server logs |
| File not found error | Node not created | Verify tree structure |
| Memory overflow | Large files in memory | Use streaming approach |

### Debug Checklist

- [ ] Verify JWT token is valid
- [ ] Check ZIP file signature (PK\x03\x04)
- [ ] Verify B2 credentials
- [ ] Check database connection
- [ ] Monitor server logs for errors
- [ ] Verify file path doesn't contain `..` or leading `/`
- [ ] Check storage quota
- [ ] Verify CORS headers

---

**Document Version:** 1.0  
**Status:** Implementation Ready  
**Last Updated:** November 2024
