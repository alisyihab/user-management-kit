import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { PrismaService } from '@libs/database/src';
import { PaginationDto } from '@libs/common/src';
import { Role, User } from '@prisma/client';
import { CreateUserDto } from '../dto/request/create-user.dto';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  const mockUsers: (User & { roles: Role[] })[] = [
    {
      id: '1',
      username: 'user1',
      email: 'user1@example.com',
      name: 'User 1',
      password: '',
      status: 'ACTIVE',
      createdAt: new Date('2025-07-09T14:36:07.911Z'),
      updatedAt: new Date('2025-07-09T14:36:07.911Z'),
      roles: [
        {
          id: 'r1',
          name: 'admin',
          has_notifications: false,
          createdAt: new Date('2025-07-09T14:36:07.911Z'),
          updatedAt: new Date('2025-07-09T14:36:07.911Z'),
        },
      ],
    },
  ];

  const mockCount = 1;

  const mockUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedpassword',
    createdAt: new Date(),
    roles: [{ id: 'role1', name: 'user' }],
  };

  const mockUpdateUserDto = {
    name: 'Updated User',
    username: 'updateduser',
    email: 'updated@example.com',
    password: 'newpassword',
    roleId: 'role2',
  };

  const prismaMock = {
    user: {
      findMany: jest.fn().mockResolvedValue(mockUsers),
      count: jest.fn().mockResolvedValue(mockCount),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getUsers', () => {
    it('should return paginated users excluding superadmin', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };

      const result = await service.getUsers(paginationDto);

      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(prisma.user.count).toHaveBeenCalled();

      expect(result).toMatchObject({
        data: [
          {
            id: '1',
            username: 'user1',
            email: 'user1@example.com',
            name: 'User 1',
            role: 'admin',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
        },
      });
    });

    it('should return empty array and correct meta if no user found', async () => {
      prismaMock.user.findMany.mockResolvedValueOnce([]);
      prismaMock.user.count.mockResolvedValueOnce(0);

      const paginationDto: PaginationDto = { page: 1, limit: 10 };

      const result = await service.getUsers(paginationDto);

      expect(result).toEqual({
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
        },
      });
    });

    it('should call findMany with correct search filter', async () => {
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        search: 'user',
      };

      await service.getUsers(paginationDto);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { username: expect.any(Object) },
              { email: expect.any(Object) },
              { name: expect.any(Object) },
            ]),
          }),
        }),
      );
    });
  });

  describe('createUser', () => {
    it('should throw NotFoundException if role not found', async () => {
      prismaMock.role.findUnique.mockResolvedValue(null);

      const dto: CreateUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        roleId: 'role-id-not-found',
      };

      await expect(service.createUser(dto)).rejects.toThrow(NotFoundException);
      expect(prismaMock.role.findUnique).toBeCalledWith({
        where: { id: dto.roleId },
      });
    });

    it('should create a new user with hashed password', async () => {
      const dto: CreateUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        roleId: 'role-id-123',
      };

      const hashed = await bcrypt.hash(dto.password, 10);

      prismaMock.role.findUnique.mockResolvedValue({ id: dto.roleId });
      prismaMock.user.create.mockResolvedValue({
        id: 'user-id-1',
        username: dto.username,
        email: dto.email,
        name: dto.name,
        password: hashed,
        createdAt: new Date(),
        roles: [{ name: 'admin' }],
      });

      const result = await service.createUser(dto);

      expect(prismaMock.user.create).toBeCalledWith({
        data: {
          username: dto.username,
          email: dto.email,
          name: dto.name,
          password: expect.any(String),
          roles: {
            connect: { id: dto.roleId },
          },
        },
        include: {
          roles: true,
        },
      });

      expect(result).toBe('User Test User successfully created');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully with all fields', async () => {
      const updatedUser = {
        ...mockUser,
        ...mockUpdateUserDto,
        password: 'newhashedpassword',
        roles: [{ id: 'role2', name: 'admin' }],
      };

      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('newhashedpassword'));
      prismaMock.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(updatedUser);
      prismaMock.user.update
        .mockResolvedValueOnce(updatedUser)
        .mockResolvedValueOnce(updatedUser);

      const result = await service.updateUser('1', mockUpdateUserDto);

      expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.user.update).toHaveBeenCalledTimes(2);
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(result).toEqual({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name,
        role: 'admin',
        createdAt: updatedUser.createdAt,
      });
    });

    it('should update user without password and roleId', async () => {
      const updateDto = {
        name: 'Updated User',
        username: 'updateduser',
        email: 'updated@example.com',
      };
      const updatedUser = {
        ...mockUser,
        ...updateDto,
      };

      prismaMock.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(updatedUser);
      prismaMock.user.update.mockResolvedValueOnce(updatedUser);

      const result = await service.updateUser('1', updateDto);

      expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.user.update).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(result).toEqual({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name,
        role: mockUser.roles[0].name,
        createdAt: updatedUser.createdAt,
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.updateUser('1', mockUpdateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user is not found after update', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      prismaMock.user.update
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser);

      await expect(service.updateUser('1', mockUpdateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
      expect(prisma.user.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status successfully', async () => {
      const user = { ...mockUser, status: 'ACTIVE' };
      prismaMock.user.findUnique.mockResolvedValueOnce(user);
      prismaMock.user.update.mockResolvedValueOnce({
        ...user,
        status: 'SUSPENDED',
      });

      const result = await service.updateUserStatus('1', 'SUSPENDED');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'SUSPENDED' },
      });

      expect(result).toEqual('User status updated to SUSPENDED');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.updateUserStatus('1', 'SUSPENDED')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});
