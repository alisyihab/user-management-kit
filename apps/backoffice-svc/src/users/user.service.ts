import { Injectable, NotFoundException } from '@nestjs/common';
import {
  getPaginationParams,
  buildSearchFilter,
  buildOrderBy,
  PaginationMetaDto
} from '@libs/common/src';
import { PrismaService } from '@libs/database/src';
import { UserDto } from './dto/response/user-list.dto';
import { CreateUserDto } from './dto/request/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { UserFilter } from './dto/request/index-filter.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      omit: {
        password: true,
      },
      include: {
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getUsers(options: UserFilter): Promise<{
    data: UserDto[];
    meta: PaginationMetaDto;
  }> {
    const { skip, limit, page } = getPaginationParams(options);

    const searchFilter = buildSearchFilter(options.search, [
      'username',
      'email',
      'name',
    ]);

    const baseWhereCondition = {
      ...searchFilter,
      status: options.status,
      roles: {
        none: {
          name: {
            equals: 'superadmin',
            mode: 'insensitive' as const,
          },
        },
      },
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: baseWhereCondition,
        skip,
        take: limit,
        orderBy: buildOrderBy(options.orderBy, options.order),
        include: {
          roles: true,
        },
      }),
      this.prisma.user.count({
        where: baseWhereCondition,
      }),
    ]);

    const userDtos: UserDto[] = users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.roles[0]?.name ?? '',
      createdAt: user.createdAt,
    }));

    return {
      data: userDtos,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async createUser(dto: CreateUserDto): Promise<string> {
    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        roles: {
          connect: { id: dto.roleId },
        },
      },
      include: {
        roles: true,
      },
    });

    return `User ${user.name} successfully created`;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const data: any = {
      name: dto.name,
      username: dto.username,
      email: dto.email,
    };

    if (dto.password) {
      const hashed = await bcrypt.hash(dto.password, 10);
      data.password = hashed;
    }

    await this.prisma.user.update({
      where: { id },
      data,
      include: { roles: true },
    });

    // Update role jika diubah
    if (dto.roleId) {
      await this.prisma.user.update({
        where: { id },
        data: {
          roles: {
            set: [{ id: dto.roleId }],
          },
        },
      });
    }

    const finalUser = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });

    if (!finalUser) {
      throw new NotFoundException('User not found after update');
    }

    return {
      id: finalUser.id,
      username: finalUser.username,
      email: finalUser.email,
      name: finalUser.name,
      role: finalUser.roles[0]?.name ?? '',
      createdAt: finalUser.createdAt,
    };
  }

  async updateUserStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
  ): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id },
      data: { status },
    });

    return `User status updated to ${status}`;
  }
}
