import { IsString, MinLength } from 'class-validator';

export class GoogleRegisterDirectorDto {
  @IsString()
  @MinLength(1)
  credential!: string;
}
