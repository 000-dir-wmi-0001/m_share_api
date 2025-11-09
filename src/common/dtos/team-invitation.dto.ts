import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { InvitationStatus, TeamRole } from '../../common/enums';

export class InviteToTeamDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(TeamRole)
  role?: TeamRole;
}

export class ResponseToInvitationDto {
  @IsEnum(InvitationStatus)
  status: InvitationStatus;
}

export class TeamInvitationResponseDto {
  id: string;
  team_id: string;
  email: string;
  role: string;
  status: InvitationStatus;
  token: string;
  expires_at: Date;
  created_at: Date;
}
