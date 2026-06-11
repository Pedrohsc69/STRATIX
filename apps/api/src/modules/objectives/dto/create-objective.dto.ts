import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateObjectiveDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsUUID()
  cycleId!: string;

  @IsOptional()
  @IsIn(['HIGH', 'MEDIUM', 'LOW', 'UNSPECIFIED'])
  priority?: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNSPECIFIED';
}
