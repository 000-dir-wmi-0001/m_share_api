import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

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
}

export class ProjectItemResponseDto {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  file_type: string;
  mime_type?: string;
  content: string;
  size: number;
  order: number;
  is_watermarked: boolean;
  language?: string;
  view_count: number;
  copy_count: number;
  created_at: Date;
  updated_at: Date;
}
