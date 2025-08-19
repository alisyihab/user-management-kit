import type { Multer } from 'multer';

export interface UploadResult {
  url: string;
  id: string;
}

export interface UploadStrategy {
  upload(file: Express.Multer.File): Promise<UploadResult>;
  delete(id: string): Promise<void>;
}
