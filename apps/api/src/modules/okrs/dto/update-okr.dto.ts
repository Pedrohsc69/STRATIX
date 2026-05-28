import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateOkrDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  objectiveId?: string;

  @IsOptional()
  @IsUUID()
  responsibleId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.000001)
  targetValue?: number;
}
