import { v2 as cloudinary } from "cloudinary";
import { UploadStrategy, UploadResult } from "./upload-strategy.interface";

export class CloudinaryStrategy implements UploadStrategy {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
      api_key: process.env.CLOUDINARY_API_KEY!,
      api_secret: process.env.CLOUDINARY_API_SECRET!,
    });
  }

  async upload(file: Express.Multer.File): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "image", folder: "users" },
        (error, result) => {
          if (error) return reject(error);

          resolve({
            url: result!.secure_url,
            id: result!.public_id,
          });
        },
      );

      stream.end(file.buffer);
    });
  }

  async delete(id: string): Promise<void> {
    if (!id) return;
    await new Promise<void>((resolve, reject) => {
      cloudinary.uploader.destroy(
        id,
        { resource_type: "image" },
        (err, result) => {
          if (err) return reject(err);
          resolve();
        },
      );
    });
  }
}
