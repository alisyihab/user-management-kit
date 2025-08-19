import { UploadStrategy } from "./upload-strategy.interface";

export class ImageKitStrategy implements UploadStrategy {
  private imagekit: any;
  private initialized = false;

  private async initializeImageKit() {
    if (!this.initialized) {
      const ImageKitModule = require("imagekit");
      const ImageKitConstructor = ImageKitModule.default || ImageKitModule;

      this.imagekit = new ImageKitConstructor({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
        urlEndpoint: process.env.IMAGEKIT_URL!,
      });

      this.initialized = true;
    }
    return this.imagekit;
  }

  async upload(file: Express.Multer.File): Promise<{ url: string; id: string }> {
    const imagekit = await this.initializeImageKit();
    const res = await imagekit.upload({
      file: file.buffer.toString("base64"),
      fileName: file.originalname,
    });

    return { url: res.url, id: res.fileId };
  }

  async delete(fileId: string): Promise<void> {
    const imagekit = await this.initializeImageKit();
    await imagekit.deleteFile(fileId);
  }
}
