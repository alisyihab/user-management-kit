import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@libs/database/src';
import { UserStatus } from '@prisma/client';

interface User {
  id: string;
  username: string;
  role_id?: string;
  roles?: { id: string }[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email: username.toLowerCase() },
        ],
      },
      include: { roles: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Cek apakah status user aktif
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Your account has been suspended');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException('Your account is inactive');
    }

    // Cek password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(user: User) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.roles?.[0]?.id ?? user.role_id,
    };

    const token = this.jwtService.sign(payload);

    const role = await this.prisma.role.findUnique({
      where: { id: user.roles?.[0].id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new ForbiddenException('Role not found for this user');
    }

    const permissions = role.permissions.map(
      (rp: { permission: { name: any } }) => rp.permission.name,
    );

    return {
      access_token: token,
      user: {
        user_id: user.id,
        username: user.username,
        role: role.name,
      },
      permissions,
    };
  }
}
