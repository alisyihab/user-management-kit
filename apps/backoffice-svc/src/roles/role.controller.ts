import {
  Controller,
  Patch,
  Param,
  Body,
  NotFoundException,
  HttpCode,
  HttpStatus,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
  Query,
  Post,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { AssignPermissionToRoleDto } from './dto/request/assign-permission';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  JwtAuthGuard,
  PermissionGuard,
  successResponse,
  ApiPaginatedResponse,
  ApiResponseModel,
  GlobalResponse,
  PaginationDto,
  ApiSimpleResponse,
  Permission,
} from '@libs/common/src';
import { GroupedPermissionDto } from './dto/response/get-role-permissions';
import { RolesDto } from './dto/response/roles.dto';
import { CreateRoleDto } from './dto/request/create-role';
import { Audit, AuditAction, AuditTrailInterceptor } from '@libs/audit-trail';

@ApiTags('Roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(AuditTrailInterceptor)
@Controller('backoffice/roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Permission('ROLE_LIST', 'Roles', 'Mengizinkan untuk melihat daftar Roles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all roles with pagination' })
  @ApiPaginatedResponse(RolesDto)
  @Get()
  @Audit({
    entity: 'Roles',
    action: AuditAction.GET,
  })
  async listRoles(
    @Query() query: PaginationDto,
  ): Promise<GlobalResponse<RolesDto[]>> {
    const { data, meta } = await this.roleService.getRoles(query);

    return successResponse(data, 'Role list retrieved successfully', meta);
  }

  @Permission('ASSIGN_ROLE_PERMISSION', 'Roles', 'Assign Permission To Role')
  @Patch(':id/permissions')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Update and Assign permissions to a role' })
  @ApiParam({ name: 'id', description: 'Role ID (UUID)', example: 'role-123' })
  @ApiBody({ type: AssignPermissionToRoleDto })
  @ApiSimpleResponse({
    success: {
      status: 200,
      message: 'Permissions successfully assigned to the role',
      dataExample: ['perm-1', 'perm-2'],
    },
    notFound: { status: 404, message: 'Role Not Found' },
  })
  @Audit({
    entity: 'Roles',
    action: AuditAction.UPDATE,
    getEntityId: (args) => args[0]?.id,
    getChanges: (args, result) => ({
      before: args[1]?.oldData,
      after: result,
    }),
  })
  async updateRoleAndAssignPermissions(
    @Param('id') roleId: string,
    @Body() dto: AssignPermissionToRoleDto,
  ) {
    try {
      const {data, message} = await this.roleService.assignPermissionsToRole(
        roleId,
        dto,
      );

      return successResponse(data, message);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Permission('GET_ROLE_HAVE_PERMISSION', 'Roles', 'List Role Have Permission')
  @UseInterceptors(ClassSerializerInterceptor)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Get permissions for a role, grouped by module' })
  @ApiParam({ name: 'id', description: 'Role ID (UUID)', example: 'role-123' })
  @ApiResponseModel(GroupedPermissionDto)
  @Get(':id/permissions')
  @Audit({
    entity: 'Roles-Permissions',
    action: AuditAction.SHOW,
    getEntityId: (args) => args[0]?.id,
  })
  async getRolePermissionsHandler(
    @Param('id') roleId: string,
  ): Promise<GlobalResponse<GroupedPermissionDto[]>> {
    try {
      const permissions = await this.roleService.getRolePermissions(roleId);

      return successResponse(permissions, 'Success get role permissions');
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Permission('CREATE_ROLE', 'Roles', 'Mengizinkan untuk membuat role baru')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponseModel(null, 201)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new role' })
  @Post()
  @Audit({
    entity: 'Roles',
    action: AuditAction.CREATE,
    getChanges: (_, result) => ({
      before: null,
      after: result,
    }),
  })
  async store(@Body() dto: CreateRoleDto) {
    const create = await this.roleService.createRole(dto);

   return successResponse(null, create, null, 201);
  }
}
