import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, tap } from "rxjs";
import { AuditTrailService } from "../audit-trail.service";
import {
  AUDIT_METADATA_KEY,
  AuditMetadata,
} from "../decorators/audit.decorator";
import { generateAuditDescription } from "../helpers/generate-description";
import { AuditAction } from "../enums/audit-action.enum";

@Injectable()
export class AuditTrailInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const metadata: AuditMetadata = this.reflector.get(
      AUDIT_METADATA_KEY,
      context.getHandler(),
    );

    if (!metadata) return next.handle();

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return next.handle().pipe(
      tap(async (result) => {
        const args = context.getArgs();

        await this.auditTrailService.create({
          entity: metadata.entity,
          action: metadata.action,
          entityId: metadata.getEntityId?.(args) ?? "unknown",
          changes: metadata.getChanges?.(args, result) ?? {},
          performedBy: user?.id ?? null,
          performedAt: new Date(),
          description: generateAuditDescription(
            metadata.action as AuditAction,
            metadata.entity,
            metadata.getChanges?.(args, result) ?? {},
          ),
        });
      }),
    );
  }
}
