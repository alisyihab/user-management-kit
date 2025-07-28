import { Injectable, NestMiddleware } from "@nestjs/common";
import { PrismaService } from "../../../database/src";
import { Request, Response, NextFunction } from "express";

// Narrow to only string keys to avoid symbol issues in dynamic access
type EntityKey = Extract<keyof PrismaService, string>;

export function createFetchOldEntityMiddleware(entityName: EntityKey) {
  @Injectable()
  class FetchOldEntityMiddleware implements NestMiddleware {
    constructor(readonly prisma: PrismaService) {}

    async use(req: Request, res: Response, next: NextFunction) {
      const id = req.params?.id;
      if (!id) return next();

      const model = this.prisma[entityName] as any;

      if (typeof model?.findUnique !== "function") {
        console.warn(
          `[AuditTrail] "${entityName}" not found or unqueryable in PrismaService`,
        );
        return next();
      }

      try {
        const oldData = await model.findUnique({ where: { id } });
        req.oldData = oldData;
      } catch (error) {
        console.error(
          `[AuditTrail] Failed fetching old "${entityName}" data:`,
          error,
        );
      }

      next();
    }
  }

  return FetchOldEntityMiddleware;
}
