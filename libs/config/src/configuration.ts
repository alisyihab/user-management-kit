import * as dotenv from 'dotenv';
import { resolve } from 'path';

const rootEnvPath = resolve(process.cwd(), '.env');
dotenv.config({ path: rootEnvPath });

console.log('📦 ENV loaded from:', rootEnvPath);

export default () => ({
  authServiceUrl: process.env.AUTH_SERVICE_URL,
  authInternalKey: process.env.AUTH_INTERNAL_KEY,
  userServiceUrl: process.env.USER_SERVICE_URL,
  userInternalKey: process.env.USER_INTERNAL_KEY,
});
