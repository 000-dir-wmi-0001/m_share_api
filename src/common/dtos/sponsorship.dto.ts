import { IsNumber, IsOptional, IsBoolean, IsString, IsEnum, IsDate } from 'class-validator';
import { SponsorshipTier, SponsorshipStatus } from '../../common/enums';

export class CreateSponsorshipDto {
  @IsEnum(SponsorshipTier)
  tier: SponsorshipTier;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsDate()
  start_date: Date;

  @IsOptional()
  @IsDate()
  end_date?: Date;

  @IsOptional()
  @IsBoolean()
  auto_renew?: boolean;

  @IsOptional()
  @IsString()
  message?: string;
}

export class UpdateSponsorshipDto {
  @IsOptional()
  @IsEnum(SponsorshipStatus)
  status?: SponsorshipStatus;

  @IsOptional()
  @IsBoolean()
  auto_renew?: boolean;

  @IsOptional()
  @IsString()
  message?: string;
}

export class SponsorshipResponseDto {
  id: string;
  user_id: string;
  tier: SponsorshipTier;
  amount: number;
  currency: string;
  status: SponsorshipStatus;
  start_date: Date;
  end_date?: Date;
  auto_renew: boolean;
  message?: string;
  created_at: Date;
  updated_at: Date;
}
