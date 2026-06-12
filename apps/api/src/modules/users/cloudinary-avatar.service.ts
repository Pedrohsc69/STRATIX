import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryAvatarService {
  private readonly folder: string;
  private readonly configured: boolean;

  constructor(configService: ConfigService) {
    const cloudName = configService.get<string>('CLOUDINARY_CLOUD_NAME')?.trim();
    const apiKey = configService.get<string>('CLOUDINARY_API_KEY')?.trim();
    const apiSecret = configService.get<string>('CLOUDINARY_API_SECRET')?.trim();
    this.folder = configService.get<string>('CLOUDINARY_AVATAR_FOLDER')?.trim() || 'stratix/avatars';
    this.configured = Boolean(cloudName && apiKey && apiSecret);

    if (this.configured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
    }
  }

  async uploadAvatar(file: Express.Multer.File, userId: string) {
    if (!this.configured) {
      throw new ServiceUnavailableException('Upload de avatar indisponível nesta configuração.');
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: this.folder,
          public_id: `${userId}-${Date.now()}`,
          resource_type: 'image',
          overwrite: true,
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }

          resolve(uploadResult);
        },
      );

      uploadStream.end(file.buffer);
    });

    return result.secure_url;
  }
}
