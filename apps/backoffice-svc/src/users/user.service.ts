import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  getPaginationParams,
  buildSearchFilter,
  buildOrderBy,
  PaginationMetaDto,
} from '@libs/common/src';
import { PrismaService } from '@libs/database/src';
import { UserDto } from './dto/response/user-list.dto';
import { CreateUserDto } from './dto/request/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { UserFilter } from './dto/request/index-filter.dto';
import { UploadService } from '@libs/upload';
import { Express } from 'express';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

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

  async createUser(dto: CreateUserDto, file?: Express.Multer.File) {
    // cek role
    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // upload image jika ada
    let photoUrl: string | null = null;
    let photoId: string | null = null;

    if (file) {
      try {
        const uploadResult = await this.uploadService.upload(file);
        // uploadResult: { url, id }
        photoUrl = uploadResult.url;
        photoId = uploadResult.id;
      } catch (err) {
        throw new InternalServerErrorException('Failed to upload image');
      }
    }

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        photo: photoUrl ?? null,
        photoID: photoId ?? null,
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

  async updateUser(
    id: string,
    dto: UpdateUserDto,
    file?: Express.Multer.File,
  ): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // prepare data
    const data: any = {
      name: dto.name ?? undefined,
      username: dto.username ?? undefined,
      email: dto.email ?? undefined,
    };

    if (dto.password) {
      const hashed = await bcrypt.hash(dto.password, 10);
      data.password = hashed;
    }

    // If file present => upload new file first
    let newUpload: { url: string; id: string } | null = null;
    if (file) {
      try {
        newUpload = await this.uploadService.upload(file);
        // set to be used in DB update
        data.photo = newUpload.url;
        data.photoID = newUpload.id;
      } catch (err) {
        console.error('Failed to upload new image:', err);
        throw new InternalServerErrorException('Failed to upload image');
      }
    }

    // perform DB update (roles handled separately below)
    try {
      await this.prisma.user.update({
        where: { id },
        data,
      });
    } catch (err) {
      // rollback: if uploaded new file but DB update failed -> delete new upload
      if (newUpload) {
        try {
          await this.uploadService.delete(newUpload.id);
        } catch (delErr) {
          console.error(
            'Failed to rollback uploaded image after DB error:',
            delErr,
          );
        }
      }
      // bubble up
      throw new InternalServerErrorException('Failed to update user');
    }

    // Update role if provided (separate transaction)
    if (dto.roleId) {
      // optional: validate role exists
      const role = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
      });
      if (!role) {
        // If role invalid and we already uploaded new file, could choose to rollback upload.
        // For simplicity, throw error (DB already updated) — caller can handle or we can revert.
        throw new NotFoundException('Role not found');
      }

      await this.prisma.user.update({
        where: { id },
        data: {
          roles: {
            set: [{ id: dto.roleId }],
          },
        },
      });
    }

    // After successful DB update, if newUpload exists and user had previous photo => delete old
    if (newUpload && user.photoID) {
      try {
        await this.uploadService.delete(user.photoID);
      } catch (err) {
        // don't fail update if deletion of old file fails; just log
        console.error('Failed to delete old photo:', err);
      }
    }

    // return final user DTO
    const finalUser = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });

    if (!finalUser) throw new NotFoundException('User not found after update');

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
