import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class ListDepartmentsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  managerId?: string;

  @IsOptional()
  @IsIn(['ON_TRACK', 'ATTENTION', 'AT_RISK', 'NO_DATA'])
  status?: 'ON_TRACK' | 'ATTENTION' | 'AT_RISK' | 'NO_DATA';

  @IsOptional()
  @IsIn(['name', 'manager', 'members', 'cycles', 'progress'])
  sortBy?: 'name' | 'manager' | 'members' | 'cycles' | 'progress';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
