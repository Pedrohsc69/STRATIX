import { IsDateString, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class ListStrategicCyclesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'CLOSED', 'DELAYED'])
  status?: 'ACTIVE' | 'CLOSED' | 'DELAYED';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
