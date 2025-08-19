import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '@libs/database/src';
import { CommonAuthModule, PermissionGuard } from '@libs/common/src';
import {
  AuditTrailService,
  createFetchOldEntityMiddleware,
} from '@libs/audit-trail';
import { UploadModule } from '@libs/upload';

@Module({
  imports: [PrismaModule, CommonAuthModule, UploadModule],
  controllers: [UserController],
  providers: [UserService, PermissionGuard, AuditTrailService],
  exports: [UserService],
})
export class UserModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(createFetchOldEntityMiddleware('user')).forRoutes(
      {
        path: 'backoffice/users/:id/update',
        method: RequestMethod.PATCH,
      },
      {
        path: 'backoffice/users/:id/status',
        method: RequestMethod.PATCH,
      },
    );
  }
}
