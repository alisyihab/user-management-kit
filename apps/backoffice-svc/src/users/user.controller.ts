import 'reflect-metadata';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  PermissionGuard,
  Permission,
  JwtAuthGuard,
  successResponse,
} from '@libs/common/src';
import {
  ApiPaginatedResponse,
  ApiResponseModel,
  GlobalResponse,
} from '@libs/common/src';
import { UserDto } from './dto/response/user-list.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserDetailDto } from './dto/response/user.dto';
import { CreateUserDto } from './dto/request/create-user.dto';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { UserFilter } from './dto/request/index-filter.dto';
import { UserStatus } from '@prisma/client';
import { Audit, AuditAction, AuditTrailInterceptor } from '@libs/audit-trail';

@ApiTags('Users')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditTrailInterceptor)
@Controller('backoffice/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Permission('USER_LIST', 'Users', 'Mengizinkan untuk melihat daftar users')
  @ApiOperation({ summary: 'Get all users with role name' })
  @ApiPaginatedResponse(UserDto)
  @Get()
  @Audit({
    entity: 'Users',
    action: AuditAction.GET,
  })
  async findAll(
    @Query() query: UserFilter,
  ): Promise<GlobalResponse<UserDto[]>> {
    const { data, meta } = await this.userService.getUsers(query);

    return successResponse(data, 'User list retrieved successfully', meta);
  }

  @Permission(
    'USER_DETAIL',
    'Users',
    'Mengizinkan untuk melihat users berdasakan ID',
  )
  @ApiResponseModel(UserDetailDto)
  @ApiOperation({ summary: 'Get user by user_id' })
  @Get(':id')
  @Audit({
    entity: 'Users',
    action: AuditAction.SHOW,
    getEntityId: (args) => args[0]?.id,
  })
  async getUserId(@Param('id') id: string) {
    const user = await this.userService.getUserById(id);

    return successResponse(user, 'Success get data users');
  }

  @Permission('USER_CREATE', 'Users', 'Mengizinkan untuk membuat user baru')
  @ApiResponseModel(null, 201)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new user' })
  @Post()
    @Audit({
    entity: 'Users',
    action: AuditAction.CREATE,
    getChanges: (_, result) => ({
      before: null,
      after: result,
    }),
  })
  async store(@Body() dto: CreateUserDto) {
    const response = await this.userService.createUser(dto);

    return successResponse(null, response, null, 201);
  }

  @Permission(
    'USER_UPDATE',
    'Users',
    'Mengizinkan untuk mengubah user berdasarkan ID',
  )
  @ApiResponseModel(UserDto, 200)
  @ApiOperation({ summary: 'Update user by ID' })
  @Patch(':id/update')
  @Audit({
    entity: 'Users',
    action: AuditAction.UPDATE,
    getEntityId: (args) => args[0]?.id,
    getChanges: (args, result) => ({
      before: args[1],
      after: result,
    }),
  })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.userService.updateUser(id, dto);

    return successResponse(user, 'User successfully updated', null, 200);
  }

  @Permission(
    'USER_STATUS',
    'Users',
    'Mengizinkan untuk mengubah status user berdasarkan ID',
  )
  @ApiOperation({ summary: 'Change user status by ID' })
  @ApiResponseModel(null, 200)
  @Patch(':id/status')
  @Audit({
    entity: 'Users',
    action: AuditAction.UPDATE,
    getEntityId: (args) => args[0]?.id,
    getChanges: (args, result) => ({
      before: args[1]?.oldData,
      after: result,
    }),
  })
  @HttpCode(HttpStatus.OK)
  async changeStatus(
    @Param('id') id: string,
    @Body('status') status: UserStatus,
  ): Promise<GlobalResponse<string>> {
    const response = await this.userService.updateUserStatus(id, status);

    return successResponse(null, response, null, 200);
  }
}
