import { IsString, IsOptional, IsEnum, IsBoolean, IsUUID } from 'class-validator';
import { ProjectStatus, Visibility } from '../../common/enums';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsUUID()
  team_id?: string;

  @IsOptional()
  @IsBoolean()
  is_password_protected?: boolean;

  @IsOptional()
  @IsString()
  password?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsBoolean()
  is_password_protected?: boolean;

  @IsOptional()
  @IsString()
  password?: string;
}

export class ProjectResponseDto {
  id: string;
  owner_id: string;
  team_id?: string;
  name: string;
  description?: string;
  slug: string;
  status: ProjectStatus;
  visibility: Visibility;
  is_password_protected: boolean;
  member_count: number;
  item_count: number;
  share_count: number;
  view_count: number;
  copy_count: number;
  storage_used: number;
  created_at: Date;
  updated_at: Date;
}
