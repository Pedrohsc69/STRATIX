import { IsString } from 'class-validator';

export class GetInviteDetailsDto {
  @IsString()
  token!: string;
}
