import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from '../role.controller';
import { RoleService } from '../role.service';
import { AssignPermissionToRoleDto } from '../dto/request/assign-permission';
import { GroupedPermissionDto } from '../dto/response/get-role-permissions';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@libs/database/src';
import { successResponse } from '@libs/common/src';
import { PaginationDto } from '@libs/common/src/dto/src';
import { RolesDto } from '../dto/response/roles.dto';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { AuditTrailService } from '@libs/audit-trail';

// Mock successResponse
jest.mock('@libs/common/src', () => {
  const originalModule = jest.requireActual('@libs/common/src');

  return {
    ...originalModule,
    successResponse: jest.fn(),
    Permission: () => () => {},
  };
});

// Mock PrismaService
const mockPrismaService = {
  role: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  permission: {
    findMany: jest.fn(),
  },
  rolePermission: {
    findFirst: jest
      .fn()
      .mockResolvedValue({ role_id: 'role1', permission_id: 'perm1' }),
  },
};

// Mock PermissionGuard
const mockPermissionGuard = {
  canActivate: jest.fn(() => true),
};

// Mock AuditTrailService
const mockAuditTrailService = {
  create: jest.fn(),
};

describe('RoleController', () => {
  let controller: RoleController;
  let roleService: RoleService;

  const mockRoleService = {
    assignPermissionsToRole: jest.fn(),
    getRolePermissions: jest.fn(),
    getRoles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        { provide: RoleService, useValue: mockRoleService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: Reflector, useValue: new Reflector() },
        { provide: AuditTrailService, useValue: mockAuditTrailService },
        {
          provide: APP_INTERCEPTOR,
          useValue: {
            intercept: jest.fn((ctx, next) => next.handle()),
          },
        },
      ],
    })
      .overrideGuard('PermissionGuard')
      .useValue(mockPermissionGuard)
      .compile();

    controller = module.get<RoleController>(RoleController);
    roleService = module.get<RoleService>(RoleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('assignPermissionsToRole : PATCH', () => {
    const roleId = 'role-123';
    const dto: AssignPermissionToRoleDto = {
      name: 'Editor',
      hasNotification: true,
      permissions: [{ permissionId: 'perm-1', checked: true }],
    };
    const successMessage = 'Role permissions updated successfully';

    it('should assign permissions to a role, return success message, and data permissions', async () => {
      const roleId = 'role-id';
      const dto: AssignPermissionToRoleDto = {
        name: 'Admin',
        hasNotification: true,
        permissions: [
          {
            permissionId: 'perm-1',
            checked: true,
          },
        ],
      };

      const expectedData = ['perm-1'];
      const expectedMessage = 'Role permissions updated successfully';

      // Service return value
      mockRoleService.assignPermissionsToRole.mockResolvedValue({
        data: expectedData,
        message: expectedMessage,
      });

      // Mock helper
      const expectedResponse = {
        statusCode: 200,
        message: expectedMessage,
        data: expectedData,
      };

      (successResponse as jest.Mock).mockReturnValue(expectedResponse);

      const result = await controller.updateRoleAndAssignPermissions(
        roleId,
        dto,
      );

      expect(mockRoleService.assignPermissionsToRole).toHaveBeenCalledWith(
        roleId,
        dto,
      );
      expect(successResponse).toHaveBeenCalledWith(
        expectedData,
        expectedMessage,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should throw NotFoundException if role is not found', async () => {
      mockRoleService.assignPermissionsToRole.mockRejectedValue(
        new NotFoundException('Role not found'),
      );

      await expect(
        controller.updateRoleAndAssignPermissions(roleId, dto),
      ).rejects.toThrow(NotFoundException);
      expect(mockRoleService.assignPermissionsToRole).toHaveBeenCalledWith(
        roleId,
        dto,
      );
    });

    it('should throw BadRequestException for invalid DTO', async () => {
      const invalidDto = {
        ...dto,
        permissions: [{ permissionId: '', checked: true }],
      };
      mockRoleService.assignPermissionsToRole.mockRejectedValue(
        new BadRequestException('Invalid permission ID'),
      );

      await expect(
        controller.updateRoleAndAssignPermissions(roleId, invalidDto),
      ).rejects.toThrow(BadRequestException);
      expect(mockRoleService.assignPermissionsToRole).toHaveBeenCalledWith(
        roleId,
        invalidDto,
      );
    });
  });

  describe('getRolePermissions : GET', () => {
    const roleId = 'role-123';
    const mockPermissions: GroupedPermissionDto[] = [
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

    it('should return grouped permissions for an existing role', async () => {
      mockRoleService.getRolePermissions.mockResolvedValue(mockPermissions);
      const expectedResponse = {
        statusCode: 200,
        message: 'Success get role permissions',
        data: mockPermissions,
      };
      (successResponse as jest.Mock).mockReturnValue(expectedResponse);

      const result = await controller.getRolePermissionsHandler(roleId);

      expect(mockRoleService.getRolePermissions).toHaveBeenCalledWith(roleId);
      expect(successResponse).toHaveBeenCalledWith(
        mockPermissions,
        'Success get role permissions',
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should throw NotFoundException if role is not found', async () => {
      mockRoleService.getRolePermissions.mockRejectedValue(
        new NotFoundException('Role not found'),
      );

      await expect(
        controller.getRolePermissionsHandler(roleId),
      ).rejects.toThrow(NotFoundException);
      expect(mockRoleService.getRolePermissions).toHaveBeenCalledWith(roleId);
    });

    it('should return empty array when no permissions exist', async () => {
      const emptyPermissions: GroupedPermissionDto[] = [];
      mockRoleService.getRolePermissions.mockResolvedValue(emptyPermissions);
      const expectedResponse = {
        statusCode: 200,
        message: 'Success get role permissions',
        data: emptyPermissions,
      };
      (successResponse as jest.Mock).mockReturnValue(expectedResponse);

      const result = await controller.getRolePermissionsHandler(roleId);

      expect(mockRoleService.getRolePermissions).toHaveBeenCalledWith(roleId);
      expect(successResponse).toHaveBeenCalledWith(
        emptyPermissions,
        'Success get role permissions',
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('listRoles : GET', () => {
    const paginationDto: PaginationDto = { page: 1, limit: 10 };
    const mockResponse = {
      data: [
        {
          id: 'rol-1',
          name: 'superadmin',
          has_notifications: false,
          createdAt: new Date('2025-07-09T14:36:07.911Z'),
        } as RolesDto,
      ],
      meta: {
        total: 1,
        page: 1,
        limit: 10,
      },
      message: 'Role list retrieved successfully',
      statusCode: 200,
    };

    it('should return paginated roles and success message with 200 status', async () => {
      mockRoleService.getRoles.mockResolvedValue(mockResponse);
      (successResponse as jest.Mock).mockReturnValue(mockResponse);

      const result = await controller.listRoles(paginationDto);

      expect(mockRoleService.getRoles).toHaveBeenCalledWith(paginationDto);
      expect(successResponse).toHaveBeenCalledWith(
        mockResponse.data,
        mockResponse.message,
        mockResponse.meta,
      );
      expect(result).toEqual(mockResponse);
      expect(result.message).toBe('Role list retrieved successfully');
      expect(result.statusCode).toBe(200);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
      });
    });

    it('should handle empty role list', async () => {
      const emptyResponse = {
        data: [],
        meta: { total: 0, page: 1, limit: 10 },
        message: 'Role list retrieved successfully',
        statusCode: 200,
      };
      mockRoleService.getRoles.mockResolvedValue(emptyResponse);
      (successResponse as jest.Mock).mockReturnValue(emptyResponse);

      const result = await controller.listRoles(paginationDto);

      expect(mockRoleService.getRoles).toHaveBeenCalledWith(paginationDto);
      expect(successResponse).toHaveBeenCalledWith(
        emptyResponse.data,
        emptyResponse.message,
        emptyResponse.meta,
      );
      expect(result).toEqual(emptyResponse);
      expect(result.data).toEqual([]);
      expect(result.meta.total).toEqual(0);
    });

    it('should throw BadRequestException for invalid pagination', async () => {
      const invalidPagination: PaginationDto = { page: 0, limit: -10 };
      mockRoleService.getRoles.mockRejectedValue(
        new BadRequestException('Invalid pagination parameters'),
      );

      await expect(controller.listRoles(invalidPagination)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRoleService.getRoles).toHaveBeenCalledWith(invalidPagination);
    });
  });
});
