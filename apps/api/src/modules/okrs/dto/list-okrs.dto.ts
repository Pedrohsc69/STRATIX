import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class ListOkrsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  cycleId?: string;

  @IsOptional()
  @IsUUID()
  objectiveId?: string;

  @IsOptional()
  @IsUUID()
  responsibleId?: string;

  @IsOptional()
  @IsIn(['IN_PROGRESS', 'COMPLETED', 'AT_RISK'])
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'AT_RISK';

  @IsOptional()
  @IsIn(['true', 'false'])
  ownOnly?: 'true' | 'false';
}
