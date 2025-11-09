import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { TeamRole, MemberStatus } from '../../common/enums';

export class AddTeamMemberDto {
  @IsUUID()
  user_id: string;

  @IsOptional()
  @IsEnum(TeamRole)
  role?: TeamRole;
}

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsEnum(TeamRole)
  role?: TeamRole;

  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;
}

export class TeamMemberResponseDto {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  status: MemberStatus;
  joined_at: Date;
  last_active_at?: Date;
  project_count: number;
}
