import { IsEnum, IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';

export class ListUsersDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  search?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsIn([UserStatus.PENDING, UserStatus.ACTIVE, UserStatus.DISABLED, 'EXPIRED'])
  status?: UserStatus | 'EXPIRED';

  @IsOptional()
  @IsIn(['name', 'department', 'role', 'date'])
  sortBy?: 'name' | 'department' | 'role' | 'date';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
