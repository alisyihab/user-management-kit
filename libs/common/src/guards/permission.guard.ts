import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "@libs/database/src";
import { PERMISSION_KEY } from "../decorators/permission.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Cek apakah route publik
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Ambil metadata dari decorator @Permission
    const metadata = this.reflector.getAllAndOverride<{ name: string }>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!metadata?.name) return true;

    // Ambil user dari request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new UnauthorizedException("User role is missing or unauthorized.");
    }

    // Cek apakah permission-nya ada
    const permission = await this.prisma.permission.findUnique({
      where: { name: metadata.name },
    });

    if (!permission) {
      throw new ForbiddenException(
        `Permission "${metadata.name}" not found in system.`,
      );
    }

    // Cek apakah role user punya permission
    const rolePermission = await this.prisma.rolePermission.findFirst({
      where: {
        role_id: user.role,
        permission_id: permission.id,
      },
    });

    if (!rolePermission) {
      throw new ForbiddenException(
        `Your role does not have access to "${metadata.name}".`,
      );
    }

    return true;
  }
}
