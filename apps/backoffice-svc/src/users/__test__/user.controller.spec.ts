import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { PaginationDto } from '@libs/common/src/dto/src';
import { UserDto } from '../dto/response/user-list.dto';
import { CreateUserDto } from '../dto/request/create-user.dto';
import { UpdateUserDto } from '../dto/request/update-user.dto';
import { NotFoundException } from '@nestjs/common';
import {
  JwtAuthGuard,
  PermissionGuard,
  successResponse,
} from '@libs/common/src';
import { PrismaService } from '@libs/database/src';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { AuditTrailService } from '@libs/audit-trail';

// Mock the Permission decorator to avoid metadata errors
jest.mock('@libs/common/src', () => ({
  Permission: () => () => {},
}));

// Mock successResponse
jest.mock('@libs/common/src', () => ({
  ...jest.requireActual('@libs/common/src'),
  successResponse: jest.fn(),
}));

// Mock AuditTrailService
const mockAuditTrailService = {
  create: jest.fn(),
};

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    getUsers: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    updateUserStatus: jest.fn(),
  };

  const mockPrismaService = {
    permission: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 'perm1', name: 'user-management' }),
    },
    rolePermission: {
      findFirst: jest
        .fn()
        .mockResolvedValue({ role_id: 'role1', permission_id: 'perm1' }),
    },
  };

  const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };
  const mockPermissionGuard = { canActivate: jest.fn(() => true) };

  // Sample DTOs and data
  const paginationDto: PaginationDto = { page: 1, limit: 10 };
  const mockUserDto: UserDto = {
    id: '1',
    username: 'updateduser',
    email: 'updated@example.com',
    name: 'Updated User',
    role: 'admin',
    createdAt: new Date('2025-07-09T14:36:07.911Z'),
  };

  const mockCreateUserDto: CreateUserDto = {
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
    password: 'password123',
    roleId: 'role-id-123',
  };
  const mockUpdateUserDto: UpdateUserDto = {
    name: 'Updated User',
    username: 'updateduser',
    email: 'updated@example.com',
    password: 'newpassword',
    roleId: 'role2',
  };
  const mockMinimalUpdateUserDto: UpdateUserDto = {
    name: 'Minimal User',
    username: 'minimaluser',
    email: 'minimal@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
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
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(PermissionGuard)
      .useValue(mockPermissionGuard)
      .compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll : GET', () => {
    it('should return paginated users', async () => {
      const mockResponse = {
        data: [mockUserDto],
        meta: { total: 1, page: 1, limit: 10 },
      };

      mockUserService.getUsers.mockResolvedValueOnce(mockResponse);
      (successResponse as jest.Mock).mockReturnValueOnce({
        statusCode: 200,
        message: 'User list retrieved successfully',
        data: mockResponse.data,
        meta: mockResponse.meta,
      });

      const result = await controller.findAll(paginationDto);

      expect(service.getUsers).toHaveBeenCalledWith(paginationDto);
      expect(successResponse).toHaveBeenCalledWith(
        mockResponse.data,
        'User list retrieved successfully',
        mockResponse.meta,
      );
      expect(result).toEqual({
        statusCode: 200,
        message: 'User list retrieved successfully',
        data: mockResponse.data,
        meta: mockResponse.meta,
      });
    });

    it('should handle empty user list', async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 1, limit: 10 },
      };

      mockUserService.getUsers.mockResolvedValueOnce(mockResponse);
      (successResponse as jest.Mock).mockReturnValueOnce({
        statusCode: 200,
        message: 'User list retrieved successfully',
        data: [],
        meta: mockResponse.meta,
      });

      const result = await controller.findAll(paginationDto);

      expect(service.getUsers).toHaveBeenCalledWith(paginationDto);
      expect(successResponse).toHaveBeenCalledWith(
        [],
        'User list retrieved successfully',
        mockResponse.meta,
      );
      expect(result).toEqual({
        statusCode: 200,
        message: 'User list retrieved successfully',
        data: [],
        meta: mockResponse.meta,
      });
    });
  });

  describe('store : POST', () => {
    it('should create user successfully', async () => {
      mockUserService.createUser.mockResolvedValueOnce(
        'User Test User successfully created',
      );
      (successResponse as jest.Mock).mockReturnValueOnce({
        statusCode: 201,
        message: 'User Test User successfully created',
      });

      const result = await controller.store(mockCreateUserDto);

      expect(service.createUser).toHaveBeenCalledWith(mockCreateUserDto);
      expect(successResponse).toHaveBeenCalledWith(
        null,
        'User Test User successfully created',
        null,
        201,
      );
      expect(result).toEqual({
        statusCode: 201,
        message: 'User Test User successfully created',
      });
    });

    it('should throw NotFoundException if role not found', async () => {
      mockUserService.createUser.mockRejectedValueOnce(
        new NotFoundException('Role not found'),
      );

      await expect(controller.store(mockCreateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.createUser).toHaveBeenCalledWith(mockCreateUserDto);
    });
  });

  describe('update : PATCH', () => {
    it('should update user successfully', async () => {
      mockUserService.updateUser.mockResolvedValueOnce(mockUserDto);
      (successResponse as jest.Mock).mockReturnValueOnce({
        statusCode: 200,
        message: 'User successfully updated',
        data: mockUserDto,
      });

      const result = await controller.update('1', mockUpdateUserDto);

      expect(service.updateUser).toHaveBeenCalledWith('1', mockUpdateUserDto);
      expect(successResponse).toHaveBeenCalledWith(
        mockUserDto,
        'User successfully updated',
        null,
        200,
      );
      expect(result).toEqual({
        statusCode: 200,
        message: 'User successfully updated',
        data: mockUserDto,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserService.updateUser.mockRejectedValueOnce(
        new NotFoundException('User not found'),
      );

      await expect(controller.update('1', mockUpdateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.updateUser).toHaveBeenCalledWith('1', mockUpdateUserDto);
    });

    it('should handle minimal DTO and throw NotFoundException', async () => {
      mockUserService.updateUser.mockRejectedValueOnce(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.update('1', mockMinimalUpdateUserDto),
      ).rejects.toThrow(NotFoundException);
      expect(service.updateUser).toHaveBeenCalledWith(
        '1',
        mockMinimalUpdateUserDto,
      );
    });
  });

  describe('changeStatus : PATCH', () => {
    it('should change user status successfully', async () => {
      const mockResponse = 'User status updated to SUSPENDED';
      mockUserService.updateUserStatus = jest
        .fn()
        .mockResolvedValueOnce(mockResponse);
      (successResponse as jest.Mock).mockReturnValueOnce({
        statusCode: 200,
        message: mockResponse,
      });

      const result = await controller.changeStatus('1', 'SUSPENDED');

      expect(service.updateUserStatus).toHaveBeenCalledWith('1', 'SUSPENDED');
      expect(successResponse).toHaveBeenCalledWith(
        null,
        mockResponse,
        null,
        200,
      );
      expect(result).toEqual({
        statusCode: 200,
        message: mockResponse,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserService.updateUserStatus.mockRejectedValueOnce(
        new NotFoundException('User not found'),
      );

      await expect(controller.changeStatus('1', 'SUSPENDED')).rejects.toThrow(
        NotFoundException,
      );
      expect(service.updateUserStatus).toHaveBeenCalledWith('1', 'SUSPENDED');
    });
  });
});
