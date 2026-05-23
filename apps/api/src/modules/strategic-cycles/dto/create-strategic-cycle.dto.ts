import { IsDateString, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateStrategicCycleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsUUID()
  departmentId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
