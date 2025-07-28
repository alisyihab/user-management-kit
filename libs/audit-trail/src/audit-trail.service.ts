import { Injectable } from "@nestjs/common";
import { CreateAuditTrailDto } from "./dto/create-audit-trail.dto";
import { PrismaService } from "../../database/src";

@Injectable()
export class AuditTrailService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAuditTrailDto) {
    return this.prisma.auditTrail.create({
      data: {
        action: dto.action,
        entity: dto.entity,
        entityId: dto.entityId,
        changes: dto.changes,
        performedBy: dto.performedBy ?? null,
        description: dto.description ?? null,
        performedAt: dto.performedAt ?? new Date(),
      },
    });
  }
}
