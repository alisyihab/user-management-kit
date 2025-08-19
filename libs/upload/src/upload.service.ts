import { Injectable } from '@nestjs/common';
import { UploadStrategy, UploadResult } from './strategies/upload-strategy.interface';
import { S3Strategy } from './strategies/s3.strategy';
import { ImageKitStrategy } from './strategies/imagekit.strategy';
import { CloudinaryStrategy } from './strategies/cloudinary.strategy';

@Injectable()
export class UploadService {
  private strategy: UploadStrategy;

  constructor() {
    const provider = process.env.STORAGE_PROVIDER || 's3';

    switch (provider) {
      case 'imagekit':
        this.strategy = new ImageKitStrategy();
        break;
      case 'cloudinary':
        this.strategy = new CloudinaryStrategy();
        break;
      case 's3':
      default:
        this.strategy = new S3Strategy();
    }
  }

  async upload(file: Express.Multer.File): Promise<UploadResult> {
    return this.strategy.upload(file);
  }

  async delete(id: string): Promise<void> {
    if (!id) return;
    return this.strategy.delete(id);
  }
}
