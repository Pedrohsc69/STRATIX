import { ThemePreference } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateMySettingsDto {
  @IsOptional()
  @IsEnum(ThemePreference)
  theme?: ThemePreference;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  inviteNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  okrNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  cycleNotifications?: boolean;
}
