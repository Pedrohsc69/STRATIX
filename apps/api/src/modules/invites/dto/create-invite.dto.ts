import { UserRole } from '@prisma/client';
import { IsEmail, IsIn, IsString, IsUUID } from 'class-validator';

export class CreateInviteDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsIn([UserRole.MANAGER, UserRole.EMPLOYEE])
  role!: UserRole;

  @IsString()
  @IsUUID()
  departmentId!: string;
}
