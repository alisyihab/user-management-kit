import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [path.resolve(__dirname, '../../../../.env')],
      load: [() => ({
        authServiceUrl: process.env.AUTH_SERVICE_URL,
        authInternalKey: process.env.AUTH_INTERNAL_KEY,
        userServiceUrl: process.env.USER_SERVICE_URL,
        userInternalKey: process.env.USER_INTERNAL_KEY,
      })],
    }),
  ],
})
export class GlobalConfigModule {}
