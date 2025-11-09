import { IsNumber, IsOptional, IsBoolean, IsString, IsEnum } from 'class-validator';
import { PaymentMethod, RecurringFrequency } from '../../common/enums';

export class CreateDonationDto {
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;

  @IsOptional()
  @IsEnum(RecurringFrequency)
  recurring_frequency?: RecurringFrequency;

  @IsOptional()
  @IsString()
  message?: string;
}

export class DonationResponseDto {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: PaymentMethod;
  payment_id?: string;
  is_recurring: boolean;
  recurring_frequency?: RecurringFrequency;
  next_charge_date?: Date;
  message?: string;
  receipt_url?: string;
  created_at: Date;
  updated_at: Date;
}
