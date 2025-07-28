import * as dotenv from 'dotenv';
import { resolve } from 'path';

const rootEnvPath = resolve(process.cwd(), '.env');
dotenv.config({ path: rootEnvPath });

export const RoutesMap = {
  auth: {
    basePath: '/auth',
    target: process.env.AUTH_SERVICE_URL,
    key: process.env.AUTH_INTERNAL_KEY,
  },
  backoffice: {
    basePath: '/backoffice',
    target: process.env.BACKOFFICE_SERVICE_URL,
    key: process.env.BACKOFFICE_INTERNAL_KEY,
  },
};
