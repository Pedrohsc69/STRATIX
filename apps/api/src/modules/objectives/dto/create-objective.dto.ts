import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateObjectiveDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsUUID()
  cycleId!: string;
}
