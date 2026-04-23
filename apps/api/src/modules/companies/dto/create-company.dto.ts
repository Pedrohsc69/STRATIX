import { IsString, Length, Matches } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  name!: string;

  @Matches(/^\d{14}$/)
  cnpj!: string;

  @IsString()
  @Length(2, 100)
  businessArea!: string;
}
