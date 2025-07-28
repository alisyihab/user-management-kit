import { ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '@prisma/client';

const mockUser = {
  id: 'user-id-123',
  email: 'test@example.com',
  username: 'superadmin',
  name: 'Super Admin',
  password: 'hashedPassword',
  createdAt: new Date(),
  roles: [{ name: 'SUPERADMIN', id: 'role-id-123' }],
};

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let prismaService: any;

  beforeEach(() => {
    jwtService = new JwtService({ secret: 'test' });

    // Mock PrismaService
    prismaService = {
      user: {
        findFirst: jest.fn(),
      },
      role: {
        findUnique: jest.fn(),
      },
    };

    authService = new AuthService(jwtService, prismaService);
  });

  describe('AuthService -> validateUser', () => {
    it('should return user if credentials are valid', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      const result = await authService.validateUser(
        'superadmin',
        'password123',
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      await expect(
        authService.validateUser('wronguser', 'password123'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      await expect(
        authService.validateUser('superadmin', 'wrongpass'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw ForbiddenException if user is inactive', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.INACTIVE };
      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue(inactiveUser);

      await expect(
        authService.validateUser('superadmin', 'password123'),
      ).rejects.toThrow(new ForbiddenException('Your account is inactive'));
    });

    it('should throw ForbiddenException if user is suspended', async () => {
      const suspendedUser = { ...mockUser, status: UserStatus.SUSPENDED };
      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue(suspendedUser);

      await expect(
        authService.validateUser('superadmin', 'password123'),
      ).rejects.toThrow(
        new ForbiddenException('Your account has been suspended'),
      );
    });
  });

  describe('Auth Controller login -> POST', () => {
    it('should return access_token and user details', async () => {
      const user = {
        ...mockUser,
        roles: [{ id: 'role-id-123', name: 'SUPERADMIN' }],
      };

      const mockRole = {
        id: 'role-id-123',
        name: 'SUPERADMIN',
        permissions: [
          {
            permission: { name: 'ADMIN_ACCESS' },
          },
        ],
      };

      jest.spyOn(prismaService.role, 'findUnique').mockResolvedValue(mockRole);

      const result = await authService.login(user);
      expect(result).toHaveProperty('access_token');
      expect(typeof result.access_token).toBe('string');
      expect(result.user).toHaveProperty('user_id', user.id);
      expect(result.user).toHaveProperty('username', user.username);
      expect(result.user).toHaveProperty('role', 'SUPERADMIN');
      expect(result).toHaveProperty('permissions', ['ADMIN_ACCESS']);
    });

    it('should throw ForbiddenException if role not found', async () => {
      jest.spyOn(prismaService.role, 'findUnique').mockResolvedValue(null);

      await expect(authService.login(mockUser)).rejects.toThrow(
        'Role not found for this user',
      );
    });
  });
});
