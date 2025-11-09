import { IsString, IsOptional, IsEnum, IsUUID, IsNumber, IsBoolean } from 'class-validator';
import { TeamStatus } from '../../common/enums';

export class CreateTeamDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsBoolean()
  is_private?: boolean;

  @IsOptional()
  @IsString()
  logo_url?: string;
}

export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_private?: boolean;

  @IsOptional()
  @IsString()
  logo_url?: string;
}

export class TeamResponseDto {
  id: string;
  name: string;
  description?: string;
  slug: string;
  owner_id: string;
  status: TeamStatus;
  is_private: boolean;
  member_count: number;
  project_count: number;
  logo_url?: string;
  created_at: Date;
  updated_at: Date;
}
