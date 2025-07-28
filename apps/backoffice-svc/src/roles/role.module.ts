import { CommonAuthModule, PermissionGuard } from '@libs/common/src';
import { PrismaModule } from '@libs/database/src';
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import {
  AuditTrailService,
  createFetchOldEntityMiddleware,
} from '@libs/audit-trail';

@Module({
  imports: [PrismaModule, CommonAuthModule],
  controllers: [RoleController],
  providers: [RoleService, PermissionGuard, AuditTrailService
  ],
  exports: [RoleService],
})
export class RoleModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(createFetchOldEntityMiddleware('role'))
      .forRoutes({
        path: 'backoffice/roles/:id/permissions',
        method: RequestMethod.PATCH,
      });
  }
}
