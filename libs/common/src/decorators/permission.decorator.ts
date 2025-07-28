import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';
export const Permission = (name: string, module: string, description?: string) =>
  SetMetadata(PERMISSION_KEY, { name, module, description });
