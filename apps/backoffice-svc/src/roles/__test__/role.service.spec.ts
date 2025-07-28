import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from '../role.service';
import { PrismaService } from '@libs/database/src';
import { AssignPermissionToRoleDto } from '../dto/request/assign-permission';
import {
  PermissionResponseDto,
  GroupedPermissionDto,
} from '../dto/response/get-role-permissions';
import { NotFoundException } from '@nestjs/common';
import { PaginationDto } from '@libs/common/src/dto/src';

describe('RoleService', () => {
  let service: RoleService;
  let prisma: PrismaService;

  const mockPrisma: {
    role: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    rolePermission: {
      upsert: jest.Mock;
      deleteMany: jest.Mock;
      findMany: jest.Mock;
    };
    permission: {
      findMany: jest.Mock;
    };
  } = {
    role: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    rolePermission: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    permission: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('assignPermissionsToRole', () => {
    const roleId = 'role-123';
    const dto: AssignPermissionToRoleDto = {
      name: 'Editor',
      hasNotification: true,
      permissions: [
        { permissionId: 'perm-1', checked: true },
        { permissionId: 'perm-2', checked: false },
      ],
    };

    it('should assign permissions and return success message with permission names', async () => {
      const role = {
        id: roleId,
        name: 'Editor',
        has_notifications: true,
        createdAt: new Date(),
      };
      const assignedPermissions = [
        {
          role_id: roleId,
          permission_id: 'perm-1',
          permission: { name: 'user.view' },
        },
      ];
      mockPrisma.role.findUnique.mockResolvedValue(role);
      mockPrisma.role.update.mockResolvedValue(role);
      mockPrisma.rolePermission.upsert.mockResolvedValue({
        role_id: roleId,
        permission_id: 'perm-1',
      });
      mockPrisma.rolePermission.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.rolePermission.findMany.mockResolvedValue(assignedPermissions);

      const result = await service.assignPermissionsToRole(roleId, dto);

      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: roleId },
      });
      expect(mockPrisma.role.update).toHaveBeenCalledWith({
        where: { id: roleId },
        data: { name: dto.name, has_notifications: dto.hasNotification },
      });
      expect(mockPrisma.rolePermission.upsert).toHaveBeenCalledWith({
        where: {
          role_id_permission_id: { role_id: roleId, permission_id: 'perm-1' },
        },
        update: {},
        create: { role_id: roleId, permission_id: 'perm-1' },
      });
      expect(mockPrisma.rolePermission.deleteMany).toHaveBeenCalledWith({
        where: { role_id: roleId, permission_id: 'perm-2' },
      });
      expect(mockPrisma.rolePermission.findMany).toHaveBeenCalledWith({
        where: { role_id: roleId },
        include: { permission: { select: { name: true } } },
      });
      expect(result).toEqual({
        message: 'Role permissions updated successfully',
        data: ['user.view'],
      });
    });

    it('should throw NotFoundException if role is not found', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(
        service.assignPermissionsToRole('non-existing-role', dto),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existing-role' },
      });
      expect(mockPrisma.role.update).not.toHaveBeenCalled();
      expect(mockPrisma.rolePermission.upsert).not.toHaveBeenCalled();
      expect(mockPrisma.rolePermission.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.rolePermission.findMany).not.toHaveBeenCalled();
    });

    it('should update role and assign permissions correctly', async () => {
      const role = {
        id: roleId,
        name: 'Editor',
        has_notifications: true,
        createdAt: new Date('2025-07-09T14:36:07.911Z'),
      };
      const assignedPermissions = [
        {
          role_id: roleId,
          permission_id: 'perm-1',
          permission: { name: 'user.view' },
        },
      ];
      mockPrisma.role.findUnique.mockResolvedValue(role);
      mockPrisma.role.update.mockResolvedValue(role);
      mockPrisma.rolePermission.upsert.mockResolvedValue({
        role_id: roleId,
        permission_id: 'perm-1',
      });
      mockPrisma.rolePermission.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.rolePermission.findMany.mockResolvedValue(assignedPermissions);

      const result = await service.assignPermissionsToRole(roleId, dto);

      expect(mockPrisma.role.update).toHaveBeenCalledWith({
        where: { id: roleId },
        data: { name: dto.name, has_notifications: dto.hasNotification },
      });
      expect(mockPrisma.rolePermission.upsert).toHaveBeenCalledWith({
        where: {
          role_id_permission_id: { role_id: roleId, permission_id: 'perm-1' },
        },
        update: {},
        create: { role_id: roleId, permission_id: 'perm-1' },
      });
      expect(mockPrisma.rolePermission.deleteMany).toHaveBeenCalledWith({
        where: { role_id: roleId, permission_id: 'perm-2' },
      });
      expect(mockPrisma.rolePermission.findMany).toHaveBeenCalledWith({
        where: { role_id: roleId },
        include: { permission: { select: { name: true } } },
      });
      expect(result).toEqual({
        message: 'Role permissions updated successfully',
        data: ['user.view'],
      });
    });

    it('should update role even if no permissions provided', async () => {
      const role = {
        id: 'role-456',
        name: 'Staff',
        has_notifications: false,
        createdAt: new Date('2025-07-09T14:36:07.911Z'),
      };
      mockPrisma.role.findUnique.mockResolvedValue(role);
      mockPrisma.role.update.mockResolvedValue(role);
      mockPrisma.rolePermission.findMany.mockResolvedValue([]); // Return empty permissions

      const dtoNoPermissions: AssignPermissionToRoleDto = {
        name: 'Staff',
        hasNotification: false,
        permissions: [],
      };

      const result = await service.assignPermissionsToRole(
        'role-456',
        dtoNoPermissions,
      );

      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-456' },
      });
      expect(mockPrisma.role.update).toHaveBeenCalledWith({
        where: { id: 'role-456' },
        data: { name: 'Staff', has_notifications: false },
      });
      expect(mockPrisma.rolePermission.upsert).not.toHaveBeenCalled();
      expect(mockPrisma.rolePermission.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.rolePermission.findMany).toHaveBeenCalledWith({
        where: { role_id: 'role-456' },
        include: { permission: { select: { name: true } } },
      });
      expect(result).toEqual({
        message: 'Role permissions updated successfully',
        data: [],
      });
    });

    it('should add a new permission to an existing role', async () => {
      const role = {
        id: 'role-789',
        name: 'Admin',
        has_notifications: false,
        createdAt: new Date('2025-07-09T14:36:07.911Z'),
      };
      const assignedPermissions = [
        {
          role_id: 'role-789',
          permission_id: 'perm-3',
          permission: { name: 'admin.edit' },
        },
      ];
      mockPrisma.role.findUnique.mockResolvedValue(role);
      mockPrisma.role.update.mockResolvedValue(role);
      mockPrisma.rolePermission.upsert.mockResolvedValue({
        role_id: 'role-789',
        permission_id: 'perm-3',
      });
      mockPrisma.rolePermission.findMany.mockResolvedValue(assignedPermissions);

      const dtoAddPermission: AssignPermissionToRoleDto = {
        name: 'Admin',
        hasNotification: false,
        permissions: [{ permissionId: 'perm-3', checked: true }],
      };

      const result = await service.assignPermissionsToRole(
        'role-789',
        dtoAddPermission,
      );

      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-789' },
      });
      expect(mockPrisma.role.update).toHaveBeenCalledWith({
        where: { id: 'role-789' },
        data: { name: 'Admin', has_notifications: false },
      });
      expect(mockPrisma.rolePermission.upsert).toHaveBeenCalledWith({
        where: {
          role_id_permission_id: {
            role_id: 'role-789',
            permission_id: 'perm-3',
          },
        },
        update: {},
        create: { role_id: 'role-789', permission_id: 'perm-3' },
      });
      expect(mockPrisma.rolePermission.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.rolePermission.findMany).toHaveBeenCalledWith({
        where: { role_id: 'role-789' },
        include: { permission: { select: { name: true } } },
      });
      expect(result).toEqual({
        message: 'Role permissions updated successfully',
        data: ['admin.edit'],
      });
    });
  });

  describe('getRolePermissions', () => {
    it('should return grouped permissions for an existing role', async () => {
      const role = {
        id: 'role-123',
        name: 'Editor',
        has_notifications: true,
        createdAt: new Date('2025-07-09T14:36:07.911Z'),
      };
      const rolePermissions = [
        { role_id: 'role-123', permission_id: 'perm-1' },
        { role_id: 'role-123', permission_id: 'perm-3' },
      ];
      const permissions = [
        {
          id: 'perm-1',
          name: 'Login',
          description: 'Allow user login',
          module: 'auth',
          createdAt: new Date('2025-07-09T14:36:07.911Z'),
        },
        {
          id: 'perm-2',
          name: 'Logout',
          description: 'Allow user logout',
          module: 'auth',
          createdAt: new Date('2025-07-09T14:36:07.911Z'),
        },
        {
          id: 'perm-3',
          name: 'Manage Users',
          description: 'Manage user accounts',
          module: 'admin',
          createdAt: new Date('2025-07-09T14:36:07.911Z'),
        },
      ];

      mockPrisma.role.findUnique.mockResolvedValue(role);
      mockPrisma.rolePermission.findMany.mockResolvedValue(rolePermissions);
      mockPrisma.permission.findMany.mockResolvedValue(permissions);

      const expected: GroupedPermissionDto[] = [
        {
          module: 'auth',
          permissions: [
            {
              id: 'perm-1',
              name: 'Login',
              description: 'Allow user login',
              module: 'auth',
              checked: true,
            },
            {
              id: 'perm-2',
              name: 'Logout',
              description: 'Allow user logout',
              module: 'auth',
              checked: false,
            },
          ],
        },
        {
          module: 'admin',
          permissions: [
            {
              id: 'perm-3',
              name: 'Manage Users',
              description: 'Manage user accounts',
              module: 'admin',
              checked: true,
            },
          ],
        },
      ];

      const result = await service.getRolePermissions('role-123');

      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-123' },
      });
      expect(mockPrisma.rolePermission.findMany).toHaveBeenCalledWith({
        where: { role_id: 'role-123' },
        select: { permission_id: true },
      });
      expect(mockPrisma.permission.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(expected);
    });

    it('should throw NotFoundException if role does not exist', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(
        service.getRolePermissions('non-existing-role'),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existing-role' },
      });
      expect(mockPrisma.rolePermission.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.permission.findMany).not.toHaveBeenCalled();
    });

    it('should return grouped permissions when role has no permissions', async () => {
      const role = {
        id: 'role-456',
        name: 'Staff',
        has_notifications: false,
        createdAt: new Date('2025-07-09T14:36:07.911Z'),
      };
      const permissions = [
        {
          id: 'perm-1',
          name: 'Login',
          description: 'Allow user login',
          module: 'auth',
          createdAt: new Date('2025-07-09T14:36:07.911Z'),
        },
        {
          id: 'perm-2',
          name: 'Logout',
          description: 'Allow user logout',
          module: 'auth',
          createdAt: new Date('2025-07-09T14:36:07.911Z'),
        },
      ];

      mockPrisma.role.findUnique.mockResolvedValue(role);
      mockPrisma.rolePermission.findMany.mockResolvedValue([]);
      mockPrisma.permission.findMany.mockResolvedValue(permissions);

      const expected: GroupedPermissionDto[] = [
        {
          module: 'auth',
          permissions: [
            {
              id: 'perm-1',
              name: 'Login',
              description: 'Allow user login',
              module: 'auth',
              checked: false,
            },
            {
              id: 'perm-2',
              name: 'Logout',
              description: 'Allow user logout',
              module: 'auth',
              checked: false,
            },
          ],
        },
      ];

      const result = await service.getRolePermissions('role-456');

      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-456' },
      });
      expect(mockPrisma.rolePermission.findMany).toHaveBeenCalledWith({
        where: { role_id: 'role-456' },
        select: { permission_id: true },
      });
      expect(mockPrisma.permission.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(expected);
    });

    it('should group permissions across multiple modules correctly', async () => {
      const role = {
        id: 'role-789',
        name: 'Admin',
        has_notifications: true,
        createdAt: new Date('2025-07-09T14:36:07.911Z'),
      };
      const rolePermissions = [
        { role_id: 'role-789', permission_id: 'perm-1' },
      ];
      const permissions = [
        {
          id: 'perm-1',
          name: 'Login',
          description: 'Allow user login',
          module: 'auth',
          createdAt: new Date('2025-07-09T14:36:07.911Z'),
        },
        {
          id: 'perm-2',
          name: 'Manage Users',
          description: 'Manage user accounts',
          module: 'admin',
          createdAt: new Date('2025-07-09T14:36:07.911Z'),
        },
      ];

      mockPrisma.role.findUnique.mockResolvedValue(role);
      mockPrisma.rolePermission.findMany.mockResolvedValue(rolePermissions);
      mockPrisma.permission.findMany.mockResolvedValue(permissions);

      const expected: GroupedPermissionDto[] = [
        {
          module: 'auth',
          permissions: [
            {
              id: 'perm-1',
              name: 'Login',
              description: 'Allow user login',
              module: 'auth',
              checked: true,
            },
          ],
        },
        {
          module: 'admin',
          permissions: [
            {
              id: 'perm-2',
              name: 'Manage Users',
              description: 'Manage user accounts',
              module: 'admin',
              checked: false,
            },
          ],
        },
      ];

      const result = await service.getRolePermissions('role-789');

      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-789' },
      });
      expect(mockPrisma.rolePermission.findMany).toHaveBeenCalledWith({
        where: { role_id: 'role-789' },
        select: { permission_id: true },
      });
      expect(mockPrisma.permission.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(expected);
    });

    it('should return empty array when no permissions exist', async () => {
      const role = {
        id: 'role-999',
        name: 'Guest',
        has_notifications: false,
        createdAt: new Date('2025-07-09T14:36:07.911Z'),
      };
      mockPrisma.role.findUnique.mockResolvedValue(role);
      mockPrisma.rolePermission.findMany.mockResolvedValue([]);
      mockPrisma.permission.findMany.mockResolvedValue([]);

      const expected: GroupedPermissionDto[] = [];

      const result = await service.getRolePermissions('role-999');

      expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-999' },
      });
      expect(mockPrisma.rolePermission.findMany).toHaveBeenCalledWith({
        where: { role_id: 'role-999' },
        select: { permission_id: true },
      });
      expect(mockPrisma.permission.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(expected);
    });
  });

  describe('getRoles', () => {
    it('should return empty array and correct meta if no roles found', async () => {
      mockPrisma.role.findMany.mockResolvedValue([]);
      mockPrisma.role.count.mockResolvedValue(0);

      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const result = await service.getRoles(paginationDto);

      expect(mockPrisma.role.findMany).toHaveBeenCalled();
      expect(mockPrisma.role.count).toHaveBeenCalled();
      expect(result).toEqual({
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
        },
      });
    });
  });
});
