import { Module } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { winstonTransports } from '@libs/logger/src';
import { createLogger } from 'winston';
import { GlobalConfigModule } from '@libs/config/src/config.module';

@Module({
  imports: [GlobalConfigModule],
  providers: [
    {
      provide: WINSTON_MODULE_NEST_PROVIDER,
      useValue: createLogger({
        transports: winstonTransports,
      }),
    },
  ],
  exports: [WINSTON_MODULE_NEST_PROVIDER],
})
export class AppModule {}
