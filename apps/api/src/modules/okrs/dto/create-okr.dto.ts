import { Type } from 'class-transformer';
import { OKRMetricType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOkrDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsUUID()
  objectiveId!: string;

  @IsUUID()
  responsibleId!: string;

  @IsEnum(OKRMetricType)
  metricType!: OKRMetricType;

  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsOptional()
  currentValue?: number;

  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  targetValue!: number;
}
