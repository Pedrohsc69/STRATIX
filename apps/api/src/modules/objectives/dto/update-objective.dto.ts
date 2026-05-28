import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateObjectiveDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  cycleId?: string;
}
