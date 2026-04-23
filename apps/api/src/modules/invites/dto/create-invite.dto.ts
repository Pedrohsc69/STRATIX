import { UserRole } from '@prisma/client';
import { IsEmail, IsEnum, IsString, IsUUID } from 'class-validator';

export class CreateInviteDto {
  @IsEmail()
  email!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsString()
  @IsUUID()
  departmentId!: string;
}
