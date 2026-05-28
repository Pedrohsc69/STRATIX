import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AddOkrProgressDto {
  @IsNumber()
  @Min(0)
  value!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
