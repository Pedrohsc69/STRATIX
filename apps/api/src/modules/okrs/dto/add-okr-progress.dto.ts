import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddOkrProgressDto {
  @Type(() => Number)
  @IsNumber({ allowInfinity: false, allowNaN: false })
  value!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
