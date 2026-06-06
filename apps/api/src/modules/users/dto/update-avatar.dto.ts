import { IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateAvatarDto {
  @IsString()
  @MaxLength(2048)
  @IsUrl(
    {
      require_protocol: true,
    },
    {
      message: 'Avatar URL must be a valid URL',
    },
  )
  avatarUrl!: string;
}
