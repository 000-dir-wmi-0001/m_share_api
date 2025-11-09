import { IsOptional, IsEnum, IsBoolean, IsNumber, IsDate } from 'class-validator';
import { AccessType } from '../../common/enums';

export class CreateProjectAccessDto {
  @IsOptional()
  @IsEnum(AccessType)
  access_type?: AccessType;

  @IsOptional()
  @IsBoolean()
  allow_download?: boolean;

  @IsOptional()
  @IsBoolean()
  allow_share?: boolean;

  @IsOptional()
  @IsBoolean()
  allow_view_notifications?: boolean;

  @IsOptional()
  @IsDate()
  expires_at?: Date;
}

export class UpdateProjectAccessDto {
  @IsOptional()
  @IsEnum(AccessType)
  access_type?: AccessType;

  @IsOptional()
  @IsBoolean()
  allow_download?: boolean;

  @IsOptional()
  @IsBoolean()
  allow_share?: boolean;

  @IsOptional()
  @IsBoolean()
  allow_view_notifications?: boolean;

  @IsOptional()
  @IsDate()
  expires_at?: Date;
}

export class ProjectAccessResponseDto {
  id: string;
  project_id: string;
  user_id?: string;
  access_type: AccessType;
  token: string;
  is_password_protected: boolean;
  allow_download: boolean;
  allow_share: boolean;
  allow_view_notifications: boolean;
  expires_at?: Date;
  view_count: number;
  created_at: Date;
  updated_at: Date;
}
