import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { UserModule } from './users/user.module';
import { createInternalKeyMiddleware } from '@libs/common/src';
import { RoleModule } from './roles/role.module';

@Module({
  imports: [UserModule, RoleModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(createInternalKeyMiddleware(process.env.BACKOFFICE_INTERNAL_KEY || ''))
      .exclude(
        { path: '/docs-json', method: RequestMethod.GET },
        { path: '/docs', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
