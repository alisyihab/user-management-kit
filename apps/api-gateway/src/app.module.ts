import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '@app/config/configuration';
import { RequestLoggerMiddleware } from './request-logger.middleware';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { winstonTransports } from '@libs/logger/src';
import { createLogger } from 'winston';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),
  ],
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
