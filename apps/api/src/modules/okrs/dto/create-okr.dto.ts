import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreateOkrDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsUUID()
  objectiveId!: string;

  @IsUUID()
  responsibleId!: string;

  @IsNumber()
  @Min(0.000001)
  targetValue!: number;
}
