import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@libs/database/src';
import { AssignPermissionToRoleDto } from './dto/request/assign-permission';
import {
  GroupedPermissionDto,
  PermissionResponseDto,
} from './dto/response/get-role-permissions';
import { PaginationDto, PaginationMetaDto } from '@libs/common/src/dto/src';
import { RolesDto } from './dto/response/roles.dto';
import {
  buildOrderBy,
  buildSearchFilter,
  getPaginationParams,
} from '@libs/common/src';
import { CreateRoleDto } from './dto/request/create-role';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async assignPermissionsToRole(
    roleId: string,
    dto: AssignPermissionToRoleDto,
  ): Promise<{ data: string[]; message: string }> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!role) throw new NotFoundException('Role not found');

    await this.prisma.role.update({
      where: { id: roleId },
      data: {
        name: dto.name,
        has_notifications: dto.hasNotification,
      },
    });

    for (const permission of dto.permissions) {
      const whereCondition = {
        role_id: roleId,
        permission_id: permission.permissionId,
      };
      if (permission.checked) {
        await this.prisma.rolePermission.upsert({
          where: { role_id_permission_id: whereCondition },
          update: {},
          create: {
            role_id: roleId,
            permission_id: permission.permissionId,
          },
        });
      } else {
        await this.prisma.rolePermission.deleteMany({ where: whereCondition });
      }
    }

    // <-- perbaikan di sini
    const assignedPermissions = await this.prisma.rolePermission.findMany({
      where: { role_id: roleId },
      include: {
        permission: { select: { name: true } },
      },
    });

    return {
      message: 'Role permissions updated successfully',
      data: assignedPermissions.map((rp) => rp.permission.name),
    };
  }

  async getRolePermissions(roleId: string): Promise<GroupedPermissionDto[]> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) throw new NotFoundException('Role not found');

    // Fetch all RolePermission records for the role
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role_id: roleId },
      select: { permission_id: true },
    });

    // Fetch all permissions, ordered by name
    const permissions = await this.prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });

    // Create a map of permission IDs for quick lookup
    const permissionIds = new Map(
      rolePermissions.map((rp) => [rp.permission_id, true]),
    );

    // Transform permissions with checked property
    const permissionResponses: PermissionResponseDto[] = permissions.map(
      (p) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? undefined,
        module: p.module,
        checked: permissionIds.has(p.id),
      }),
    );

    // Group permissions by module
    const groupedByModule = permissionResponses.reduce((acc, perm) => {
      const existingGroup = acc.find((group) => group.module === perm.module);
      if (existingGroup) {
        existingGroup.permissions.push(perm);
      } else {
        acc.push({ module: perm.module, permissions: [perm] });
      }
      return acc;
    }, [] as GroupedPermissionDto[]);

    return groupedByModule;
  }

  async getRoles(options: PaginationDto): Promise<{
    data: RolesDto[];
    meta: PaginationMetaDto;
  }> {
    const { skip, limit, page } = getPaginationParams(options);
    const searchFilter = buildSearchFilter(options.search, ['name']);
    const exclusionFilter = {
      ...searchFilter,
      NOT: {
        name: 'superadmin',
      },
    };

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where: exclusionFilter,
        skip,
        take: limit,
        orderBy: buildOrderBy(options.orderBy, options.order),
      }),
      this.prisma.role.count({
        where: exclusionFilter,
      }),
    ]);

    return {
      data: roles,
      meta: { total, page, limit },
    };
  }

  async createRole(dto: CreateRoleDto): Promise<string> {
    const role = await this.prisma.role.create({
      data: { dto },
    });

    return `Role ${role.name} successfully created`;
  }
}
