import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeleteCompanyDto {
  @IsString()
  @MaxLength(200)
  companyNameConfirmation!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  directorEmailConfirmation?: string;
}
