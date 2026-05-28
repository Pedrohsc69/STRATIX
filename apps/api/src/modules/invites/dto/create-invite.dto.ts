import { UserRole } from '@prisma/client';
import { IsEmail, IsEnum, IsString, IsUUID, Length } from 'class-validator';

export class CreateInviteDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsEmail()
  email!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsString()
  @IsUUID()
  departmentId!: string;
}
