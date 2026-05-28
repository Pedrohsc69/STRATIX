import { ArrayUnique, IsArray, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsUUID()
  managerId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  collaboratorIds?: string[];
}
