import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '../enums/audit-action.enum';

export const AUDIT_METADATA_KEY = 'audit:metadata';

export interface AuditMetadata {
  entity: string;
  action: AuditAction;
  getEntityId?: (args: any[]) => string;
  getChanges?: (args: any[], result: any) => Record<string, any>;
}

export const Audit = (metadata: AuditMetadata) =>
  SetMetadata(AUDIT_METADATA_KEY, metadata);
