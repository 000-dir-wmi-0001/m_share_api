import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export class CreateProjectItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  mime_type?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  is_watermarked?: boolean;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @IsOptional()
  @IsBoolean()
  is_folder?: boolean;
}

export class UpdateProjectItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsUUID()
  parent_id?: string;
}

export class ProjectItemResponseDto {
  id: string;
  project_id: string;
  parent_id?: string;
  name: string;
  description?: string;
  file_type: string;
  mime_type?: string;
  path: string;
  is_folder: boolean;
  size: number;
  order: number;
  is_watermarked: boolean;
  language?: string;
  view_count: number;
  copy_count: number;
  b2_url?: string;
  checksum?: string;
  created_at: Date;
  updated_at: Date;
}

export class ProjectTreeNodeDto {
  id: string;
  name: string;
  type: 'FILE' | 'FOLDER';
  mime_type?: string;
  size: number;
  path: string;
  b2_url?: string;
  order: number;
  children?: ProjectTreeNodeDto[];
  created_at: Date;
  updated_at: Date;
}

export class ProjectTreeResponseDto {
  projectId: string;
  projectName: string;
  root: ProjectTreeNodeDto;
  itemCount: number;
  storageUsed: number;
}

export class UploadStatusDto {
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
