import { AuditAction } from "../enums/audit-action.enum";

export class CreateAuditTrailDto {
  action!: AuditAction;
  entity!: string;
  entityId!: string;
  changes!: Record<string, any>;
  description?: string;
  performedBy?: string;
  performedAt?: Date;
}
