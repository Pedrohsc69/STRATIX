import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class ListObjectivesDto {
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
  @IsIn(['IN_PROGRESS', 'COMPLETED', 'AT_RISK'])
  status?: 'IN_PROGRESS' | 'COMPLETED' | 'AT_RISK';

  @IsOptional()
  @IsIn(['HIGH', 'MEDIUM', 'LOW', 'UNSPECIFIED'])
  priority?: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNSPECIFIED';
}
