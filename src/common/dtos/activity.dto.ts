import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ActivityType } from '../../common/enums';

export class ActivityFilterDto {
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  team_id?: string;

  @IsOptional()
  @IsString()
  project_id?: string;
}

export class ActivityResponseDto {
  id: string;
  user_id: string;
  team_id?: string;
  project_id?: string;
  type: ActivityType;
  action: string;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
  metadata?: Record<string, any>;
}
